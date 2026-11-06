<script lang="ts">
  import { ArrowLeft, Bird, CalendarDays, ChevronRight, HeartPulse, Pencil, Swords } from '@lucide/svelte'
  import BirdAvatar from '../components/BirdAvatar.svelte'
  import { store } from '../lib/store.svelte'
  import type { ModalKind, Page } from '../lib/types'
  import { age, birdName, formatDate, recordFor } from '../lib/utils'
  let { birdId, navigate, open }: { birdId: string; navigate: (page: Page, birdId?: string) => void; open: (kind: ModalKind, values?: Record<string, string>) => void } = $props()
  let bird = $derived(store.birds.find(item => item.id === birdId))
  let record = $derived(recordFor(birdId, store.matches))
  let birdHealth = $derived(store.health.filter(log => log.targetType === 'bird' && log.targetId === birdId))
  let birdMatches = $derived(store.matches.filter(match => match.birdAId === birdId || match.birdBId === birdId))
</script>
{#if bird}
<div class="page-stack">
  <button class="back-button" onclick={() => navigate('roster')}><ArrowLeft size={18} /> Back to birds</button>
  <section class="profile-hero panel">
    <BirdAvatar name={bird.name} photo={bird.photo} size="lg" />
    <div class="profile-title"><p class="kicker">{bird.id}</p><h1>{bird.name}</h1><span class="bloodline">{bird.bloodline}</span><span class:active={bird.status === 'Active'} class="status-pill">{bird.status}</span></div>
    <button class="secondary-button profile-edit" onclick={() => open('bird', { id: bird.id })}><Pencil size={16} /> Edit profile</button>
  </section>
  <div class="metric-grid profile-metrics">
    <div class="metric-card"><strong>{record.wins}</strong><span>Wins</span></div>
    <div class="metric-card"><strong>{record.losses}</strong><span>Losses</span></div>
    <div class="metric-card"><strong>{record.draws}</strong><span>Draws</span></div>
    <div class="metric-card"><strong>{record.rate}%</strong><span>Win rate</span></div>
  </div>
  <div class="detail-columns">
    <div class="page-stack">
      <section class="panel detail-panel"><div class="section-header compact"><div><h2>Profile</h2><p>Identity and care details.</p></div></div>
        <dl class="detail-list"><div><dt>Age</dt><dd>{age(bird.hatchDate)}</dd></div><div><dt>Hatch date</dt><dd>{formatDate(bird.hatchDate)}</dd></div><div><dt>Sex</dt><dd>{bird.sex}</dd></div><div><dt>Color</dt><dd>{bird.color || '—'}</dd></div><div><dt>Weight</dt><dd>{bird.weight ? bird.weight + ' kg' : 'Not recorded'}</dd></div><div><dt>Pen</dt><dd>{store.pens.find(pen => pen.id === bird.penId)?.name || 'Unassigned'}</dd></div><div><dt>Breeder</dt><dd>{bird.breeder || '—'}</dd></div><div><dt>Pedigree notes</dt><dd>{bird.pedigreeNotes || 'No notes yet'}</dd></div></dl>
      </section>
      <section class="panel"><div class="section-header compact"><div><h2>Pedigree</h2><p>Linked parents and ancestry.</p></div><button class="text-button" onclick={() => navigate('breeding')}>Open lineage <ChevronRight size={16} /></button></div>
        <div class="pedigree-pair">
          <div><span>Sire</span><strong>{bird.sireId ? birdName(store.birds, bird.sireId) : 'Unknown sire'}</strong><small>{store.birds.find(item => item.id === bird.sireId)?.bloodline || 'No parent linked'}</small></div>
          <div><span>Dam</span><strong>{bird.damId ? birdName(store.birds, bird.damId) : 'Unknown dam'}</strong><small>{store.birds.find(item => item.id === bird.damId)?.bloodline || 'No parent linked'}</small></div>
        </div>
      </section>
    </div>
    <div class="page-stack">
      <section class="panel"><div class="section-header compact"><div><h2>Quick actions</h2></div></div><div class="profile-actions"><button onclick={() => open('health', { targetType: 'bird', targetId: bird.id })}><HeartPulse size={20} /> Log care</button><button onclick={() => open('match', { birdAId: bird.id })}><Swords size={20} /> Schedule match</button><button onclick={() => open('reminder', { birdId: bird.id })}><CalendarDays size={20} /> Set reminder</button><button onclick={() => navigate('breeding')}><Bird size={20} /> View breeding</button></div></section>
      <section class="panel"><div class="section-header compact"><div><h2>Health history</h2></div><button class="text-button" onclick={() => navigate('health')}>All logs <ChevronRight size={16} /></button></div>{#if birdHealth.length}{#each birdHealth.slice(0, 3) as log}<div class="history-row"><span class="history-dot"></span><div><strong>{log.category}</strong><small>{log.notes}</small></div><time>{formatDate(log.date)}</time></div>{/each}{:else}<p class="muted-note">No health entries for this bird yet.</p>{/if}</section>
      <section class="panel"><div class="section-header compact"><div><h2>Match record</h2></div><button class="text-button" onclick={() => navigate('matches')}>All matches <ChevronRight size={16} /></button></div>{#if birdMatches.length}{#each birdMatches.slice(0, 3) as match}<div class="history-row"><span class="history-dot red-dot"></span><div><strong>{match.eventName}</strong><small>{match.outcome === 'Pending' ? 'Upcoming' : match.winnerId === bird.id ? 'Win' : match.outcome === 'Draw' ? 'Draw' : 'Loss'}</small></div><time>{formatDate(match.date)}</time></div>{/each}{:else}<p class="muted-note">No match history yet.</p>{/if}</section>
    </div>
  </div>
</div>
{:else}
<div class="empty-state"><Bird size={30} /><h2>Bird not found</h2><button class="secondary-button" onclick={() => navigate('roster')}>Return to roster</button></div>
{/if}
