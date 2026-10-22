import { DurableObject } from 'cloudflare:workers';
import { handleIce, type IceEnv } from './ice';

export interface Env extends IceEnv {
  ROOMS: DurableObjectNamespace<Room>;
}

interface Peer {
  id: string;
  name: string;
  device: string;
  os: string;
  browser: string;
}

const MAX_PEERS_PER_ROOM = 40;
const MAX_MESSAGE_BYTES = 64 * 1024;

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    // The trailing-slash form matches the site's URL style, so it passes the Astro dev proxy.
    if (url.pathname === '/ws/ice' || url.pathname === '/ws/ice/') return handleIce(request, env);
    if (url.pathname === '/ws/whoami' || url.pathname === '/ws/whoami/') return whoami(request);
    if (url.pathname !== '/ws') return new Response('Not found', { status: 404 });
    if (request.headers.get('Upgrade') !== 'websocket') {
      return new Response('Expected a WebSocket upgrade', { status: 426 });
    }

    // A pairing code puts two devices in their own room, wherever they are.
    // Without one, devices behind the same network address share a room.
    const code = url.searchParams.get('pair');
    let room: string;
    if (code !== null) {
      if (!/^\d{6}$/.test(code)) return new Response('Invalid pairing code', { status: 400 });
      room = `pair:${code}`;
    } else {
      room = `net:${await networkKey(request.headers.get('CF-Connecting-IP'))}`;
    }

    const stub = env.ROOMS.get(env.ROOMS.idFromName(room));
    return stub.fetch(request);
  },
} satisfies ExportedHandler<Env>;

export class Room extends DurableObject<Env> {
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    // Keep-alive pings are answered without waking the object.
    ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair('ping', 'pong'));
  }

  async fetch(): Promise<Response> {
    if (this.ctx.getWebSockets().length >= MAX_PEERS_PER_ROOM) {
      return new Response('Room is full', { status: 429 });
    }
    const { 0: client, 1: server } = new WebSocketPair();
    this.ctx.acceptWebSocket(server);
    server.serializeAttachment(null);
    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(ws: WebSocket, raw: string | ArrayBuffer): Promise<void> {
    if (typeof raw !== 'string' || raw.length > MAX_MESSAGE_BYTES) return;
    let msg: Record<string, unknown>;
    try {
      msg = JSON.parse(raw);
    } catch {
      return;
    }
    const me = ws.deserializeAttachment() as Peer | null;

    if (msg.type === 'hello') {
      const peer = toPeer(msg);
      if (!peer) return;
      // A reload or reconnect replaces the old socket for the same device.
      for (const other of this.ctx.getWebSockets()) {
        if (other !== ws && (other.deserializeAttachment() as Peer | null)?.id === peer.id) {
          other.serializeAttachment(null);
          other.close(4000, 'replaced');
        }
      }
      ws.serializeAttachment(peer);
      ws.send(JSON.stringify({ type: 'peers', peers: this.peers(ws) }));
      this.broadcast(ws, { type: 'peer-joined', peer });
      return;
    }

    if (msg.type === 'signal' && me && typeof msg.to === 'string') {
      const target = this.socketFor(msg.to);
      target?.send(JSON.stringify({ type: 'signal', from: me.id, data: msg.data }));
    }
  }

  async webSocketClose(ws: WebSocket, code: number, reason: string): Promise<void> {
    this.leave(ws);
    try {
      ws.close(code, reason);
    } catch {
      // Already closed.
    }
  }

  async webSocketError(ws: WebSocket): Promise<void> {
    this.leave(ws);
  }

  private leave(ws: WebSocket): void {
    const me = ws.deserializeAttachment() as Peer | null;
    ws.serializeAttachment(null);
    if (me) this.broadcast(ws, { type: 'peer-left', id: me.id });
  }

  private peers(exclude: WebSocket): Peer[] {
    const list: Peer[] = [];
    for (const ws of this.ctx.getWebSockets()) {
      const peer = ws.deserializeAttachment() as Peer | null;
      if (ws !== exclude && peer) list.push(peer);
    }
    return list;
  }

  private socketFor(id: string): WebSocket | undefined {
    return this.ctx
      .getWebSockets()
      .find((ws) => (ws.deserializeAttachment() as Peer | null)?.id === id);
  }

  private broadcast(from: WebSocket, msg: unknown): void {
    const text = JSON.stringify(msg);
    for (const ws of this.ctx.getWebSockets()) {
      if (ws === from || !ws.deserializeAttachment()) continue;
      try {
        ws.send(text);
      } catch {
        // The socket is closing; its close handler will clean up.
      }
    }
  }
}

function clean(value: unknown, max: number): string {
  return typeof value === 'string' ? value.replace(/[\u0000-\u001f]/g, '').slice(0, max) : '';
}

function toPeer(msg: Record<string, unknown>): Peer | null {
  const id = clean(msg.id, 32);
  if (!/^[a-f0-9]{16,32}$/.test(id)) return null;
  return {
    id,
    name: clean(msg.name, 40) || 'Unknown device',
    device: clean(msg.device, 12),
    os: clean(msg.os, 20),
    browser: clean(msg.browser, 20),
  };
}

// Devices on one Wi-Fi share a public IPv4 address, or an IPv6 /64 prefix. The key is
// hashed so raw addresses never become room names. Private and loopback addresses
// (local development) all share one room.
async function networkKey(ip: string | null): Promise<string> {
  if (!ip || isPrivate(ip)) return 'local';
  let basis = ip;
  const mapped = ip.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/i);
  if (mapped) basis = mapped[1];
  else if (ip.includes(':')) basis = ipv6Prefix64(ip);
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`anyairdrop:${basis}`));
  return [...new Uint8Array(digest)]
    .slice(0, 16)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function isPrivate(ip: string): boolean {
  if (/^(10\.|127\.|192\.168\.|169\.254\.)/.test(ip)) return true;
  const m = ip.match(/^172\.(\d+)\./);
  if (m && Number(m[1]) >= 16 && Number(m[1]) <= 31) return true;
  const lower = ip.toLowerCase();
  return lower === '::1' || lower.startsWith('fc') || lower.startsWith('fd') || lower.startsWith('fe80');
}

function ipv6Prefix64(ip: string): string {
  const [head, tail = ''] = ip.toLowerCase().split('::');
  const headParts = head ? head.split(':') : [];
  const tailParts = tail ? tail.split(':') : [];
  const missing = 8 - headParts.length - tailParts.length;
  const full = [...headParts, ...Array(Math.max(0, missing)).fill('0'), ...tailParts];
  return full.slice(0, 4).map((part) => part.padStart(4, '0')).join(':');
}

// Diagnostics for "why don't my two devices see each other?": which address family this
// connection arrives on and a short label for the shared-network room it would join.
// Devices only find each other automatically when their labels match. The address itself
// is never returned.
async function whoami(request: Request): Promise<Response> {
  const site = request.headers.get('Sec-Fetch-Site');
  if (site && site !== 'same-origin' && site !== 'none') return new Response('Forbidden', { status: 403 });
  const ip = request.headers.get('CF-Connecting-IP');
  const key = await networkKey(ip);
  const family = !ip ? 'unknown' : isPrivate(ip) ? 'private' : ip.includes(':') && !/^::ffff:/i.test(ip) ? 'ipv6' : 'ipv4';
  return new Response(JSON.stringify({ family, group: key.slice(0, 6) }), {
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}
