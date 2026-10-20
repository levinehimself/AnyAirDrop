import { Emitter } from './emitter';
import type { Identity } from './identity';

export interface RemotePeer {
  id: string;
  name: string;
  device: string;
  os: string;
  browser: string;
}

type SignalingEvents = {
  open: [];
  close: [];
  peers: [RemotePeer[]];
  joined: [RemotePeer];
  left: [string];
  signal: [from: string, data: unknown];
};

const PING_MS = 25_000;
const MAX_BACKOFF_MS = 15_000;

/** One WebSocket to one signaling room, with keep-alive and automatic reconnect. */
export class SignalingRoom extends Emitter<SignalingEvents> {
  private ws: WebSocket | null = null;
  private attempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | undefined;
  private pingTimer: ReturnType<typeof setInterval> | undefined;
  private stopped = false;
  connected = false;

  constructor(
    private readonly url: string,
    private readonly me: Identity,
  ) {
    super();
  }

  connect(): void {
    this.stopped = false;
    this.open();
  }

  send(to: string, data: unknown): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'signal', to, data }));
    }
  }

  close(): void {
    this.stopped = true;
    clearTimeout(this.reconnectTimer);
    clearInterval(this.pingTimer);
    this.ws?.close();
  }

  private open(): void {
    const ws = new WebSocket(this.url);
    this.ws = ws;

    ws.onopen = () => {
      this.attempts = 0;
      this.connected = true;
      const { id, name, device, os, browser } = this.me;
      ws.send(JSON.stringify({ type: 'hello', id, name, device, os, browser }));
      this.pingTimer = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) ws.send('ping');
      }, PING_MS);
      this.emit('open');
    };

    ws.onmessage = (event) => {
      if (typeof event.data !== 'string' || event.data === 'pong') return;
      let msg: { type?: string; peers?: RemotePeer[]; peer?: RemotePeer; id?: string; from?: string; data?: unknown };
      try {
        msg = JSON.parse(event.data);
      } catch {
        return;
      }
      if (msg.type === 'peers' && msg.peers) this.emit('peers', msg.peers);
      else if (msg.type === 'peer-joined' && msg.peer) this.emit('joined', msg.peer);
      else if (msg.type === 'peer-left' && msg.id) this.emit('left', msg.id);
      else if (msg.type === 'signal' && msg.from) this.emit('signal', msg.from, msg.data);
    };

    ws.onclose = (event) => {
      clearInterval(this.pingTimer);
      const wasConnected = this.connected;
      this.connected = false;
      if (wasConnected || this.attempts === 0) this.emit('close');
      // 4000 = another tab with the same device id took over this connection.
      if (this.stopped || event.code === 4000) return;
      const delay = Math.min(MAX_BACKOFF_MS, 500 * 2 ** this.attempts++);
      this.reconnectTimer = setTimeout(() => this.open(), delay);
    };
  }
}
