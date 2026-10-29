import { Emitter } from './emitter';

export const FALLBACK_ICE: RTCIceServer[] = [
  { urls: ['stun:stun.cloudflare.com:3478', 'stun:stun.l.google.com:19302'] },
];

const RETRY_MS = 60_000;
const MAX_REFRESH_MARGIN_MS = 30 * 60 * 1000;

export class IceProvider extends Emitter<{ updated: [RTCIceServer[]] }> {
  servers: RTCIceServer[] = FALLBACK_ICE;
  relay = false;
  private timer: ReturnType<typeof setTimeout> | undefined;
  private stopped = false;

  constructor(private readonly url: string) {
    super();
  }

  start(): void {
    this.stopped = false;
    void this.load();
  }

  stop(): void {
    this.stopped = true;
    clearTimeout(this.timer);
  }

  private async load(): Promise<void> {
    let next = RETRY_MS;
    try {
      const response = await fetch(this.url, { cache: 'no-store', credentials: 'omit' });
      if (response.ok) {
        const data = (await response.json()) as { iceServers?: RTCIceServer[]; relay?: boolean; expiresAt?: number };
        if (Array.isArray(data.iceServers) && data.iceServers.length > 0) {
          this.servers = data.iceServers;
          this.relay = data.relay === true;
          this.emit('updated', this.servers);
          if (typeof data.expiresAt === 'number') {
            const remaining = data.expiresAt - Date.now();
            next = Math.max(RETRY_MS, remaining - Math.min(MAX_REFRESH_MARGIN_MS, remaining / 8));
          }
        }
      }
    } catch {
    }
    if (!this.stopped) this.timer = setTimeout(() => void this.load(), next);
  }
}

export function iceEndpoint(signalUrl: string): string {
  const url = new URL(signalUrl);
  url.protocol = url.protocol === 'wss:' ? 'https:' : 'http:';
  url.pathname = `${url.pathname.replace(/\/$/, '')}/ice/`;
  url.search = '';
  return url.toString();
}
