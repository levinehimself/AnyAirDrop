import { Emitter } from './emitter';
import { FALLBACK_ICE } from './ice';

export type Route = 'lan' | 'internet' | 'relay' | 'unknown';

type LinkEvents = {
  message: [string | ArrayBuffer];
  state: [RTCPeerConnectionState];
  closed: [];
};

interface SignalData {
  description?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
}

export interface LinkOptions {
  iceServers?: RTCIceServer[];
  forceRelay?: boolean;
}

const HIGH_WATER = 4 * 1024 * 1024;
const LOW_WATER = 1024 * 1024;

export class PeerLink extends Emitter<LinkEvents> {
  readonly pc: RTCPeerConnection;
  readonly dc: RTCDataChannel;
  private readonly polite: boolean;
  private makingOffer = false;
  private ignoreOffer = false;
  private queue: Promise<void> = Promise.resolve();
  private readonly opened: Promise<void>;

  constructor(
    readonly peerId: string,
    myId: string,
    private readonly sendSignal: (data: SignalData) => void,
    { iceServers = FALLBACK_ICE, forceRelay = false }: LinkOptions = {},
  ) {
    super();
    this.polite = myId < peerId;
    this.pc = new RTCPeerConnection({ iceServers, iceTransportPolicy: forceRelay ? 'relay' : 'all' });
    this.dc = this.pc.createDataChannel('files', { negotiated: true, id: 0, ordered: true });
    this.dc.binaryType = 'arraybuffer';
    this.dc.bufferedAmountLowThreshold = LOW_WATER;

    this.opened = new Promise((resolve) => {
      if (this.dc.readyState === 'open') resolve();
      else this.dc.addEventListener('open', () => resolve(), { once: true });
    });

    this.dc.onmessage = (event) => this.emit('message', event.data);
    this.dc.onclose = () => this.emit('closed');

    this.pc.onicecandidate = ({ candidate }) => {
      if (candidate) this.sendSignal({ candidate: candidate.toJSON() });
    };

    this.pc.onnegotiationneeded = async () => {
      try {
        this.makingOffer = true;
        await this.pc.setLocalDescription();
        if (this.pc.localDescription) this.sendSignal({ description: this.pc.localDescription.toJSON() });
      } catch (err) {
        console.warn('[AnyAirDrop] negotiation failed', err);
      } finally {
        this.makingOffer = false;
      }
    };

    this.pc.onconnectionstatechange = () => {
      this.emit('state', this.pc.connectionState);
      if (this.pc.connectionState === 'failed') this.pc.restartIce();
    };
  }

  get isOpen(): boolean {
    return this.dc.readyState === 'open';
  }

  get isDead(): boolean {
    return this.dc.readyState === 'closed' || this.pc.connectionState === 'closed';
  }

  updateIceServers(iceServers: RTCIceServer[]): void {
    if (this.pc.signalingState === 'closed') return;
    try {
      this.pc.setConfiguration({ ...this.pc.getConfiguration(), iceServers });
    } catch (err) {
      console.warn('[AnyAirDrop] could not update ICE servers', err);
      return;
    }
    const state = this.pc.iceConnectionState;
    if (state === 'failed' || state === 'disconnected') this.pc.restartIce();
  }

  get chunkSize(): number {
    const max = this.pc.sctp?.maxMessageSize || 65536;
    return Math.max(16 * 1024, Math.min(64 * 1024, max));
  }

  handleSignal(data: SignalData): void {
    this.queue = this.queue
      .then(() => this.applySignal(data))
      .catch((err) => console.warn('[AnyAirDrop] signaling error', err));
  }

  private async applySignal({ description, candidate }: SignalData): Promise<void> {
    if (description) {
      const collision =
        description.type === 'offer' && (this.makingOffer || this.pc.signalingState !== 'stable');
      this.ignoreOffer = !this.polite && collision;
      if (this.ignoreOffer) return;
      await this.pc.setRemoteDescription(description);
      if (description.type === 'offer') {
        await this.pc.setLocalDescription();
        if (this.pc.localDescription) this.sendSignal({ description: this.pc.localDescription.toJSON() });
      }
    } else if (candidate) {
      try {
        await this.pc.addIceCandidate(candidate);
      } catch (err) {
        if (!this.ignoreOffer) throw err;
      }
    }
  }

  ready(timeoutMs = 20_000): Promise<void> {
    if (this.isOpen) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('connect-timeout')), timeoutMs);
      this.opened.then(() => {
        clearTimeout(timer);
        resolve();
      });
    });
  }

  sendJSON(message: unknown): void {
    this.dc.send(JSON.stringify(message));
  }

  async sendBinary(chunk: Uint8Array<ArrayBuffer>, signal?: AbortSignal): Promise<void> {
    if (this.dc.bufferedAmount > HIGH_WATER) {
      await new Promise<void>((resolve) => {
        const done = () => {
          this.dc.removeEventListener('bufferedamountlow', done);
          this.dc.removeEventListener('close', done);
          signal?.removeEventListener('abort', done);
          resolve();
        };
        this.dc.addEventListener('bufferedamountlow', done);
        this.dc.addEventListener('close', done);
        signal?.addEventListener('abort', done);
      });
    }
    if (signal?.aborted) return;
    if (!this.isOpen) throw new Error('channel-closed');
    this.dc.send(chunk);
  }

  async stats(): Promise<{ route: Route; rttMs: number | null; viaTcp: boolean }> {
    const stats = await this.pc.getStats();
    let pairId: string | undefined;
    stats.forEach((report) => {
      if (report.type === 'transport' && report.selectedCandidatePairId) pairId = report.selectedCandidatePairId;
    });
    let pair: { localCandidateId: string; remoteCandidateId: string; currentRoundTripTime?: number } | undefined;
    stats.forEach((report) => {
      if (report.type !== 'candidate-pair') return;
      if (report.id === pairId || (!pairId && report.nominated && report.state === 'succeeded')) pair = report;
    });
    if (!pair) return { route: 'unknown', rttMs: null, viaTcp: false };
    const local = stats.get(pair.localCandidateId);
    const remote = stats.get(pair.remoteCandidateId);
    const types = [local?.candidateType, remote?.candidateType];
    const route: Route = types.includes('relay') ? 'relay' : types.every((t) => t === 'host') ? 'lan' : 'internet';
    const rttMs = typeof pair.currentRoundTripTime === 'number' ? Math.round(pair.currentRoundTripTime * 1000) : null;
    const viaTcp = local?.protocol === 'tcp' || (local?.relayProtocol !== undefined && local.relayProtocol !== 'udp');
    return { route, rttMs, viaTcp };
  }

  async route(): Promise<Route> {
    return (await this.stats()).route;
  }

  close(): void {
    this.dc.close();
    this.pc.close();
  }
}
