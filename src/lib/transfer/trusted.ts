/**
 * Trusted devices. Two devices that trust each other share a secret room token. Each
 * joins that room whenever AnyAirDrop.com is open, so they find each other on any
 * network, including through different VPNs. The token never leaves the two devices
 * except as the name of that room.
 */
export interface TrustedDevice {
  /** 64 hex characters: the secret name of the shared signaling room. */
  token: string;
  name: string;
  device: string;
  os: string;
  /** Accept transfers from this device without asking. Off unless the person turns it on. */
  autoAccept: boolean;
  addedAt: number;
}

/** A trusted device plus whether it is online right now (for the list on screen). */
export interface TrustedRow extends TrustedDevice {
  online: boolean;
}

const KEY = 'anyairdrop:trusted';
const MAX_TRUSTED = 20;

export function isToken(value: unknown): value is string {
  return typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
}

export function loadTrusted(): TrustedDevice[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(KEY) ?? '[]');
    if (!Array.isArray(parsed)) return [];
    const seen = new Set<string>();
    const list: TrustedDevice[] = [];
    for (const item of parsed as Partial<TrustedDevice>[]) {
      if (!isToken(item?.token) || seen.has(item.token)) continue;
      seen.add(item.token);
      list.push({
        token: item.token,
        name: typeof item.name === 'string' ? item.name.slice(0, 40) : 'Trusted device',
        device: typeof item.device === 'string' ? item.device.slice(0, 12) : '',
        os: typeof item.os === 'string' ? item.os.slice(0, 20) : '',
        autoAccept: item.autoAccept === true,
        addedAt: typeof item.addedAt === 'number' ? item.addedAt : 0,
      });
    }
    return list.slice(0, MAX_TRUSTED);
  } catch {
    return [];
  }
}

/** Returns false when the browser would not store the list (private mode, blocked data). */
export function saveTrusted(list: TrustedDevice[]): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX_TRUSTED)));
    return true;
  } catch {
    return false;
  }
}

const AUTO_KEY = 'anyairdrop:autotrust';

/** After a completed transfer, remember the other device as trusted. On unless switched off. */
export function loadAutoTrust(): boolean {
  try {
    return localStorage.getItem(AUTO_KEY) !== 'off';
  } catch {
    return true;
  }
}

export function saveAutoTrust(on: boolean): void {
  try {
    if (on) localStorage.removeItem(AUTO_KEY);
    else localStorage.setItem(AUTO_KEY, 'off');
  } catch {
    // Storage blocked: the choice lasts until the page is closed.
  }
}

export function canStoreTrusted(): boolean {
  try {
    const probe = 'anyairdrop:probe';
    localStorage.setItem(probe, '1');
    localStorage.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}

export const TRUSTED_LIMIT = MAX_TRUSTED;
