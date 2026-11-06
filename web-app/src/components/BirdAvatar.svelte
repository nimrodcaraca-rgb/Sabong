<script lang="ts">
  import { Bird } from '@lucide/svelte'
  let { name, photo, size = 'md' }: { name: string; photo?: string; size?: 'sm' | 'md' | 'lg' } = $props()
</script>

<div class:small={size === 'sm'} class:large={size === 'lg'} class="bird-avatar" aria-label={name}>
  {#if photo}<img src={photo} alt="" />{:else}<Bird size={size === 'lg' ? 38 : size === 'sm' ? 21 : 28} strokeWidth={1.7} aria-hidden="true" />{/if}
</div>
