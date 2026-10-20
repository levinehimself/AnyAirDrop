export type DeviceKind = 'phone' | 'tablet' | 'laptop';

export interface Identity {
  id: string;
  name: string;
  device: DeviceKind;
  os: string;
  browser: string;
}

const ADJECTIVES = [
  'Amber', 'Azure', 'Blue', 'Copper', 'Coral', 'Crimson', 'Golden', 'Indigo', 'Ivory', 'Jade',
  'Lemon', 'Mint', 'Olive', 'Plum', 'Rose', 'Ruby', 'Sage', 'Silver', 'Slate', 'Teal',
];
const ANIMALS = [
  'Badger', 'Bison', 'Crane', 'Dolphin', 'Falcon', 'Finch', 'Fox', 'Gecko', 'Hare', 'Heron',
  'Koala', 'Lynx', 'Moose', 'Otter', 'Owl', 'Panda', 'Raven', 'Seal', 'Tiger', 'Wolf',
];

export function randomHex(bytes: number): string {
  const values = new Uint8Array(bytes);
  crypto.getRandomValues(values);
  return Array.from(values, (b) => b.toString(16).padStart(2, '0')).join('');
}

function pick<T>(list: readonly T[]): T {
  const n = new Uint32Array(1);
  crypto.getRandomValues(n);
  return list[n[0] % list.length];
}

// Per tab, so two tabs in one browser show up as two devices. Storage can be
// unavailable (private mode, blocked site data): fall back to a fresh value.
function sessionValue(key: string, make: () => string): string {
  try {
    const existing = sessionStorage.getItem(key);
    if (existing) return existing;
    const value = make();
    sessionStorage.setItem(key, value);
    return value;
  } catch {
    return make();
  }
}

export function detectDevice(
  ua: string = navigator.userAgent,
  touchPoints: number = navigator.maxTouchPoints ?? 0,
): Omit<Identity, 'id' | 'name'> {
  let device: DeviceKind = 'laptop';
  let os = 'Computer';
  if (/iPad/.test(ua) || (/Macintosh/.test(ua) && touchPoints > 1)) {
    device = 'tablet';
    os = 'iPad';
  } else if (/iPhone|iPod/.test(ua)) {
    device = 'phone';
    os = 'iPhone';
  } else if (/Android/.test(ua)) {
    device = /Mobile/.test(ua) ? 'phone' : 'tablet';
    os = 'Android';
  } else if (/CrOS/.test(ua)) {
    os = 'Chromebook';
  } else if (/Windows/.test(ua)) {
    os = 'Windows';
  } else if (/Macintosh|Mac OS X/.test(ua)) {
    os = 'Mac';
  } else if (/Linux/.test(ua)) {
    os = 'Linux';
  }

  let browser = 'Browser';
  if (/SamsungBrowser/.test(ua)) browser = 'Samsung Internet';
  else if (/Edg(e|A|iOS)?\//.test(ua)) browser = 'Edge';
  else if (/OPR\/|Opera/.test(ua)) browser = 'Opera';
  else if (/Firefox|FxiOS/.test(ua)) browser = 'Firefox';
  else if (/Chrome|CriOS/.test(ua)) browser = 'Chrome';
  else if (/Safari/.test(ua)) browser = 'Safari';

  return { device, os, browser };
}

export function loadIdentity(): Identity {
  return {
    id: sessionValue('anyairdrop:id', () => randomHex(16)),
    name: sessionValue('anyairdrop:name', () => `${pick(ADJECTIVES)} ${pick(ANIMALS)}`),
    ...detectDevice(),
  };
}
