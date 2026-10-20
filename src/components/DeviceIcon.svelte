<script lang="ts">
  let { kind, size = 20 }: { kind: string; size?: number } = $props();
</script>

<svg
  width={size}
  height={size}
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="1.6"
  stroke-linecap="round"
  stroke-linejoin="round"
  aria-hidden="true"
>
  {#if kind === 'phone'}
    <rect x="7" y="2.5" width="10" height="19" rx="2.5" />
    <path d="M11 18.5h2" />
  {:else if kind === 'tablet'}
    <rect x="4.5" y="2.5" width="15" height="19" rx="2.5" />
    <path d="M11 18.5h2" />
  {:else}
    <rect x="4" y="5" width="16" height="11" rx="1.5" />
    <path d="M2 19h20" />
  {/if}
</svg>
