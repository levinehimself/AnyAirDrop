<script lang="ts">
  import { cleanName, MAX_NAME_LENGTH } from '../lib/transfer/identity';

  let {
    name,
    trustedCount,
    onrename,
    ontrusted,
  }: {
    name: string;
    trustedCount: number;
    onrename: (name: string) => void;
    ontrusted: () => void;
  } = $props();

  let editing = $state(false);
  let draft = $state('');
  let input = $state<HTMLInputElement>();

  function start(): void {
    draft = name;
    editing = true;
    queueMicrotask(() => {
      input?.focus();
      input?.select();
    });
  }

  function save(event: SubmitEvent): void {
    event.preventDefault();
    onrename(cleanName(draft));
    editing = false;
  }
</script>

<div class="bar">
  {#if editing}
    <form class="edit" onsubmit={save}>
      <label class="visually-hidden" for="device-name">Your device name</label>
      <input
        id="device-name"
        bind:this={input}
        bind:value={draft}
        maxlength={MAX_NAME_LENGTH}
        autocomplete="off"
        enterkeyhint="done"
        placeholder="Device name"
        onkeydown={(e) => e.key === 'Escape' && (editing = false)}
      />
      <button type="submit" class="save">Save</button>
      <button type="button" class="cancel" onclick={() => (editing = false)}>Cancel</button>
    </form>
  {:else}
    <p class="who">
      <span class="label">You are</span>
      <strong class="name" id="my-device-name">{name}</strong>
      <button type="button" class="icon" aria-label="Rename this device" title="Rename this device" onclick={start}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>
      </button>
    </p>
    <button type="button" class="trusted" onclick={ontrusted} aria-label={`Trusted devices (${trustedCount})`}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l7 3v5c0 4.5-3 8.2-7 10-4-1.8-7-5.5-7-10V6Z" /><path d="M9 12l2 2 4-4" /></svg>
      <span class="trusted-label">Trusted</span>
      <span class="count">{trustedCount}</span>
    </button>
  {/if}
</div>

<style>
  .bar {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-wrap: wrap;
    gap: 4px 16px;
    min-height: 44px;
    margin-top: var(--space-1);
  }

  .who {
    display: flex;
    align-items: center;
    gap: 6px;
    margin: 0;
    font-size: 15px;
  }

  .label {
    color: var(--color-text-muted);
  }

  .name {
    font-weight: 700;
    max-width: 14em;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  button {
    font: inherit;
    cursor: pointer;
  }

  .icon,
  .trusted {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    min-width: 44px;
    min-height: 44px;
    border: 0;
    background: none;
    color: var(--color-link);
    font-size: 14px;
    font-weight: 600;
  }

  .icon:hover,
  .trusted:hover {
    color: var(--color-link-hover);
  }

  .count {
    min-width: 20px;
    padding: 1px 6px;
    border-radius: 10px;
    background: var(--color-line);
    color: var(--color-text);
    font-size: 12px;
    font-weight: 700;
    line-height: 1.5;
    text-align: center;
  }

  .edit {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    justify-content: center;
    gap: 8px;
  }

  .edit input {
    width: 190px;
    min-height: 44px;
    padding: 0 12px;
    border: 1px solid var(--color-line-strong);
    border-radius: var(--radius-button);
    background: var(--color-surface);
    color: var(--color-text);
    font: inherit;
    font-size: 16px;
    text-align: center;
  }

  .save,
  .cancel {
    min-height: 44px;
    padding: 0 16px;
    border-radius: var(--radius-button);
    font-size: 15px;
  }

  .save {
    border: 0;
    background: var(--color-accent);
    color: var(--color-on-accent);
    font-weight: 600;
  }

  .cancel {
    border: 1px solid var(--color-line);
    background: var(--color-surface);
    color: var(--color-text);
    font-weight: 500;
  }

  @media (max-width: 480px) {
    .trusted-label {
      display: none;
    }
  }
</style>
