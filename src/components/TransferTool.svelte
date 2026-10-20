<script lang="ts">
  import { onMount } from 'svelte';
  import { Hub, signalingEndpoint, type HubStatus, type RemotePeer } from '../lib/transfer/hub';
  import type { IncomingTransfer, OutgoingTransfer, ReceivedFile } from '../lib/transfer/transfer';
  import type { PeerLink, Route } from '../lib/transfer/link';
  import { countFiles, formatBytes } from '../lib/transfer/format';
  import DeviceIcon from './DeviceIcon.svelte';

  type View =
    | { kind: 'idle' }
    | { kind: 'confirm'; peer: RemotePeer; files: File[] }
    | { kind: 'waiting'; peer: RemotePeer; transfer: OutgoingTransfer }
    | { kind: 'sending'; peer: RemotePeer; transfer: OutgoingTransfer }
    | { kind: 'sent'; peer: RemotePeer; count: number }
    | { kind: 'incoming'; transfer: IncomingTransfer }
    | { kind: 'receiving'; transfer: IncomingTransfer }
    | { kind: 'received'; peer: RemotePeer; files: ReceivedFile[] }
    | { kind: 'notice'; title: string; detail: string };

  type PlacedPeer = RemotePeer & { left: string; top: string };

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

  let pairOpen = $state(false);
  let myCode = $state('');
  let codeInput = $state('');
  let pairNote = $state('');

  let fileInput = $state<HTMLInputElement>();
  let target: RemotePeer | null = null;
  let dragOver = $state<string | null>(null);
  let canHover = $state(false);
  let wakeLock: { release(): Promise<void> } | null = null;

  const pct = $derived(total > 0 ? Math.min(100, Math.floor((done / total) * 100)) : 0);
  const free = $derived(view.kind === 'idle' || view.kind === 'sent' || view.kind === 'received' || view.kind === 'notice');
  const sheetOpen = $derived(view.kind !== 'idle' || pairOpen);

  const hint = $derived(
    status === 'offline'
      ? 'Can’t reach AnyAirDrop.com right now. Retrying…'
      : peers.length === 0
        ? status === 'connecting'
          ? 'Looking for devices on your Wi-Fi…'
          : 'Open AnyAirDrop.com on another device on this Wi-Fi'
        : canHover
          ? 'Click a device, or drop files on it'
          : 'Tap a device to send files',
  );

  const routeLabel = $derived(
    route === 'lan'
      ? 'Direct over your Wi-Fi · nothing uploaded'
      : route === 'internet'
        ? 'Direct connection · nothing stored on a server'
        : route === 'relay'
          ? 'Through an encrypted relay'
          : 'Encrypted, device to device',
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
      };
    });
  }

  onMount(() => {
    canHover = matchMedia('(hover: hover)').matches;
    hub = new Hub(signalingEndpoint());
    myName = hub.me.name;
    const offs = [
      hub.on('peers', (list) => {
        place(list);
        const v = view;
        if (v.kind === 'confirm' && !list.some((p) => p.id === v.peer.id)) {
          view = { kind: 'notice', title: `${v.peer.name} left`, detail: 'That device closed AnyAirDrop.com.' };
        }
      }),
      hub.on('status', (s) => (status = s)),
      hub.on('incoming', onIncoming),
    ];
    hub.start();
    // A shared link like AnyAirDrop.com/?pair=123456 joins that pairing room directly.
    const code = new URL(location.href).searchParams.get('pair');
    if (code && /^\d{6}$/.test(code)) hub.joinPair(code);
    return () => {
      for (const off of offs) off();
      hub?.stop();
    };
  });

  function pick(peer: RemotePeer): void {
    if (!free || !fileInput) return;
    target = peer;
    fileInput.value = '';
    fileInput.click();
  }

  function onFilesChosen(): void {
    const files = Array.from(fileInput?.files ?? []);
    if (!target || files.length === 0) return;
    pairOpen = false;
    view = { kind: 'confirm', peer: target, files };
  }

  function onDrop(event: DragEvent, peer: RemotePeer): void {
    event.preventDefault();
    dragOver = null;
    if (!free) return;
    // Dropped folders arrive as empty, typeless entries; skip them.
    const files = Array.from(event.dataTransfer?.files ?? []).filter((f) => f.size > 0 || f.type !== '');
    if (files.length === 0) return;
    pairOpen = false;
    view = { kind: 'confirm', peer, files };
  }

  async function send(): Promise<void> {
    if (view.kind !== 'confirm' || !hub) return;
    const { peer, files } = view;
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
        view = { kind: 'sending', peer, transfer };
        void holdAwake();
        void readRoute(transfer.link);
      });
      if (result === 'done') view = { kind: 'sent', peer, count: files.length };
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
          detail: 'This network may block direct connections between devices. Try “Pair with a code”, or another Wi-Fi.',
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
  function setProgress(d: number, t: number): void {
    latest = [d, t];
    flushTimer ??= setTimeout(() => {
      flushTimer = undefined;
      if (latest) [done, total] = latest;
    }, 100);
  }

  function onIncoming(transfer: IncomingTransfer): void {
    if (!free) {
      transfer.decline();
      return;
    }
    pairOpen = false;
    view = { kind: 'incoming', transfer };
    transfer.on('progress', setProgress);
    transfer.on('done', (files) => {
      view = { kind: 'received', peer: transfer.peer, files };
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
  }

  function accept(): void {
    if (view.kind !== 'incoming') return;
    const transfer = view.transfer;
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
  }

  // Tapping outside the phone sheet closes it only when nothing is in progress.
  function dismiss(): void {
    if (pairOpen) pairOpen = false;
    else if (view.kind === 'confirm' || view.kind === 'sent' || view.kind === 'notice') reset();
  }

  async function readRoute(link: PeerLink): Promise<void> {
    await new Promise((r) => setTimeout(r, 400));
    try {
      route = await link.route();
    } catch {
      route = 'unknown';
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

  function openPair(): void {
    pairOpen = true;
    pairNote = '';
    if (!myCode) {
      const n = new Uint32Array(1);
      crypto.getRandomValues(n);
      myCode = String(n[0] % 1_000_000).padStart(6, '0');
      hub?.joinPair(myCode);
    }
  }

  function joinCode(event: SubmitEvent): void {
    event.preventDefault();
    const code = codeInput.replace(/\D/g, '');
    if (code.length !== 6) {
      pairNote = 'Enter the 6 digits shown on the other device.';
      return;
    }
    if (code === myCode) {
      pairNote = 'That’s this device’s code. Enter the one on the other device.';
      return;
    }
    hub?.joinPair(code);
    codeInput = '';
    pairNote = 'Connecting. The other device will appear on the radar.';
  }
</script>

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
        aria-label={`Send files to ${peer.name} (${peer.os}, ${peer.browser})`}
        onclick={() => pick(peer)}
        ondragover={(e) => {
          e.preventDefault();
          dragOver = peer.id;
        }}
        ondragleave={() => (dragOver = null)}
        ondrop={(e) => onDrop(e, peer)}
      >
        <span class="dot"><DeviceIcon kind={peer.device} /></span>
        <span class="name">{peer.name}</span>
        <span class="os">{peer.os}</span>
      </button>
    {/each}
  </div>

  <button type="button" class="scrim" class:open={sheetOpen} aria-label="Close" tabindex="-1" onclick={dismiss}></button>

  <div class="actions" class:open={sheetOpen} aria-live="polite">
    {#if pairOpen}
      <p class="title">Pair with a code</p>
      <p class="muted">Use this when the other device doesn’t appear, like on guest Wi-Fi or a different network.</p>
      <p class="code" aria-label={`Your code is ${myCode.split('').join(' ')}`}>{myCode.slice(0, 3)} {myCode.slice(3)}</p>
      <form class="pair-form" onsubmit={joinCode}>
        <label class="visually-hidden" for="pair-code">Code from the other device</label>
        <input
          id="pair-code"
          inputmode="numeric"
          autocomplete="off"
          maxlength="7"
          placeholder="Their code"
          bind:value={codeInput}
        />
        <button type="submit" class="primary">Connect</button>
      </form>
      {#if pairNote}<p class="muted small">{pairNote}</p>{/if}
      <button type="button" class="text-btn" onclick={() => (pairOpen = false)}>Close</button>
    {:else if view.kind === 'idle'}
      <p class="muted">{hint}</p>
      <p class="small muted inline">
        {#if myName}
          <span>You appear as <strong>{myName}</strong></span>
          <span aria-hidden="true">·</span>
        {/if}
        <button type="button" class="link-btn" onclick={openPair}>Pair with a code</button>
      </p>
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
      <p class="small muted">{routeLabel} · {formatBytes(done)} of {formatBytes(total)}</p>
      <button type="button" class="text-btn" onclick={stop}>Cancel</button>
    {:else if view.kind === 'sent'}
      <p class="title done">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12l4 4L19 7" /></svg>
        Sent {countFiles(view.count)} to {view.peer.name}
      </p>
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
      <div class="row">
        {#if files.length > 1}<button type="button" class="secondary" onclick={() => saveAll(files)}>Save all</button>{/if}
        <button type="button" class="primary" onclick={reset}>Done</button>
      </div>
    {:else if view.kind === 'notice'}
      <p class="title">{view.title}</p>
      <p class="small muted">{view.detail}</p>
      <div class="row"><button type="button" class="secondary" onclick={reset}>OK</button></div>
    {/if}
  </div>

  <input class="visually-hidden" type="file" multiple tabindex="-1" aria-hidden="true" bind:this={fileInput} onchange={onFilesChosen} />
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

  .dot {
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
    margin-top: 28px;
    min-height: 112px;
    width: 100%;
    max-width: 460px;
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
    color: var(--color-accent);
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
  }

  .text-btn {
    min-height: 44px;
    color: var(--color-text-muted);
  }

  .link-btn:hover {
    color: var(--color-accent-hover);
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

  .code {
    font-size: 32px;
    font-weight: 600;
    letter-spacing: 0.12em;
    font-variant-numeric: tabular-nums;
  }

  .pair-form {
    display: flex;
    gap: 10px;
  }

  .pair-form input {
    width: 150px;
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
