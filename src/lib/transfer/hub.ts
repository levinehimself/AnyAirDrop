import { Emitter } from './emitter';
import { IceProvider, iceEndpoint } from './ice';
import { loadIdentity, randomHex, type Identity } from './identity';
import { PeerLink } from './link';
import { SignalingRoom, type RemotePeer } from './signaling';
import { IncomingTransfer, OutgoingTransfer, parseControl, validateOffer } from './transfer';
import { isToken } from './trusted';

export type HubStatus = 'connecting' | 'online' | 'offline';
export type { RemotePeer };

export type TrustAnswer = 'accepted' | 'declined' | 'timeout' | 'cancelled';

type HubEvents = {
  peers: [RemotePeer[]];
  status: [HubStatus];
  incoming: [IncomingTransfer];
  trustoffer: [peer: RemotePeer, xid: string, token: string, auto: boolean];
  trustcancelled: [xid: string];
  trustrevoked: [token: string];
};

const TRUST_ANSWER_MS = 60_000;
const trustRoom = (token: string): string => `trust:${token}`;

interface PeerEntry {
  info: RemotePeer;
  rooms: Set<string>;
}

export class Hub extends Emitter<HubEvents> {
  readonly me: Identity = loadIdentity();
  status: HubStatus = 'connecting';
  private rooms = new Map<string, SignalingRoom>();
  private peers = new Map<string, PeerEntry>();
  private links = new Map<string, PeerLink>();
  private lastRoom = new Map<string, string>();
  private outgoing = new Map<string, OutgoingTransfer>();
  private incoming = new Map<string, IncomingTransfer>();
  private pendingTrust = new Map<string, (answer: TrustAnswer) => void>();
  private readonly ice: IceProvider;
  private readonly forceRelay: boolean;

  constructor(
    private readonly endpoint: string,
    options: { forceRelay?: boolean } = {},
  ) {
    super();
    this.forceRelay = options.forceRelay ?? false;
    this.ice = new IceProvider(iceEndpoint(endpoint));
    this.ice.on('updated', (servers) => {
      for (const link of this.links.values()) link.updateIceServers(servers);
    });
  }

  get relayAvailable(): boolean {
    return this.ice.relay;
  }

  start(): void {
    this.ice.start();
    this.addRoom('net', this.endpoint);
  }

  joinPair(code: string): void {
    const key = `pair:${code}`;
    if (!this.rooms.has(key)) this.addRoom(key, `${this.endpoint}?pair=${code}`);
  }

  joinTrust(token: string): void {
    if (!isToken(token)) return;
    const key = trustRoom(token);
    if (!this.rooms.has(key)) this.addRoom(key, `${this.endpoint}?trust=${token}`);
  }

  leaveTrust(token: string): void {
    const key = trustRoom(token);
    const room = this.rooms.get(key);
    if (!room) return;
    this.rooms.delete(key);
    room.close();
    for (const entry of this.peers.values()) entry.rooms.delete(key);
    this.prune();
  }

  trustedPeer(token: string): RemotePeer | undefined {
    const key = trustRoom(token);
    for (const entry of this.peers.values()) if (entry.rooms.has(key)) return entry.info;
    return undefined;
  }

  trustTokenOf(peerId: string): string | null {
    for (const key of this.peers.get(peerId)?.rooms ?? []) {
      if (key.startsWith('trust:')) return key.slice('trust:'.length);
    }
    return null;
  }

  async offerTrust(
    peerId: string,
    signal?: AbortSignal,
    auto = false,
  ): Promise<{ answer: TrustAnswer; token: string }> {
    if (!this.peers.has(peerId)) throw new Error('peer-gone');
    const link = this.link(peerId);
    const token = randomHex(32);
    const xid = randomHex(8);
    await link.ready();

    const answer = new Promise<TrustAnswer>((resolve) => {
      const finish = (result: TrustAnswer): void => {
        clearTimeout(timer);
        signal?.removeEventListener('abort', onAbort);
        this.pendingTrust.delete(xid);
        resolve(result);
      };
      const onAbort = (): void => {
        try {
          link.sendJSON({ t: 'trust-cancel', xid });
        } catch {
        }
        finish('cancelled');
      };
      const timer = setTimeout(() => finish('timeout'), TRUST_ANSWER_MS);
      this.pendingTrust.set(xid, finish);
      signal?.addEventListener('abort', onAbort);
    });
    link.sendJSON(auto ? { t: 'trust-offer', xid, token, auto: true } : { t: 'trust-offer', xid, token });

    const result = await answer;
    if (result === 'accepted') this.joinTrust(token);
    return { answer: result, token };
  }

  answerTrust(peerId: string, xid: string, token: string, accepted: boolean): void {
    try {
      this.links.get(peerId)?.sendJSON({ t: accepted ? 'trust-accept' : 'trust-decline', xid });
    } catch {
    }
    if (accepted) this.joinTrust(token);
  }

  async revokeTrust(token: string): Promise<void> {
    const key = trustRoom(token);
    const ids = [...this.peers].filter(([, entry]) => entry.rooms.has(key)).map(([id]) => id);
    await Promise.all(
      ids.map(async (id) => {
        try {
          const link = this.link(id);
          await link.ready(5000);
          link.sendJSON({ t: 'trust-revoke', xid: randomHex(8), token });
        } catch {
        }
      }),
    );
    this.leaveTrust(token);
  }

  rename(name: string): void {
    this.me.name = name;
    for (const room of this.rooms.values()) room.rehello();
  }

  stop(): void {
    this.ice.stop();
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

    const link = new PeerLink(peerId, this.me.id, (data) => this.signalTo(peerId, data), {
      iceServers: this.ice.servers,
      forceRelay: this.forceRelay,
    });
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

    if (msg.t === 'trust-offer') {
      if (!isToken(msg.token)) return;
      const peer = this.peers.get(peerId)?.info;
      if (peer) this.emit('trustoffer', peer, msg.xid, msg.token, msg.auto === true);
      return;
    }
    if (msg.t === 'trust-accept' || msg.t === 'trust-decline') {
      this.pendingTrust.get(msg.xid)?.(msg.t === 'trust-accept' ? 'accepted' : 'declined');
      return;
    }
    if (msg.t === 'trust-cancel') {
      this.emit('trustcancelled', msg.xid);
      return;
    }
    if (msg.t === 'trust-revoke') {
      if (isToken(msg.token) && this.peers.get(peerId)?.rooms.has(trustRoom(msg.token))) {
        this.emit('trustrevoked', msg.token);
      }
      return;
    }

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

export function signalingEndpoint(): string {
  const configured = import.meta.env.PUBLIC_SIGNAL_URL as string | undefined;
  if (configured) return configured;
  const scheme = location.protocol === 'https:' ? 'wss' : 'ws';
  return `${scheme}://${location.host}/ws`;
}
