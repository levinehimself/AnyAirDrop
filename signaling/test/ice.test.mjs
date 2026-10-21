// Checks the relay-credential endpoint. Works with or without a TURN key configured.
const base = process.argv[2] ?? 'http://127.0.0.1:8787/ws/ice/';
const results = [];
const check = (name, ok) => results.push(`${ok ? 'PASS' : 'FAIL'}  ${name}`);

const same = await fetch(base, { headers: { 'Sec-Fetch-Site': 'same-origin' } });
if (same.status === 429) {
  console.log('Rate limited: wait a minute and run again.');
  process.exit(1);
}
const body = await same.json().catch(() => null);
check('Same-origin GET returns 200 JSON', same.status === 200 && body !== null);
check('Response lists ICE servers', Array.isArray(body?.iceServers) && body.iceServers.length > 0);
check('Response says whether a relay is available', typeof body?.relay === 'boolean');
check('Credentials expire in the future', typeof body?.expiresAt === 'number' && body.expiresAt > Date.now());
check('Response is never cached', same.headers.get('cache-control') === 'no-store');
const urls = (body?.iceServers ?? []).flatMap((s) => (Array.isArray(s.urls) ? s.urls : [s.urls]));
check('Blocked port 53 is filtered out', !urls.some((u) => /:53(\?|$)/.test(u)));
if (body?.relay) {
  const turn = body.iceServers.find((s) => (Array.isArray(s.urls) ? s.urls : [s.urls]).some((u) => u.startsWith('turn')));
  check('Relay entry carries a username and credential', Boolean(turn?.username && turn?.credential));
}

const cross = await fetch(base, { headers: { 'Sec-Fetch-Site': 'cross-site', Origin: 'https://example.com' } });
check('Cross-site browser request is refused', cross.status === 403);

const post = await fetch(base, { method: 'POST' });
check('POST is not allowed', post.status === 405);

console.log(`relay ${body?.relay ? 'configured' : 'not configured (STUN only)'}\n${results.join('\n')}`);
process.exit(results.some((r) => r.startsWith('FAIL')) ? 1 : 0);
