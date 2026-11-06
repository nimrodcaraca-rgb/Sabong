<script lang="ts">
  import { Activity, ArrowRight, Bird, CalendarDays, CirclePlus, ClipboardPlus, HeartPulse, Package, Swords, Trophy, TriangleAlert } from '@lucide/svelte'
  import BirdAvatar from '../components/BirdAvatar.svelte'
  import { store } from '../lib/store.svelte'
  import type { ModalKind, Page } from '../lib/types'
  import { age, birdName, formatDate, recordFor, today } from '../lib/utils'

  let { navigate, open, farmName }: { navigate: (page: Page, birdId?: string) => void; open: (kind: ModalKind) => void; farmName: string } = $props()
  let shortFarmName = $derived(farmName.replace(/\s+Farm$/i, ''))
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  let activeBirds = $derived(store.birds.filter(bird => bird.status === 'Active' || bird.status === 'Brood'))
  let completed = $derived(store.matches.filter(match => match.outcome !== 'Pending'))
  let totalWins = $derived(completed.filter(match => match.winnerId).length)
  let lowStock = $derived(store.supplies.filter(item => item.quantity <= item.reorderLevel))
  let upcoming = $derived(store.reminders.filter(item => !item.done).sort((a, b) => a.dueDate.localeCompare(b.dueDate)).slice(0, 3))
  let pendingMatches = $derived(store.matches.filter(match => match.outcome === 'Pending'))
</script>

<div class="page-stack">
  <div class="welcome-row">
    <div><p class="kicker">Farm overview</p><h1>{greeting}, {shortFarmName}</h1><p class="page-lead">Everything your stable needs, in one place.</p></div>
    <span class="date-chip"><CalendarDays size={16} /> {formatDate(today())}</span>
  </div>

  <section class="stable-hero">
    <div class="hero-emblem"><img src="/sabong-mark.png" alt="" /></div>
    <div class="hero-copy"><span>Your stable</span><h2>{activeBirds.length} birds under your care</h2><p>Keep records current and see what needs attention today.</p></div>
    <button class="hero-add" onclick={() => open('bird')}><CirclePlus size={18} /> Register bird</button>
  </section>

  <div class="section-header"><div><h2>Stable overview</h2><p>A live snapshot from the demo records.</p></div></div>
  <div class="metric-grid">
    <div class="metric-card"><span class="metric-icon gold"><Bird size={22} /></span><strong>{activeBirds.length}</strong><span>Active birds</span><small>{store.pens.length} pens in use</small></div>
    <div class="metric-card"><span class="metric-icon gold"><Trophy size={22} /></span><strong>{totalWins}</strong><span>Recorded wins</span><small>Across completed matches</small></div>
    <div class="metric-card"><span class="metric-icon red"><Swords size={22} /></span><strong>{pendingMatches.length}</strong><span>Upcoming matches</span><small>Ready to schedule</small></div>
    <div class="metric-card"><span class="metric-icon gold"><Activity size={22} /></span><strong>{store.breeding.length}</strong><span>Breeding records</span><small>Lineage tracked</small></div>
  </div>

  <div class="dashboard-columns">
    <div class="page-stack">
      <section class="panel attention-panel">
        <div class="panel-title"><span class="panel-icon amber"><TriangleAlert size={20} /></span><div><h3>Needs attention</h3><p>{lowStock.length} supplies are low · {upcoming.length} care reminders ahead</p></div></div>
        <div class="attention-actions">
          {#if lowStock.length}<button onclick={() => navigate('supplies')}>Review inventory <ArrowRight size={16} /></button>{/if}
          <button onclick={() => navigate('health')}>View care schedule <ArrowRight size={16} /></button>
        </div>
      </section>

      <section class="panel">
        <div class="section-header compact"><div><h2>Recent birds</h2><p>Quick access to the roster.</p></div><button class="text-button" onclick={() => navigate('roster')}>View all <ArrowRight size={16} /></button></div>
        <div class="bird-list">
          {#each store.birds.slice(0, 4) as bird}
            {@const record = recordFor(bird.id, store.matches)}
            <button class="bird-row" onclick={() => navigate('profile', bird.id)}>
              <BirdAvatar name={bird.name} photo={bird.photo} />
              <span class="bird-row-main"><strong>{bird.name}</strong><small>{bird.bloodline} · {age(bird.hatchDate)}</small></span>
              <span class="row-meta"><span class="tag">{store.pens.find(pen => pen.id === bird.penId)?.name || 'Unassigned'}</span><small>{record.wins}W · {record.losses}L</small></span>
              <ArrowRight size={17} class="row-arrow" />
            </button>
          {/each}
        </div>
      </section>
    </div>

    <div class="page-stack">
      <section class="panel">
        <div class="section-header compact"><div><h2>Quick actions</h2><p>Common tasks, one tap away.</p></div></div>
        <div class="action-grid">
          <button onclick={() => open('bird')}><span class="action-icon"><CirclePlus size={22} /></span><strong>Register bird</strong><small>Add a profile</small></button>
          <button onclick={() => open('health')}><span class="action-icon"><HeartPulse size={22} /></span><strong>Log treatment</strong><small>Health and care</small></button>
          <button onclick={() => open('breeding')}><span class="action-icon"><Bird size={22} /></span><strong>Record breeding</strong><small>Pair and offspring</small></button>
          <button onclick={() => open('match')}><span class="action-icon"><Swords size={22} /></span><strong>Schedule match</strong><small>Event and result</small></button>
        </div>
      </section>
      <section class="panel">
        <div class="section-header compact"><div><h2>Coming up</h2><p>Care events on the calendar.</p></div><button class="text-button" onclick={() => navigate('health')}>Schedule <ArrowRight size={16} /></button></div>
        <div class="timeline">
          {#each upcoming as reminder}
            <div class="timeline-item"><span class="timeline-dot"></span><div><strong>{reminder.description}</strong><small>{birdName(store.birds, reminder.birdId)} · {formatDate(reminder.dueDate)}</small></div></div>
          {/each}
        </div>
      </section>
      <section class="mini-banner"><Package size={20} /><span><strong>Inventory at a glance</strong><small>{lowStock.length ? lowStock.map(item => item.name).join(', ') + ' need restocking' : 'All stock levels are healthy'}</small></span><button aria-label="Open inventory" onclick={() => navigate('supplies')}><ArrowRight size={19} /></button></section>
    </div>
  </div>
</div>
