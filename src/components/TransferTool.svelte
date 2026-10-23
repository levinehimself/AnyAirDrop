<script lang="ts">
  import { onMount } from 'svelte';
  import { Hub, signalingEndpoint, type HubStatus, type RemotePeer } from '../lib/transfer/hub';
  import type { IncomingTransfer, OutgoingTransfer, ReceivedFile } from '../lib/transfer/transfer';
  import type { PeerLink, Route } from '../lib/transfer/link';
  import { countFiles, formatBytes } from '../lib/transfer/format';
  import { makeQr } from '../lib/qr';
  import { saveName } from '../lib/transfer/identity';
  import {
    canStoreTrusted,
    loadAutoTrust,
    loadTrusted,
    saveAutoTrust,
    saveTrusted,
    TRUSTED_LIMIT,
    type TrustedDevice,
    type TrustedRow,
  } from '../lib/transfer/trusted';
  import { saveAsZip } from '../lib/zip';
  import DeviceBar from './DeviceBar.svelte';
  import DeviceIcon from './DeviceIcon.svelte';
  import TrustedPanel from './TrustedPanel.svelte';

  type View =
    | { kind: 'idle' }
    | { kind: 'trust-wait'; peer: RemotePeer; cancel: () => void }
    | { kind: 'trust-ask'; peer: RemotePeer; xid: string; token: string }
    | { kind: 'confirm'; peer: RemotePeer; files: File[] }
    | { kind: 'waiting'; peer: RemotePeer; transfer: OutgoingTransfer }
    | { kind: 'sending'; peer: RemotePeer; transfer: OutgoingTransfer }
    | { kind: 'sent'; peer: RemotePeer; count: number }
    | { kind: 'incoming'; transfer: IncomingTransfer }
    | { kind: 'receiving'; transfer: IncomingTransfer }
    | { kind: 'received'; peer: RemotePeer; files: ReceivedFile[] }
    | { kind: 'notice'; title: string; detail: string };

  type PlacedPeer = RemotePeer & { left: string; top: string; trusted: boolean };

  // Where devices sit on the radar: angles (degrees, clockwise from 3 o'clock).
  const SLOT_ANGLES = [215, 335, 95, 275, 155, 35, 245, 65];

  let hub: Hub | null = null;
  let myName = $state('');
  let status = $state<HubStatus>('connecting');
  let peers = $state<PlacedPeer[]>([]);
  const slotOf = new Map<string, number>();

  let view = $state<View>({ kind: 'idle' });
  let done = $state(0);
  let total = $state(0);
  let route = $state<Route>('unknown');

  let myCode = $state('');
  let codeInput = $state('');
  let pairNote = $state('');

  // Trusted devices: kept on this device, and found again through a secret room.
  let trusted = $state<TrustedDevice[]>([]);
  let onlineTokens = $state<string[]>([]);
  let trustedOpen = $state(false);
  let canStore = $state(true);
  const trustedRows = $derived<TrustedRow[]>(trusted.map((t) => ({ ...t, online: onlineTokens.includes(t.token) })));
  const untrustedPeers = $derived(peers.filter((p) => !p.trusted));

  // After a completed transfer both devices remember each other as trusted (can be turned
  // off). The receiver only agrees to a device it has just received files from.
  let autoTrust = $state(true);
  let trustNote = $state<{ token: string; peerId: string; name: string } | null>(null);
  const autoDeclined = new Set<string>();
  let lastReceived: { peerId: string; at: number } | null = null;
  const AUTO_TRUST_WINDOW_MS = 2 * 60 * 1000;

  let zipBusy = $state(false);
  let zipNote = $state('');

  // ?debug=1 shows which shared-network group this device lands in. Two devices find each
  // other automatically only when their groups match.
  let debugNet = $state('');
  let relayOn = $state(false);

  let fileInput = $state<HTMLInputElement>();
  let target: RemotePeer | null = null;
  let dragOver = $state<string | null>(null);
  let canHover = $state(false);
  let wakeLock: { release(): Promise<void> } | null = null;

  const pct = $derived(total > 0 ? Math.min(100, Math.floor((done / total) * 100)) : 0);
  const free = $derived(view.kind === 'idle' || view.kind === 'sent' || view.kind === 'received' || view.kind === 'notice');
  const sheetOpen = $derived(view.kind !== 'idle');
  const peerNames = $derived(peers.map((p) => p.name).join(', '));
  const myCodeLabel = $derived(myCode ? `${myCode.slice(0, 3)} ${myCode.slice(3)}` : '');
  // Scanning this opens AnyAirDrop.com/?pair=… on the other device, which joins our room.
  const qr = $derived(myCode ? makeQr(`${location.origin}/?pair=${myCode}`) : null);

  const hint = $derived(
    status === 'offline'
      ? 'Can’t reach AnyAirDrop.com right now. Retrying…'
      : peers.length === 0
        ? status === 'connecting'
          ? 'Looking for devices on your Wi-Fi…'
          : 'Searching for devices on this Wi-Fi. Or use the code below.'
        : canHover
          ? 'Click a device, or drop files on it'
          : 'Tap a device to send files',
  );

  function routeText(r: Route): string {
    return r === 'lan'
      ? 'Direct over your Wi-Fi · nothing uploaded'
      : r === 'internet'
        ? 'Over the internet, not your Wi-Fi · nothing stored on a server'
        : r === 'relay'
          ? 'Through an encrypted relay'
          : 'Encrypted, device to device';
  }
  const routeLabel = $derived(routeText(route));

  // Live speed while a transfer runs, and the route and average speed once it is done, so a
  // slow transfer can be explained (for example, a VPN pushing it through the relay).
  let speed = $state(0);
  let rtt = $state<number | null>(null);
  let startedAt = 0;
  let lastRun = $state<{ route: Route; rate: number } | null>(null);
  const rate = (bytes: number): string => `${formatBytes(bytes)}/s`;
  // A transfer that is not going straight across the Wi-Fi and is crawling: say why.
  const slowRoute = $derived(
    (route === 'relay' || route === 'internet') && speed > 0 && speed < 1_000_000 && done < total,
  );

  function place(list: RemotePeer[]): void {
    for (const id of [...slotOf.keys()]) {
      if (!list.some((p) => p.id === id)) slotOf.delete(id);
    }
    const used = new Set(slotOf.values());
    for (const p of list) {
      if (slotOf.has(p.id)) continue;
      let slot = 0;
      while (used.has(slot)) slot++;
      slotOf.set(p.id, slot);
      used.add(slot);
    }
    peers = list.map((p) => {
      const slot = slotOf.get(p.id) ?? 0;
      const angle = (SLOT_ANGLES[slot % SLOT_ANGLES.length] * Math.PI) / 180;
      const radius = slot < SLOT_ANGLES.length ? 37 : 24;
      return {
        ...p,
        left: `${(50 + radius * Math.cos(angle)).toFixed(2)}%`,
        top: `${(50 + radius * Math.sin(angle)).toFixed(2)}%`,
        trusted: hub?.trustTokenOf(p.id) != null,
      };
    });
  }

  onMount(() => {
    canHover = matchMedia('(hover: hover)').matches;
    // ?relay=force sends everything through the relay: a QA aid for testing that path.
    const params = new URL(location.href).searchParams;
    hub = new Hub(signalingEndpoint(), { forceRelay: params.get('relay') === 'force' });
    myName = hub.me.name;
    const offs = [
      hub.on('peers', (list) => {
        place(list);
        syncTrusted();
        if (list.length > 0) pairNote = '';
        const v = view;
        if (v.kind === 'confirm' && !list.some((p) => p.id === v.peer.id)) {
          view = { kind: 'notice', title: `${v.peer.name} left`, detail: 'That device closed AnyAirDrop.com.' };
        }
      }),
      hub.on('status', (s) => (status = s)),
      hub.on('incoming', onIncoming),
      hub.on('trustoffer', onTrustOffer),
      hub.on('trustcancelled', (xid) => {
        if (view.kind === 'trust-ask' && view.xid === xid) view = { kind: 'idle' };
      }),
      hub.on('trustrevoked', (token) => {
        const gone = trusted.find((t) => t.token === token);
        if (!gone) return;
        removeTrusted(token, false);
        if (free) view = { kind: 'notice', title: `${gone.name} removed this device`, detail: 'It is no longer a trusted device.' };
      }),
    ];
    hub.start();
    canStore = canStoreTrusted();
    autoTrust = loadAutoTrust();
    trusted = loadTrusted();
    for (const device of trusted) hub.joinTrust(device.token);
    if (params.has('debug')) {
      fetch(new URL('/ws/whoami/', signalingEndpoint().replace(/^ws/, 'http')), { cache: 'no-store' })
        .then((r) => r.json())
        .then((info: { family: string; group: string }) => (debugNet = `${info.family} group ${info.group}`))
        .catch(() => (debugNet = 'unknown (could not reach the server)'));
      setTimeout(() => (relayOn = hub?.relayAvailable ?? false), 2500);
    }
    // Join our own pairing room right away, so the code on screen works from the first
    // second. It keeps two devices connected even when a VPN gives them different
    // public addresses, because it does not depend on the network address at all.
    myCode = loadCode();
    hub.joinPair(myCode);
    // A shared link like AnyAirDrop.com/?pair=123456 joins that pairing room directly.
    const code = params.get('pair');
    if (code && /^\d{6}$/.test(code)) hub.joinPair(code);
    return () => {
      for (const off of offs) off();
      hub?.stop();
    };
  });

  function loadCode(): string {
    try {
      const saved = sessionStorage.getItem('anyairdrop:code');
      if (saved && /^\d{6}$/.test(saved)) return saved;
    } catch {
      // Storage unavailable: use a fresh code.
    }
    const n = new Uint32Array(1);
    crypto.getRandomValues(n);
    const code = String(n[0] % 1_000_000).padStart(6, '0');
    try {
      sessionStorage.setItem('anyairdrop:code', code);
    } catch {
      // Not persisted; fine.
    }
    return code;
  }

  function pick(peer: RemotePeer): void {
    if (!free || !fileInput) return;
    target = peer;
    fileInput.value = '';
    fileInput.click();
  }

  function onFilesChosen(): void {
    const files = Array.from(fileInput?.files ?? []);
    if (!target || files.length === 0) return;
    view = { kind: 'confirm', peer: target, files };
  }

  function onDrop(event: DragEvent, peer: RemotePeer): void {
    event.preventDefault();
    dragOver = null;
    if (!free) return;
    // Dropped folders arrive as empty, typeless entries; skip them.
    const files = Array.from(event.dataTransfer?.files ?? []).filter((f) => f.size > 0 || f.type !== '');
    if (files.length === 0) return;
    view = { kind: 'confirm', peer, files };
  }

  async function send(): Promise<void> {
    if (view.kind !== 'confirm' || !hub) return;
    const { peer, files } = view;
    trustNote = null;
    let transfer: OutgoingTransfer;
    try {
      transfer = hub.send(peer.id, files);
    } catch {
      view = { kind: 'notice', title: `${peer.name} is busy`, detail: 'Try again when their current transfer ends.' };
      return;
    }
    let cancelledHere = false;
    const offProgress = transfer.on('progress', setProgress);
    done = 0;
    total = transfer.total;
    route = 'unknown';
    view = { kind: 'waiting', peer, transfer };
    cancelOutgoing = () => {
      cancelledHere = true;
      transfer.cancel();
    };

    try {
      const result = await transfer.run(() => {
        startStats();
        view = { kind: 'sending', peer, transfer };
        void holdAwake();
        void readRoute(transfer.link);
      });
      if (result === 'done') {
        view = { kind: 'sent', peer, count: files.length };
        void finishStats(transfer.link, transfer.total);
        void autoTrustPeer(peer);
      }
      else if (result === 'declined') view = { kind: 'notice', title: `${peer.name} declined`, detail: 'Nothing was sent.' };
      else view = { kind: 'notice', title: `${peer.name} is busy`, detail: 'They are in another transfer. Try again in a moment.' };
    } catch (err) {
      const reason = err instanceof Error ? err.message : '';
      if (cancelledHere) view = { kind: 'idle' };
      else if (reason === 'cancelled') view = { kind: 'notice', title: `${peer.name} stopped the transfer`, detail: 'Not every file was sent.' };
      else if (reason === 'connect-timeout')
        view = {
          kind: 'notice',
          title: `Couldn’t connect to ${peer.name}`,
          detail: hub?.relayAvailable
            ? 'Check that both devices are still online, then try again.'
            : 'This network may block direct connections between devices. Try another Wi-Fi, or mobile data on one device.',
        };
      else view = { kind: 'notice', title: 'Transfer stopped', detail: `The connection to ${peer.name} was lost.` };
    } finally {
      offProgress();
      cancelOutgoing = null;
      releaseAwake();
    }
  }

  let cancelOutgoing: (() => void) | null = null;

  // Chunks arrive hundreds of times a second; repaint the bar about ten times a second.
  let latest: [number, number] | null = null;
  let flushTimer: ReturnType<typeof setTimeout> | undefined;
  let tick: { at: number; done: number } | null = null;
  function setProgress(d: number, t: number): void {
    latest = [d, t];
    flushTimer ??= setTimeout(() => {
      flushTimer = undefined;
      if (!latest) return;
      [done, total] = latest;
      const now = performance.now();
      if (tick && now > tick.at) {
        const instant = ((done - tick.done) / (now - tick.at)) * 1000;
        speed = speed === 0 ? instant : speed * 0.7 + instant * 0.3;
      }
      tick = { at: now, done };
    }, 100);
  }

  function startStats(): void {
    startedAt = performance.now();
    speed = 0;
    rtt = null;
    tick = null;
    lastRun = null;
  }

  // Called when a transfer completes: reads the route that was really used.
  async function finishStats(link: PeerLink, bytes: number): Promise<void> {
    const seconds = (performance.now() - startedAt) / 1000;
    if (bytes < 1024 * 1024 || seconds <= 0) return;
    let used: Route = route;
    try {
      used = await link.route();
    } catch {
      // Keep what was read earlier.
    }
    route = used;
    lastRun = { route: used, rate: bytes / seconds };
  }

  function onIncoming(transfer: IncomingTransfer): void {
    if (!free) {
      transfer.decline();
      return;
    }
    view = { kind: 'incoming', transfer };
    transfer.on('progress', setProgress);
    transfer.on('done', (files) => {
      zipNote = '';
      lastReceived = { peerId: transfer.peer.id, at: Date.now() };
      view = { kind: 'received', peer: transfer.peer, files };
      void finishStats(transfer.link, transfer.total);
      releaseAwake();
    });
    transfer.on('failed', (reason) => {
      if (view.kind !== 'incoming' && view.kind !== 'receiving') return;
      view =
        reason === 'cancelled'
          ? { kind: 'notice', title: `${transfer.peer.name} cancelled`, detail: 'The transfer was stopped before it finished.' }
          : { kind: 'notice', title: 'Transfer stopped', detail: 'The connection was lost before every file arrived.' };
      releaseAwake();
    });
    // A trusted device the person chose to auto-accept skips the question.
    const token = hub?.trustTokenOf(transfer.peer.id);
    if (token && trusted.find((t) => t.token === token)?.autoAccept) accept();
  }

  function accept(): void {
    if (view.kind !== 'incoming') return;
    const transfer = view.transfer;
    trustNote = null;
    startStats();
    done = 0;
    total = transfer.total;
    route = 'unknown';
    transfer.accept();
    view = { kind: 'receiving', transfer };
    void holdAwake();
    void readRoute(transfer.link);
  }

  function decline(): void {
    if (view.kind === 'incoming') view.transfer.decline();
    view = { kind: 'idle' };
  }

  function stop(): void {
    if (view.kind === 'waiting' || view.kind === 'sending') cancelOutgoing?.();
    else if (view.kind === 'receiving') view.transfer.cancel();
    view = { kind: 'idle' };
    releaseAwake();
  }

  function reset(): void {
    view = { kind: 'idle' };
    trustNote = null;
  }

  // Tapping outside the phone sheet closes it only when nothing is in progress.
  function dismiss(): void {
    if (view.kind === 'confirm' || view.kind === 'sent' || view.kind === 'notice') reset();
  }

  // Read the route shortly after the transfer starts, and again a few seconds in, because the
  // browser can settle on a different path once the connection is busy.
  async function readRoute(link: PeerLink): Promise<void> {
    for (const wait of [400, 2600]) {
      await new Promise((r) => setTimeout(r, wait));
      if (view.kind !== 'sending' && view.kind !== 'receiving') return;
      try {
        const info = await link.stats();
        route = info.route;
        rtt = info.rttMs;
      } catch {
        route = 'unknown';
      }
    }
  }

  async function holdAwake(): Promise<void> {
    try {
      const nav = navigator as Navigator & { wakeLock?: { request(type: 'screen'): Promise<{ release(): Promise<void> }> } };
      wakeLock = (await nav.wakeLock?.request('screen')) ?? null;
    } catch {
      wakeLock = null;
    }
  }

  function releaseAwake(): void {
    wakeLock?.release().catch(() => {});
    wakeLock = null;
  }

  function save(file: ReceivedFile): void {
    const url = URL.createObjectURL(file.file);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }

  function saveAll(files: ReceivedFile[]): void {
    files.forEach((file, i) => setTimeout(() => save(file), i * 400));
  }

  async function zipAll(files: ReceivedFile[], from: string): Promise<void> {
    if (zipBusy) return;
    zipBusy = true;
    zipNote = '';
    try {
      const safe = from.replace(/[\\/:*?"<>|]/g, '_');
      const result = await saveAsZip(files, `AnyAirDrop from ${safe}.zip`);
      if (result === 'too-large') zipNote = 'These files are too big to zip in this browser. Use Save all instead.';
    } catch {
      zipNote = 'Couldn’t make the ZIP. Use Save all instead.';
    } finally {
      zipBusy = false;
    }
  }

  function rename(raw: string): void {
    const name = saveName(raw);
    hub?.rename(name);
    myName = name;
  }

  // Marks which trusted devices are online and keeps their saved names current.
  function syncTrusted(): void {
    if (!hub) return;
    const online: string[] = [];
    let changed = false;
    trusted = trusted.map((t) => {
      const peer = hub?.trustedPeer(t.token);
      if (!peer) return t;
      online.push(t.token);
      if (peer.name === t.name && peer.device === t.device && peer.os === t.os) return t;
      changed = true;
      return { ...t, name: peer.name, device: peer.device, os: peer.os };
    });
    onlineTokens = online;
    if (changed) saveTrusted(trusted);
  }

  function addTrusted(token: string, peer: RemotePeer): void {
    if (trusted.some((t) => t.token === token)) return;
    trusted = [
      ...trusted,
      { token, name: peer.name, device: peer.device, os: peer.os, autoAccept: false, addedAt: Date.now() },
    ].slice(-TRUSTED_LIMIT);
    saveTrusted(trusted);
    syncTrusted();
    if (hub) place(hub.list());
  }

  function removeTrusted(token: string, tellThem: boolean): void {
    trusted = trusted.filter((t) => t.token !== token);
    saveTrusted(trusted);
    if (tellThem) void hub?.revokeTrust(token);
    else hub?.leaveTrust(token);
    syncTrusted();
  }

  function toggleAutoAccept(token: string): void {
    trusted = trusted.map((t) => (t.token === token ? { ...t, autoAccept: !t.autoAccept } : t));
    saveTrusted(trusted);
  }

  async function trustPeer(peer: RemotePeer): Promise<void> {
    if (!hub || !free) return;
    if (!canStore || trusted.length >= TRUSTED_LIMIT) {
      view = {
        kind: 'notice',
        title: canStore ? 'Too many trusted devices' : 'Can’t save trusted devices',
        detail: canStore
          ? 'Remove one from the Trusted list first.'
          : 'This browser blocks site storage (private mode?), so the device would be forgotten.',
      };
      return;
    }
    const abort = new AbortController();
    view = { kind: 'trust-wait', peer, cancel: () => abort.abort() };
    try {
      const { answer, token } = await hub.offerTrust(peer.id, abort.signal);
      if (answer === 'cancelled') {
        if (view.kind === 'trust-wait') view = { kind: 'idle' };
      } else if (answer === 'accepted') {
        addTrusted(token, peer);
        view = {
          kind: 'notice',
          title: `${peer.name} is now a trusted device`,
          detail: 'You will find each other automatically on any network, even through a VPN.',
        };
      } else if (answer === 'declined') {
        view = { kind: 'notice', title: `${peer.name} said no`, detail: 'They did not add this device as trusted.' };
      } else {
        view = { kind: 'notice', title: `${peer.name} didn’t answer`, detail: 'Ask them to check their screen, then try again.' };
      }
    } catch {
      view = { kind: 'notice', title: `Couldn’t reach ${peer.name}`, detail: 'Check that both devices are still online, then try again.' };
    }
  }

  // Sender side, right after a completed transfer: quietly propose to remember each other.
  async function autoTrustPeer(peer: RemotePeer): Promise<void> {
    if (!hub || !autoTrust || !canStore || trusted.length >= TRUSTED_LIMIT) return;
    if (hub.trustTokenOf(peer.id) != null || autoDeclined.has(peer.id)) return;
    try {
      const { answer, token } = await hub.offerTrust(peer.id, undefined, true);
      if (answer === 'accepted') {
        addTrusted(token, peer);
        trustNote = { token, peerId: peer.id, name: peer.name };
      } else {
        autoDeclined.add(peer.id);
      }
    } catch {
      // The other device went away; nothing to remember.
    }
  }

  function undoTrustNote(): void {
    if (!trustNote) return;
    autoDeclined.add(trustNote.peerId);
    removeTrusted(trustNote.token, true);
    trustNote = null;
  }

  function toggleAutoTrust(): void {
    autoTrust = !autoTrust;
    saveAutoTrust(autoTrust);
  }

  function onTrustOffer(peer: RemotePeer, xid: string, token: string, auto: boolean): void {
    if (!hub) return;
    const blocked = !free || !canStore || trusted.length >= TRUSTED_LIMIT || trusted.some((t) => t.token === token);
    if (auto) {
      // Only accepted from a device we have just received files from, so nobody can add
      // themselves without delivering something this person accepted.
      const justReceived =
        lastReceived != null && lastReceived.peerId === peer.id && Date.now() - lastReceived.at < AUTO_TRUST_WINDOW_MS;
      const ok = autoTrust && justReceived && !blocked && hub.trustTokenOf(peer.id) == null;
      hub.answerTrust(peer.id, xid, token, ok);
      if (ok) {
        addTrusted(token, peer);
        trustNote = { token, peerId: peer.id, name: peer.name };
      }
      return;
    }
    if (blocked) {
      hub.answerTrust(peer.id, xid, token, false);
      return;
    }
    view = { kind: 'trust-ask', peer, xid, token };
  }

  function answerTrust(accepted: boolean): void {
    if (view.kind !== 'trust-ask' || !hub) return;
    const { peer, xid, token } = view;
    hub.answerTrust(peer.id, xid, token, accepted);
    if (!accepted) {
      view = { kind: 'idle' };
      return;
    }
    addTrusted(token, peer);
    view = {
      kind: 'notice',
      title: `${peer.name} is now a trusted device`,
      detail: 'You will find each other automatically on any network, even through a VPN.',
    };
  }

  function joinCode(event: SubmitEvent): void {
    event.preventDefault();
    const code = codeInput.replace(/\D/g, '');
    if (code.length !== 6) {
      pairNote = 'Type the 6 digits shown on the other device.';
      return;
    }
    if (code === myCode) {
      pairNote = 'That’s this device’s own code. Type the one on the other device.';
      return;
    }
    hub?.joinPair(code);
    codeInput = '';
    pairNote = 'Connecting… the other device appears on the radar in a moment.';
  }
</script>

{#snippet runInfo(run: { route: Route; rate: number })}
  <p class="small muted" role="status">
    {routeText(run.route).split(' · ')[0]} · {rate(run.rate)} on average
    {#if run.route === 'relay' || run.route === 'internet'}
      <br />This went {run.route === 'relay' ? 'through the relay' : 'over the internet'} instead of straight across your
      Wi-Fi, which is slower. If a VPN is on, turn it off on both devices (or turn on its “allow local network” option)
      and send again.
    {/if}
  </p>
{/snippet}

<div class="tool">
  <div class="radar" role="group" aria-label="Nearby devices">
    <span class="ring" aria-hidden="true"></span>
    <span class="ring r2" aria-hidden="true"></span>
    <span class="ring r3" aria-hidden="true"></span>
    <span class="pulse" aria-hidden="true"></span>
    <span class="me" title={myName ? `You appear as ${myName}` : undefined}>You</span>

    {#each peers as peer (peer.id)}
      <button
        type="button"
        class="device"
        class:target={dragOver === peer.id}
        style:left={peer.left}
        style:top={peer.top}
        disabled={!free}
        aria-label={`Send files to ${peer.name} (${peer.os}, ${peer.browser})${peer.trusted ? ', trusted device' : ''}`}
        onclick={() => pick(peer)}
        ondragover={(e) => {
          e.preventDefault();
          dragOver = peer.id;
        }}
        ondragleave={() => (dragOver = null)}
        ondrop={(e) => onDrop(e, peer)}
      >
        <span class="dot"><DeviceIcon kind={peer.device} /><span class="badge" aria-hidden="true"></span></span>
        <span class="name">
          {peer.name}
          {#if peer.trusted}
            <svg class="shield" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l7 3v5c0 4.5-3 8.2-7 10-4-1.8-7-5.5-7-10V6Z" /><path d="M9 12l2 2 4-4" /></svg>
          {/if}
        </span>
        <span class="os">{peer.os}</span>
      </button>
    {/each}
  </div>

  {#if myName}
    <DeviceBar name={myName} trustedCount={trusted.length} onrename={rename} ontrusted={() => (trustedOpen = true)} />
  {:else}
    <div class="bar-space"></div>
  {/if}

  <button type="button" class="scrim" class:open={sheetOpen} aria-label="Close" tabindex="-1" onclick={dismiss}></button>

  <div class="actions" class:open={sheetOpen} aria-live="polite">
    {#if view.kind === 'idle'}
      {#if peers.length > 0}
        <p class="connected" role="status">
          <span class="live" aria-hidden="true"></span>Connected to {peerNames}
          {#if canStore}
            {#each untrustedPeers as peer (peer.id)}
              <button type="button" class="link-btn trust-btn" onclick={() => trustPeer(peer)}>Trust {peer.name}</button>
            {/each}
          {/if}
        </p>
      {/if}
      <p class="muted hint">{hint}</p>
      <div class="pair">
        <div class="mycode">
          {#if qr}
            <span class="qr-frame">
              <svg class="qr" viewBox={qr.viewBox} shape-rendering="crispEdges" role="img" aria-label="QR code: scan it with the other device’s camera to connect">
                <path d={qr.path} />
              </svg>
            </span>
          {/if}
          <p class="mycode-text">
            <span class="label">Your code</span>
            <span class="code" aria-label={`Your code is ${myCode.split('').join(' ')}`}>{myCodeLabel}</span>
            <span class="scan">Scan it with the other device’s camera</span>
          </p>
        </div>
        <form class="pair-form" onsubmit={joinCode}>
          <label class="visually-hidden" for="pair-code">Code shown on the other device</label>
          <input id="pair-code" inputmode="numeric" autocomplete="off" maxlength="7" placeholder="Their code" bind:value={codeInput} />
          <button type="submit" class="secondary">Connect</button>
        </form>
      </div>
      {#if pairNote}<p class="small muted note" role="status">{pairNote}</p>{/if}
      {#if debugNet}
        <p class="small muted note" role="status">
          Network: {debugNet} · relay {relayOn ? 'on' : 'off'} · {peers.length} device{peers.length === 1 ? '' : 's'} found · you are {myName}
        </p>
      {/if}
    {:else if view.kind === 'trust-wait'}
      <p class="title">Waiting for {view.peer.name} to accept…</p>
      <p class="small muted">They will be asked to add this device as a trusted device.</p>
      <div class="row"><button type="button" class="secondary" onclick={view.cancel}>Cancel</button></div>
    {:else if view.kind === 'trust-ask'}
      <p class="title">{view.peer.name} wants to be a trusted device</p>
      <p class="small muted">
        Trusted devices find each other automatically on any network, even through a VPN. You still approve every
        transfer unless you choose otherwise.
      </p>
      <div class="row">
        <button type="button" class="secondary" onclick={() => answerTrust(false)}>Not now</button>
        <button type="button" class="primary" onclick={() => answerTrust(true)}>Trust</button>
      </div>
    {:else if view.kind === 'confirm'}
      <p class="title">Send {countFiles(view.files.length)} ({formatBytes(view.files.reduce((s, f) => s + f.size, 0))}) to {view.peer.name}?</p>
      <div class="row">
        <button type="button" class="secondary" onclick={reset}>Cancel</button>
        <button type="button" class="primary" onclick={send}>Send</button>
      </div>
    {:else if view.kind === 'waiting'}
      <p class="title">Waiting for {view.peer.name} to accept…</p>
      <div class="row"><button type="button" class="secondary" onclick={stop}>Cancel</button></div>
    {:else if view.kind === 'sending' || view.kind === 'receiving'}
      <div class="progress-head">
        <span>{view.kind === 'sending' ? `Sending to ${view.peer.name}` : `Receiving from ${view.transfer.peer.name}`}</span>
        <strong>{pct}%</strong>
      </div>
      <div class="bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow={pct}>
        <span style:width={`${pct}%`}></span>
      </div>
      <p class="small muted">
        {routeLabel} · {formatBytes(done)} of {formatBytes(total)}{#if speed > 0} · {rate(speed)}{/if}
      </p>
      {#if slowRoute}
        <p class="small slow" role="status">
          This is going over the internet, not straight across your Wi-Fi{#if rtt}, with a delay of {rtt} ms{/if}, so it is
          limited by your upload speed. If both devices are on the same Wi-Fi, turn off any VPN on both (or allow local
          network access in it) and send again.
        </p>
      {/if}
      <button type="button" class="text-btn" onclick={stop}>Cancel</button>
    {:else if view.kind === 'sent'}
      <p class="title done">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12l4 4L19 7" /></svg>
        Sent {countFiles(view.count)} to {view.peer.name}
      </p>
      {#if lastRun}{@render runInfo(lastRun)}{/if}
      {#if trustNote}
        <p class="small muted" role="status">
          {trustNote.name} is now a trusted device. <button type="button" class="link-btn" onclick={undoTrustNote}>Undo</button>
        </p>
      {/if}
      <div class="row"><button type="button" class="secondary" onclick={reset}>Send more</button></div>
    {:else if view.kind === 'incoming'}
      <p class="title">
        {view.transfer.peer.name} wants to send you {countFiles(view.transfer.files.length)} ({formatBytes(view.transfer.total)})
      </p>
      <p class="small muted names">{view.transfer.files.slice(0, 3).map((f) => f.name).join(', ')}{view.transfer.files.length > 3 ? '…' : ''}</p>
      <div class="row">
        <button type="button" class="secondary" onclick={decline}>Decline</button>
        <button type="button" class="primary" onclick={accept}>Accept</button>
      </div>
    {:else if view.kind === 'received'}
      {@const files = view.files}
      {@const from = view.peer.name}
      <p class="title done">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12l4 4L19 7" /></svg>
        Received {countFiles(files.length)} from {view.peer.name}
      </p>
      <ul class="files">
        {#each files as file, i (i)}
          <li>
            <span class="fname">{file.name}</span>
            <span class="fsize">{formatBytes(file.size)}</span>
            <button type="button" class="link-btn" onclick={() => save(file)}>Save</button>
          </li>
        {/each}
      </ul>
      {#if lastRun}{@render runInfo(lastRun)}{/if}
      {#if zipNote}<p class="small muted" role="status">{zipNote}</p>{/if}
      {#if trustNote}
        <p class="small muted" role="status">
          {trustNote.name} is now a trusted device. <button type="button" class="link-btn" onclick={undoTrustNote}>Undo</button>
        </p>
      {/if}
      <div class="row wrap">
        {#if files.length > 1}
          <button type="button" class="secondary" disabled={zipBusy} onclick={() => zipAll(files, from)}>
            {zipBusy ? 'Making ZIP…' : 'Save as ZIP'}
          </button>
          <button type="button" class="secondary" onclick={() => saveAll(files)}>Save all</button>
        {/if}
        <button type="button" class="primary" onclick={reset}>Done</button>
      </div>
    {:else if view.kind === 'notice'}
      <p class="title">{view.title}</p>
      <p class="small muted">{view.detail}</p>
      <div class="row"><button type="button" class="secondary" onclick={reset}>OK</button></div>
    {/if}
  </div>

  <input class="visually-hidden" type="file" multiple tabindex="-1" aria-hidden="true" bind:this={fileInput} onchange={onFilesChosen} />

  <TrustedPanel
    open={trustedOpen}
    devices={trustedRows}
    {canStore}
    {autoTrust}
    ontoggleauto={toggleAutoTrust}
    onclose={() => (trustedOpen = false)}
    onremove={(token) => removeTrusted(token, true)}
    ontoggle={toggleAutoAccept}
  />
</div>

<style>
  .tool {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .radar {
    position: relative;
    width: min(480px, 86vw);
    aspect-ratio: 1 / 1;
    margin-top: var(--space-6);
  }

  /* Desktop: size the radar to the window so the whole page fits without scrolling. */
  @media (min-width: 721px) and (min-height: 640px) {
    .radar {
      width: min(86vw, clamp(200px, calc(100dvh - 500px), 440px));
      margin-top: var(--space-3);
    }
  }

  .ring,
  .pulse {
    position: absolute;
    inset: 0;
    border-radius: 50%;
    border: 1px solid var(--color-line);
  }

  .r2 {
    inset: 17%;
  }

  .r3 {
    inset: 34%;
  }

  .pulse {
    border: 0;
    background: var(--color-accent);
    animation: pulse 3.2s ease-out infinite;
  }

  .me {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background: var(--color-accent);
    color: var(--color-on-accent);
    display: grid;
    place-items: center;
    font-size: 14px;
    font-weight: 600;
  }

  .device {
    position: absolute;
    transform: translate(-50%, -50%);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    min-width: 96px;
    padding: 6px;
    border: 0;
    background: transparent;
    color: var(--color-text);
    cursor: pointer;
    animation: appear var(--dur-enter) ease-out both;
  }

  .device:disabled {
    cursor: default;
  }

  .badge {
    position: absolute;
    right: 1px;
    bottom: 1px;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: var(--color-success);
    border: 2px solid var(--color-surface);
  }

  .dot {
    position: relative;
    width: 52px;
    height: 52px;
    border-radius: 50%;
    background: var(--color-surface);
    border: 1px solid var(--color-line-strong);
    display: grid;
    place-items: center;
    transition: border-color var(--dur-color) ease, transform var(--dur-color) ease;
  }

  .device:not(:disabled):hover .dot,
  .device.target .dot {
    border-color: var(--color-accent);
  }

  .device.target .dot {
    transform: scale(1.08);
  }

  .name {
    font-size: 14px;
    font-weight: 600;
    white-space: nowrap;
  }

  .os {
    font-size: 12px;
    color: var(--color-text-muted);
    margin-top: -4px;
  }

  .actions {
    margin-top: 20px;
    min-height: 130px;
    width: 100%;
    max-width: 640px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-2);
    text-align: center;
  }

  .actions p {
    margin: 0;
  }

  .title {
    font-size: 16px;
    font-weight: 500;
  }

  .title.done {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .title.done svg {
    color: var(--color-success);
    flex: none;
  }

  .muted {
    color: var(--color-text-muted);
    font-size: 15px;
  }

  .small {
    font-size: 14px;
  }

  .inline {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    align-items: center;
    gap: 6px;
  }

  .names {
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .row {
    display: flex;
    gap: 10px;
    justify-content: center;
  }

  .row.wrap {
    flex-wrap: wrap;
  }

  .secondary:disabled {
    opacity: 0.6;
    cursor: default;
  }

  .shield {
    display: inline-block;
    vertical-align: -1px;
    margin-left: 2px;
    color: var(--color-success);
  }

  .slow {
    max-width: 460px;
    color: var(--color-text);
    padding: 8px 12px;
    border: 1px solid var(--color-line-strong);
    border-radius: var(--radius-button);
    line-height: 1.4;
  }

  .bar-space {
    min-height: 52px;
  }

  .trust-btn {
    min-height: 32px;
    margin-left: 4px;
    font-weight: 600;
  }

  .primary,
  .secondary {
    min-height: 44px;
    padding: 0 20px;
    border-radius: var(--radius-button);
    font-size: 15px;
    cursor: pointer;
    transition: background-color var(--dur-color) ease, border-color var(--dur-color) ease;
  }

  .primary {
    border: 0;
    background: var(--color-accent);
    color: var(--color-on-accent);
    font-weight: 600;
  }

  .primary:hover {
    background: var(--color-accent-hover);
  }

  .secondary {
    border: 1px solid var(--color-line);
    background: var(--color-surface);
    color: var(--color-text);
    font-weight: 500;
  }

  .secondary:hover {
    border-color: var(--color-line-strong);
  }

  .link-btn,
  .text-btn {
    border: 0;
    background: none;
    padding: 0;
    color: var(--color-link);
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
  }

  .text-btn {
    min-height: 44px;
    color: var(--color-text-muted);
  }

  .link-btn:hover {
    color: var(--color-link-hover);
    text-decoration: underline;
  }

  .progress-head {
    width: 100%;
    display: flex;
    justify-content: space-between;
    font-size: 14px;
    color: var(--color-text-muted);
  }

  .progress-head strong {
    color: var(--color-text);
  }

  .bar {
    width: 100%;
    height: 4px;
    border-radius: 2px;
    background: var(--color-line);
    overflow: hidden;
  }

  .bar span {
    display: block;
    height: 100%;
    background: var(--color-accent);
    transition: width 120ms linear;
  }

  .files {
    list-style: none;
    margin: 0;
    padding: 0;
    width: 100%;
    max-height: 180px;
    overflow-y: auto;
    border-top: 1px solid var(--color-line);
  }

  .files li {
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: 44px;
    border-bottom: 1px solid var(--color-line);
    font-size: 14px;
    text-align: left;
  }

  .fname {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .fsize {
    color: var(--color-text-muted);
  }

  .connected {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    align-items: center;
    gap: 2px 8px;
    font-size: 15px;
    font-weight: 600;
    color: var(--color-success);
  }

  .live {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--color-success);
    flex: none;
  }

  .hint {
    min-height: 1.5em;
  }

  .pair {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    gap: 14px 32px;
  }

  .mycode {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  /* Dark modules on a white tile in both themes, so any camera reads it. The solid frame
     gives it strong contrast against the page: near-black on the light theme. */
  .qr-frame {
    display: flex;
    flex: none;
    padding: 7px;
    background: var(--qr-frame);
    border-radius: 16px;
  }

  .qr {
    display: block;
    width: 94px;
    height: 94px;
    background: #fff;
    border-radius: 9px;
  }

  .qr path {
    fill: #0b1220;
  }

  /* The label, the code and the hint share one centered column. */
  .mycode-text {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    text-align: center;
  }

  .label {
    font-size: 14px;
    color: var(--color-text-muted);
  }

  .code {
    font-size: 30px;
    font-weight: 700;
    line-height: 1.15;
    letter-spacing: 0.08em;
    font-variant-numeric: tabular-nums;
  }

  .scan {
    max-width: 190px;
    font-size: 13px;
    line-height: 1.35;
    color: var(--color-text-muted);
  }

  .note {
    max-width: 440px;
  }

  .pair-form {
    display: flex;
    gap: 10px;
  }

  .pair-form input {
    width: 140px;
    min-height: 44px;
    padding: 0 12px;
    border: 1px solid var(--color-line-strong);
    border-radius: var(--radius-button);
    font: inherit;
    font-size: 16px;
    text-align: center;
    letter-spacing: 0.08em;
    background: var(--color-surface);
    color: var(--color-text);
  }

  @media (max-width: 720px) {
    .qr-frame {
      padding: 6px;
      border-radius: 14px;
    }

    .qr {
      width: 76px;
      height: 76px;
    }

    .mycode {
      gap: 12px;
    }

    .code {
      font-size: 26px;
    }
  }

  .scrim {
    display: none;
  }

  /* Phones: anything beyond the idle hint rises as a bottom sheet. */
  @media (max-width: 720px) {
    .radar {
      margin-top: var(--space-5);
    }

    .scrim.open {
      display: block;
      position: fixed;
      inset: 0;
      z-index: 19;
      border: 0;
      background: var(--color-scrim);
    }

    .actions.open {
      position: fixed;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 20;
      max-width: none;
      min-height: 0;
      margin: 0;
      padding: 12px 24px calc(28px + env(safe-area-inset-bottom));
      background: var(--color-surface);
      border-radius: var(--radius-sheet) var(--radius-sheet) 0 0;
      animation: rise 300ms ease-out both;
    }

    .actions.open::before {
      content: '';
      width: 36px;
      height: 4px;
      border-radius: 2px;
      background: var(--color-line);
      margin-bottom: 4px;
    }

    .actions.open .row {
      width: 100%;
    }

    .actions.open .row button {
      flex: 1;
      min-height: 50px;
    }
  }

  @keyframes pulse {
    from {
      transform: scale(0.2);
      opacity: 0.16;
    }
    to {
      transform: scale(1);
      opacity: 0;
    }
  }

  @keyframes appear {
    from {
      opacity: 0;
      transform: translate(-50%, -44%);
    }
    to {
      opacity: 1;
      transform: translate(-50%, -50%);
    }
  }

  @keyframes rise {
    from {
      transform: translateY(24px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
</style>
