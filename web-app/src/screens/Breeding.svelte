<script lang="ts">
  import { ArrowRight, Bird, CirclePlus, GitBranch, Sprout } from '@lucide/svelte'
  import { store } from '../lib/store.svelte'
  import type { ModalKind, Page } from '../lib/types'
  import { age, birdName, formatDate } from '../lib/utils'
  let { navigate, open }: { navigate: (page: Page, birdId?: string) => void; open: (kind: ModalKind, values?: Record<string, string>) => void } = $props()
  let selected = $state('GF-003')
  let bird = $derived(store.birds.find(item => item.id === selected))
  let sire = $derived(store.birds.find(item => item.id === bird?.sireId))
  let dam = $derived(store.birds.find(item => item.id === bird?.damId))
  let offspring = $derived(store.birds.filter(item => item.sireId === selected || item.damId === selected))
</script>
<div class="page-stack">
  <div class="page-heading"><div><p class="kicker">Breeding & lineage</p><h1>Know every generation</h1><p class="page-lead">Track pairings, hatch results, and family lines.</p></div><button class="primary-button" onclick={() => open('breeding')}><CirclePlus size={18} /> Record pairing</button></div>
  <div class="breeding-overview"><div><span class="metric-icon gold"><GitBranch size={23} /></span><strong>{store.breeding.length}</strong><small>Recorded pairings</small></div><div><span class="metric-icon gold"><Sprout size={23} /></span><strong>{store.breeding.reduce((sum, item) => sum + item.hatchedCount, 0)}</strong><small>Chicks hatched</small></div><div><span class="metric-icon red"><Bird size={23} /></span><strong>{store.birds.filter(item => item.sireId || item.damId).length}</strong><small>Birds with linked parents</small></div></div>
  <div class="detail-columns">
    <section class="panel"><div class="section-header compact"><div><h2>Pedigree explorer</h2><p>Choose a bird to inspect its ancestry.</p></div></div><label class="field"><span>Bird</span><select bind:value={selected}>{#each store.birds as item}<option value={item.id}>{item.name} · {item.id}</option>{/each}</select></label>
      {#if bird}
      <div class="lineage-tree">
        <button class="lineage-main" onclick={() => navigate('profile', bird.id)}><Bird size={25} /><strong>{bird.name}</strong><small>{bird.bloodline} · {age(bird.hatchDate)}</small></button>
        <div class="lineage-connector"></div>
        <div class="lineage-parents"><div class="lineage-branch"><span>Sire</span>{#if sire}<button onclick={() => navigate('profile', sire.id)}><strong>{sire.name}</strong><small>{sire.bloodline}</small></button>{:else}<div class="unknown-parent">No sire linked</div>{/if}</div><div class="lineage-branch"><span>Dam</span>{#if dam}<button onclick={() => navigate('profile', dam.id)}><strong>{dam.name}</strong><small>{dam.bloodline}</small></button>{:else}<div class="unknown-parent">No dam linked</div>{/if}</div></div>
        {#if sire?.sireId || sire?.damId || dam?.sireId || dam?.damId}<div class="grandparent-row"><span>Grandparents</span><div>{#each [sire?.sireId, sire?.damId, dam?.sireId, dam?.damId] as id}<span>{id ? birdName(store.birds, id) : 'Unknown'}</span>{/each}</div></div>{/if}
      </div>
      <div class="offspring-block"><h3>Linked offspring</h3>{#if offspring.length}<div class="chip-row">{#each offspring as child}<button class="tag button-tag" onclick={() => navigate('profile', child.id)}>{child.name} <ArrowRight size={13} /></button>{/each}</div>{:else}<p class="muted-note">No offspring linked to this bird.</p>{/if}</div>
      {/if}
    </section>
    <section class="panel"><div class="section-header compact"><div><h2>Pairing records</h2><p>Eggs, hatch rates, and offspring.</p></div></div>
      {#if store.breeding.length}<div class="record-stack">{#each store.breeding as record}<article class="record-card"><div class="record-top"><span class="tag">{formatDate(record.matingDate)}</span><span class="record-id">{record.id}</span></div><h3>{birdName(store.birds, record.sireId)} <span>×</span> {birdName(store.birds, record.damId)}</h3><p>{record.notes || 'Pairing recorded for this breeding cycle.'}</p><div class="record-measures"><div><strong>{record.eggsCount}</strong><small>Eggs set</small></div><div><strong>{record.hatchedCount}</strong><small>Hatched</small></div><div><strong>{record.eggsCount ? Math.round(record.hatchedCount / record.eggsCount * 100) : 0}%</strong><small>Hatch rate</small></div></div><button class="text-button" onclick={() => open('bird', { sireId: record.sireId, damId: record.damId })}>Link a new chick <ArrowRight size={15} /></button></article>{/each}</div>{:else}<p class="muted-note">Record a pairing to start a lineage history.</p>{/if}
    </section>
  </div>
</div>
