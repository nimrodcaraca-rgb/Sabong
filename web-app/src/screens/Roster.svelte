<script lang="ts">
  import { ArrowRight, CirclePlus, Search, SlidersHorizontal } from '@lucide/svelte'
  import BirdAvatar from '../components/BirdAvatar.svelte'
  import { store } from '../lib/store.svelte'
  import type { ModalKind, Page } from '../lib/types'
  import { age, recordFor } from '../lib/utils'

  let { navigate, open }: { navigate: (page: Page, birdId?: string) => void; open: (kind: ModalKind) => void } = $props()
  let query = $state('')
  let status = $state('All')
  let filtered = $derived(store.birds.filter(bird => {
    const matchesQuery = [bird.id, bird.name, bird.breed, bird.bloodline].some(value => value.toLowerCase().includes(query.toLowerCase()))
    return matchesQuery && (status === 'All' || bird.status === status)
  }))
</script>
<div class="page-stack">
  <div class="page-heading"><div><p class="kicker">Chicken directory</p><h1>Your birds</h1><p class="page-lead">Profiles, pens, lineage, and records for every bird.</p></div><button class="primary-button" onclick={() => open('bird')}><CirclePlus size={18} /> Register bird</button></div>
  <div class="toolbar"><label class="search-field"><Search size={18} /><span class="sr-only">Search birds</span><input bind:value={query} placeholder="Search by name, ID, or breed" /></label><label class="filter-field"><SlidersHorizontal size={17} /><span class="sr-only">Filter by status</span><select bind:value={status}><option>All</option><option>Active</option><option>Brood</option><option>Sold</option><option>Deceased</option></select></label></div>
  <div class="list-summary"><strong>{filtered.length} birds</strong><span>{store.birds.length} total in the demo stable</span></div>
  {#if filtered.length}
    <div class="roster-grid">
      {#each filtered as bird}
        {@const record = recordFor(bird.id, store.matches)}
        <button class="roster-card" onclick={() => navigate('profile', bird.id)}>
          <div class="roster-top"><BirdAvatar name={bird.name} photo={bird.photo} size="lg" /><span class:active={bird.status === 'Active'} class="status-pill">{bird.status}</span></div>
          <div class="roster-name"><div><h2>{bird.name}</h2><span>{bird.id}</span></div><ArrowRight size={18} /></div>
          <p class="bloodline">{bird.bloodline}</p>
          <div class="roster-foot"><span>{store.pens.find(pen => pen.id === bird.penId)?.name || 'Unassigned'}</span><span>{age(bird.hatchDate)}</span><span>{record.wins}W · {record.losses}L</span></div>
        </button>
      {/each}
    </div>
  {:else}
    <div class="empty-state"><Search size={26} /><h2>No birds found</h2><p>Try another search or status filter.</p><button class="secondary-button" onclick={() => { query = ''; status = 'All' }}>Clear filters</button></div>
  {/if}
</div>
