import { Emitter } from './emitter';
import { loadIdentity, type Identity } from './identity';
import { PeerLink } from './link';
import { SignalingRoom, type RemotePeer } from './signaling';
import { IncomingTransfer, OutgoingTransfer, parseControl, validateOffer } from './transfer';

export type HubStatus = 'connecting' | 'online' | 'offline';
export type { RemotePeer };

type HubEvents = {
  peers: [RemotePeer[]];
  status: [HubStatus];
  incoming: [IncomingTransfer];
};

interface PeerEntry {
  info: RemotePeer;
  rooms: Set<string>;
}

/**
 * The transfer engine's front door: joins signaling rooms, tracks nearby devices,
 * opens WebRTC links on demand and routes transfer messages to the right transfer.
 */
export class Hub extends Emitter<HubEvents> {
  readonly me: Identity = loadIdentity();
  status: HubStatus = 'connecting';
  private rooms = new Map<string, SignalingRoom>();
  private peers = new Map<string, PeerEntry>();
  private links = new Map<string, PeerLink>();
  private lastRoom = new Map<string, string>();
  private outgoing = new Map<string, OutgoingTransfer>();
  private incoming = new Map<string, IncomingTransfer>();

  constructor(private readonly endpoint: string) {
    super();
  }

  start(): void {
    this.addRoom('net', this.endpoint);
  }

  /** Joins a private room shared with whoever enters the same six-digit code. */
  joinPair(code: string): void {
    const key = `pair:${code}`;
    if (!this.rooms.has(key)) this.addRoom(key, `${this.endpoint}?pair=${code}`);
  }

  stop(): void {
    for (const room of this.rooms.values()) room.close();
    for (const link of this.links.values()) link.close();
    this.rooms.clear();
    this.links.clear();
  }

  list(): RemotePeer[] {
    return [...this.peers.values()].map((entry) => entry.info);
  }

  isBusy(peerId: string): boolean {
    return this.outgoing.has(peerId) || this.incoming.has(peerId);
  }

  send(peerId: string, files: File[]): OutgoingTransfer {
    const peer = this.peers.get(peerId)?.info;
    if (!peer) throw new Error('peer-gone');
    if (this.isBusy(peerId)) throw new Error('busy');
    const transfer = new OutgoingTransfer(this.link(peerId), peer, files);
    this.outgoing.set(peerId, transfer);
    transfer.onSettled = () => {
      if (this.outgoing.get(peerId) === transfer) this.outgoing.delete(peerId);
    };
    return transfer;
  }

  private addRoom(key: string, url: string): void {
    const room = new SignalingRoom(url, this.me);
    this.rooms.set(key, room);
    room.on('open', () => this.refreshStatus());
    room.on('close', () => {
      for (const entry of this.peers.values()) entry.rooms.delete(key);
      this.prune();
      this.refreshStatus();
    });
    room.on('peers', (list) => {
      for (const entry of this.peers.values()) entry.rooms.delete(key);
      for (const peer of list) this.addPeer(peer, key);
      this.prune();
    });
    room.on('joined', (peer) => {
      this.addPeer(peer, key);
      this.publish();
    });
    room.on('left', (id) => {
      this.peers.get(id)?.rooms.delete(key);
      this.prune();
    });
    room.on('signal', (from, data) => {
      this.lastRoom.set(from, key);
      this.link(from).handleSignal(data as Parameters<PeerLink['handleSignal']>[0]);
    });
    room.connect();
  }

  private addPeer(peer: RemotePeer, room: string): void {
    if (peer.id === this.me.id) return;
    const entry = this.peers.get(peer.id);
    if (entry) {
      entry.info = peer;
      entry.rooms.add(room);
    } else {
      this.peers.set(peer.id, { info: peer, rooms: new Set([room]) });
    }
  }

  private prune(): void {
    for (const [id, entry] of this.peers) {
      if (entry.rooms.size > 0) continue;
      this.peers.delete(id);
      // An open link can finish its transfer even after the device leaves signaling.
      if (!this.isBusy(id)) {
        this.links.get(id)?.close();
        this.links.delete(id);
      }
    }
    this.publish();
  }

  private publish(): void {
    this.emit('peers', this.list());
  }

  private refreshStatus(): void {
    const next: HubStatus = this.rooms.get('net')?.connected ? 'online' : 'offline';
    if (next !== this.status) {
      this.status = next;
      this.emit('status', next);
    }
  }

  private link(peerId: string): PeerLink {
    const existing = this.links.get(peerId);
    if (existing && !existing.isDead) return existing;
    existing?.close();

    const link = new PeerLink(peerId, this.me.id, (data) => this.signalTo(peerId, data));
    link.on('message', (data) => this.onMessage(peerId, link, data));
    link.on('closed', () => {
      this.incoming.get(peerId)?.fail('connection-lost');
      this.outgoing.get(peerId)?.cancel('connection-lost');
      if (this.links.get(peerId) === link) this.links.delete(peerId);
    });
    this.links.set(peerId, link);
    return link;
  }

  private signalTo(peerId: string, data: unknown): void {
    const rooms = this.peers.get(peerId)?.rooms;
    const key = rooms?.has('net') ? 'net' : (rooms && [...rooms][0]) || this.lastRoom.get(peerId);
    if (key) this.rooms.get(key)?.send(peerId, data);
  }

  private onMessage(peerId: string, link: PeerLink, data: string | ArrayBuffer): void {
    if (typeof data !== 'string') {
      this.incoming.get(peerId)?.handle(data);
      return;
    }
    const msg = parseControl(data);
    if (!msg) return;

    if (msg.t === 'offer') {
      const offer = validateOffer(msg);
      if (!offer) return;
      if (this.isBusy(peerId)) {
        link.sendJSON({ t: 'busy', xid: msg.xid });
        return;
      }
      const peer = this.peers.get(peerId)?.info ?? {
        id: peerId,
        name: 'A nearby device',
        device: 'laptop',
        os: '',
        browser: '',
      };
      const transfer = new IncomingTransfer(link, peer, msg.xid, offer.files, offer.total, this.me.id);
      this.incoming.set(peerId, transfer);
      transfer.onSettled = () => {
        if (this.incoming.get(peerId) === transfer) this.incoming.delete(peerId);
      };
      this.emit('incoming', transfer);
      return;
    }

    const incoming = this.incoming.get(peerId);
    if (incoming?.xid === msg.xid) {
      incoming.handle(msg);
      return;
    }
    const outgoing = this.outgoing.get(peerId);
    if (outgoing?.xid === msg.xid) outgoing.handle(msg);
  }
}

/** The signaling endpoint: same origin by default, overridable at build time. */
export function signalingEndpoint(): string {
  const configured = import.meta.env.PUBLIC_SIGNAL_URL as string | undefined;
  if (configured) return configured;
  const scheme = location.protocol === 'https:' ? 'wss' : 'ws';
  return `${scheme}://${location.host}/ws`;
}
