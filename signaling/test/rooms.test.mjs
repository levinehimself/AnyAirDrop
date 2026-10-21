// Exercises the signaling worker directly: pairing-room isolation, signal relay, leave events.
const base = process.argv[2] ?? 'ws://127.0.0.1:8787/ws';
const hex = (n) => [...crypto.getRandomValues(new Uint8Array(n))].map((b) => b.toString(16).padStart(2, '0')).join('');

function client(label, url) {
  const id = hex(16);
  const inbox = [];
  const ws = new WebSocket(url);
  const ready = new Promise((resolve, reject) => {
    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'hello', id, name: label, device: 'phone', os: 'Test', browser: 'Node' }));
      resolve();
    };
    ws.onerror = (e) => reject(new Error(`${label}: ${e.message ?? 'socket error'}`));
  });
  ws.onmessage = (e) => inbox.push(JSON.parse(e.data));
  return { id, label, ws, inbox, ready };
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
// Poll instead of sleeping a fixed time, so the test also works against the deployed
// worker, where messages take a network round trip.
async function until(predicate, ms = 4000) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    if (predicate()) return true;
    await wait(50);
  }
  return predicate();
}
const results = [];
const check = (name, ok) => results.push(`${ok ? 'PASS' : 'FAIL'}  ${name}`);

// Random codes, so a run against production never lands in a real user's pairing room.
const code = String(100000 + Math.floor(Math.random() * 800000));
const otherCode = String(Number(code) + 1);

const a = client('A', `${base}?pair=${code}`);
await a.ready;
await until(() => a.inbox.some((m) => m.type === 'peers'));
const b = client('B', `${base}?pair=${code}`);
const c = client('C', `${base}?pair=${otherCode}`);
await Promise.all([b.ready, c.ready]);

check('B sees A in the shared code room', await until(() => b.inbox.some((m) => m.type === 'peers' && m.peers.some((p) => p.id === a.id))));
check('A is told B joined', await until(() => a.inbox.some((m) => m.type === 'peer-joined' && m.peer.id === b.id)));
await until(() => c.inbox.some((m) => m.type === 'peers'));
const cPeers = c.inbox.find((m) => m.type === 'peers');
check('C (different code) sees nobody', cPeers && cPeers.peers.length === 0);
check('A is not told about C', !a.inbox.some((m) => m.type === 'peer-joined' && m.peer.id === c.id));

a.ws.send(JSON.stringify({ type: 'signal', to: b.id, data: { hello: 'offer' } }));
check('B receives A’s signal with sender id', await until(() => b.inbox.some((m) => m.type === 'signal' && m.from === a.id && m.data.hello === 'offer')));

a.ws.send(JSON.stringify({ type: 'signal', to: c.id, data: { sneaky: true } }));
await wait(1000);
check('C does not receive signals from another room', !c.inbox.some((m) => m.type === 'signal'));

const bad = new WebSocket(`${base}?pair=12ab`);
const badResult = await new Promise((r) => {
  bad.onopen = () => r('opened');
  bad.onerror = () => r('rejected');
  bad.onclose = () => r('rejected');
});
check('Malformed code is rejected', badResult === 'rejected');

b.ws.close();
check('A is told B left', await until(() => a.inbox.some((m) => m.type === 'peer-left' && m.id === b.id)));

a.ws.close();
c.ws.close();
console.log(results.join('\n'));
process.exit(results.some((r) => r.startsWith('FAIL')) ? 1 : 0);
