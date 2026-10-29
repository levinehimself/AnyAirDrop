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

const NAME_KEY = 'anyairdrop:devicename';
export const MAX_NAME_LENGTH = 24;

export function cleanName(raw: string): string {
  return raw.replace(/[\u0000-\u001f\u007f]/g, '').replace(/\s+/g, ' ').trim().slice(0, MAX_NAME_LENGTH);
}

function savedName(): string {
  try {
    return cleanName(localStorage.getItem(NAME_KEY) ?? '');
  } catch {
    return '';
  }
}

export function saveName(raw: string): string {
  const name = cleanName(raw);
  try {
    if (name) {
      localStorage.setItem(NAME_KEY, name);
      sessionStorage.setItem('anyairdrop:name', name);
    } else {
      localStorage.removeItem(NAME_KEY);
      sessionStorage.removeItem('anyairdrop:name');
    }
  } catch {
  }
  return name || sessionValue('anyairdrop:name', randomName);
}

function randomName(): string {
  return `${pick(ADJECTIVES)} ${pick(ANIMALS)}`;
}

export function loadIdentity(): Identity {
  return {
    id: sessionValue('anyairdrop:id', () => randomHex(16)),
    name: savedName() || sessionValue('anyairdrop:name', randomName),
    ...detectDevice(),
  };
}
