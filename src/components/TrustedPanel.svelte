<script lang="ts">
  import type { TrustedRow } from '../lib/transfer/trusted';
  import DeviceIcon from './DeviceIcon.svelte';

  let {
    open,
    devices,
    canStore,
    onclose,
    onremove,
    ontoggle,
  }: {
    open: boolean;
    devices: TrustedRow[];
    canStore: boolean;
    onclose: () => void;
    onremove: (token: string) => void;
    ontoggle: (token: string) => void;
  } = $props();

  let closeButton = $state<HTMLButtonElement>();

  $effect(() => {
    if (open) closeButton?.focus();
  });
</script>

<svelte:window onkeydown={(e) => open && e.key === 'Escape' && onclose()} />

{#if open}
  <button type="button" class="backdrop" aria-label="Close trusted devices" tabindex="-1" onclick={onclose}></button>
  <div class="panel" role="dialog" aria-modal="true" aria-labelledby="trusted-title">
    <div class="head">
      <h2 id="trusted-title">Trusted devices</h2>
      <button type="button" class="close" bind:this={closeButton} onclick={onclose} aria-label="Close">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
      </button>
    </div>
    <p class="lead">
      Trusted devices find each other automatically, on any Wi-Fi and even through a VPN. You still approve every
      transfer unless you turn on auto-accept for a device.
    </p>

    {#if devices.length === 0}
      <p class="empty">
        {#if canStore}
          No trusted devices yet. Connect two devices, then tap “Trust” under the radar on one of them.
        {:else}
          This browser can’t save trusted devices (private mode or blocked site data).
        {/if}
      </p>
    {:else}
      <ul class="list">
        {#each devices as device (device.token)}
          <li>
            <span class="icon"><DeviceIcon kind={device.device} size={22} /></span>
            <span class="info">
              <span class="dname">{device.name}</span>
              <span class="status" class:online={device.online}>
                <span class="dot" aria-hidden="true"></span>{device.online ? 'Online now' : 'Offline'}{device.os ? ` · ${device.os}` : ''}
              </span>
              <label class="auto">
                <input type="checkbox" checked={device.autoAccept} onchange={() => ontoggle(device.token)} />
                Accept their files without asking
              </label>
            </span>
            <button type="button" class="remove" onclick={() => onremove(device.token)} aria-label={`Remove ${device.name}`}>Remove</button>
          </li>
        {/each}
      </ul>
    {/if}
  </div>
{/if}

<style>
  .backdrop {
    position: fixed;
    inset: 0;
    z-index: 29;
    border: 0;
    background: var(--color-scrim);
  }

  .panel {
    position: fixed;
    z-index: 30;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    width: min(460px, calc(100vw - 32px));
    max-height: calc(100dvh - 48px);
    overflow-y: auto;
    padding: 20px 24px 24px;
    background: var(--color-surface);
    color: var(--color-text);
    border: 1px solid var(--color-line);
    border-radius: 18px;
    text-align: left;
  }

  .head {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  h2 {
    margin: 0;
    font-size: 20px;
    font-weight: 700;
  }

  .close {
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    margin-right: -10px;
    border: 0;
    background: none;
    color: var(--color-text-muted);
    cursor: pointer;
  }

  .lead,
  .empty {
    margin: 4px 0 12px;
    font-size: 14px;
    line-height: 1.5;
    color: var(--color-text-muted);
  }

  .list {
    list-style: none;
    margin: 0;
    padding: 0;
    border-top: 1px solid var(--color-line);
  }

  li {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 14px 0;
    border-bottom: 1px solid var(--color-line);
  }

  .icon {
    display: grid;
    place-items: center;
    flex: none;
    width: 40px;
    height: 40px;
    border: 1px solid var(--color-line-strong);
    border-radius: 50%;
  }

  .info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .dname {
    font-size: 16px;
    font-weight: 700;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .status {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    color: var(--color-text-muted);
  }

  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--color-line-strong);
  }

  .status.online {
    color: var(--color-success);
  }

  .status.online .dot {
    background: var(--color-success);
  }

  .auto {
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 32px;
    margin-top: 4px;
    font-size: 14px;
    cursor: pointer;
  }

  .auto input {
    width: 18px;
    height: 18px;
    accent-color: var(--color-accent);
  }

  .remove {
    min-height: 44px;
    padding: 0 4px;
    border: 0;
    background: none;
    color: var(--color-link);
    font: inherit;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
  }

  .remove:hover {
    color: var(--color-link-hover);
    text-decoration: underline;
  }

  @media (max-width: 720px) {
    .panel {
      top: auto;
      bottom: 0;
      transform: none;
      left: 0;
      width: 100%;
      max-height: 85dvh;
      padding-bottom: calc(24px + env(safe-area-inset-bottom));
      border-radius: var(--radius-sheet) var(--radius-sheet) 0 0;
      border-bottom: 0;
    }
  }
</style>
