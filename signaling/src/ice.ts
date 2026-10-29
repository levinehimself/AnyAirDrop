
export interface IceEnv {
  ICE_LIMITER?: RateLimit;
  TURN_KEY_ID?: string;
  TURN_KEY_API_TOKEN?: string;
  TURN_TTL?: string;
  TURN_API_BASE?: string;
  ALLOWED_ORIGINS?: string;
}

interface IceServer {
  urls: string | string[];
  username?: string;
  credential?: string;
}

const STUN_ONLY: IceServer[] = [{ urls: ['stun:stun.cloudflare.com:3478'] }];
const DEFAULT_TTL_SECONDS = 4 * 60 * 60;
const MIN_TTL_SECONDS = 10 * 60;
const MAX_TTL_SECONDS = 48 * 60 * 60;
const RETRY_AFTER_ERROR_MS = 10 * 60 * 1000;

export async function handleIce(request: Request, env: IceEnv): Promise<Response> {
  const cors = corsHeaders(request, env);
  if (cors === null) return new Response('Forbidden', { status: 403 });
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: { ...cors, 'Access-Control-Allow-Methods': 'GET', 'Access-Control-Max-Age': '86400' },
    });
  }
  if (request.method !== 'GET') {
    return new Response('Method not allowed', { status: 405, headers: { Allow: 'GET, OPTIONS' } });
  }

  if (env.ICE_LIMITER) {
    const ip = request.headers.get('CF-Connecting-IP') ?? 'unknown';
    const { success } = await env.ICE_LIMITER.limit({ key: `ice:${ip}` });
    if (!success) return json({ error: 'rate-limited' }, 429, cors);
  }

  const ttl = ttlSeconds(env.TURN_TTL);
  if (!env.TURN_KEY_ID || !env.TURN_KEY_API_TOKEN) {
    return json({ iceServers: STUN_ONLY, relay: false, expiresAt: Date.now() + ttl * 1000 }, 200, cors);
  }

  try {
    const base = (env.TURN_API_BASE || 'https://rtc.live.cloudflare.com').replace(/\/$/, '');
    const response = await fetch(
      `${base}/v1/turn/keys/${encodeURIComponent(env.TURN_KEY_ID)}/credentials/generate-ice-servers`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${env.TURN_KEY_API_TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ttl }),
      },
    );
    if (!response.ok) throw new Error(`TURN API responded ${response.status}`);
    const data = (await response.json()) as { iceServers?: unknown };
    const iceServers = sanitize(data.iceServers);
    const relay = iceServers.some((server) => urlList(server).some((url) => url.startsWith('turn')));
    if (!relay) throw new Error('TURN API returned no relay servers');
    return json({ iceServers, relay, expiresAt: Date.now() + ttl * 1000 }, 200, cors);
  } catch (err) {
    console.error('[ice] serving STUN only:', err instanceof Error ? err.message : String(err));
    return json({ iceServers: STUN_ONLY, relay: false, expiresAt: Date.now() + RETRY_AFTER_ERROR_MS }, 200, cors);
  }
}

function corsHeaders(request: Request, env: IceEnv): Record<string, string> | null {
  const origin = request.headers.get('Origin');
  const allowed = (env.ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  if (origin && allowed.includes(origin)) return { 'Access-Control-Allow-Origin': origin, Vary: 'Origin' };
  const site = request.headers.get('Sec-Fetch-Site');
  if (!site || site === 'same-origin' || site === 'none') return {};
  return null;
}

function ttlSeconds(raw: string | undefined): number {
  const value = Number(raw);
  if (!Number.isFinite(value) || value <= 0) return DEFAULT_TTL_SECONDS;
  return Math.min(MAX_TTL_SECONDS, Math.max(MIN_TTL_SECONDS, Math.floor(value)));
}

function urlList(server: IceServer): string[] {
  return Array.isArray(server.urls) ? server.urls : [server.urls];
}

function sanitize(input: unknown): IceServer[] {
  if (!Array.isArray(input)) return [];
  const servers: IceServer[] = [];
  for (const entry of input as Partial<IceServer>[]) {
    if (!entry || (typeof entry.urls !== 'string' && !Array.isArray(entry.urls))) continue;
    const urls = (Array.isArray(entry.urls) ? entry.urls : [entry.urls]).filter(
      (url): url is string => typeof url === 'string' && /^(stun|turns?):/.test(url) && !/:53(\?|$)/.test(url),
    );
    if (urls.length === 0) continue;
    const server: IceServer = { urls };
    if (typeof entry.username === 'string') server.username = entry.username;
    if (typeof entry.credential === 'string') server.credential = entry.credential;
    servers.push(server);
  }
  return servers;
}

function json(body: unknown, status: number, headers: Record<string, string>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}
