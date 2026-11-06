<script lang="ts">
  import { CalendarDays, Check, CirclePlus, ClipboardPlus, HeartPulse } from '@lucide/svelte'
  import { store } from '../lib/store.svelte'
  import type { ModalKind } from '../lib/types'
  import { birdName, formatDate, today } from '../lib/utils'
  let { open }: { open: (kind: ModalKind) => void } = $props()
  let tab = $state<'logs' | 'schedule'>('logs')
  let month = $derived(new Date().toLocaleDateString('en-PH', { month: 'long', year: 'numeric' }))
  let firstDay = $derived(new Date(new Date().getFullYear(), new Date().getMonth(), 1).getDay())
  let monthDays = $derived(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate())
  let cells = $derived(Array.from({ length: firstDay + monthDays }, (_, index) => index < firstDay ? 0 : index - firstDay + 1))
  let pending = $derived(store.reminders.filter(item => !item.done).sort((a, b) => a.dueDate.localeCompare(b.dueDate)))
  function hasReminder(day: number) {
    return store.reminders.some(item => new Date(item.dueDate + 'T12:00:00').getMonth() === new Date().getMonth() && Number(item.dueDate.slice(8)) === day && !item.done)
  }
</script>
<div class="page-stack">
  <div class="page-heading"><div><p class="kicker">Health & care</p><h1>Keep care on track</h1><p class="page-lead">Treatments, vaccinations, vitamins, and upcoming tasks.</p></div><div class="heading-actions"><button class="secondary-button" onclick={() => open('reminder')}><CalendarDays size={17} /> Set reminder</button><button class="primary-button" onclick={() => open('health')}><CirclePlus size={18} /> Log care</button></div></div>
  <div class="tab-list" role="tablist" aria-label="Care views"><button role="tab" aria-selected={tab === 'logs'} class:current={tab === 'logs'} onclick={() => tab = 'logs'}><ClipboardPlus size={17} /> Care log</button><button role="tab" aria-selected={tab === 'schedule'} class:current={tab === 'schedule'} onclick={() => tab = 'schedule'}><CalendarDays size={17} /> Schedule</button></div>
  {#if tab === 'logs'}
    <div class="detail-columns">
      <section class="panel"><div class="section-header compact"><div><h2>Recent care</h2><p>All treatments and routine checks.</p></div></div><div class="health-list">{#each store.health as log}<article class="health-row"><span class="health-icon"><HeartPulse size={18} /></span><div><div class="health-title"><h3>{log.category}</h3><span class="tag">{log.targetType === 'bird' ? birdName(store.birds, log.targetId) : store.pens.find(pen => pen.id === log.targetId)?.name || 'Pen'}</span></div><p>{log.notes}</p><small>{formatDate(log.date)}</small></div></article>{/each}</div></section>
      <section class="panel"><div class="section-header compact"><div><h2>Care reminders</h2><p>Upcoming work for your birds.</p></div></div><div class="reminder-list">{#each pending as reminder}<div class="reminder-row"><span class="reminder-date">{new Date(reminder.dueDate + 'T12:00:00').getDate()}<small>{new Date(reminder.dueDate + 'T12:00:00').toLocaleDateString('en-PH', { month: 'short' })}</small></span><div><strong>{reminder.description}</strong><small>{birdName(store.birds, reminder.birdId)}</small></div><button class="icon-button" aria-label={'Mark ' + reminder.description + ' done'} onclick={() => store.toggleReminder(reminder.id)}><Check size={18} /></button></div>{:else}<p class="muted-note">All care reminders are complete.</p>{/each}</div></section>
    </div>
  {:else}
    <div class="detail-columns">
      <section class="panel"><div class="section-header compact"><div><h2>{month}</h2><p>Dots mark scheduled care.</p></div></div><div class="calendar-weekdays">{#each ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'] as day}<span>{day}</span>{/each}</div><div class="calendar-grid">{#each cells as day}<div class:today={day !== 0 && Number(today().slice(8)) === day} class:has-event={day !== 0 && hasReminder(day)}>{day || ''}</div>{/each}</div></section>
      <section class="panel"><div class="section-header compact"><div><h2>Scheduled care</h2><p>Complete an item when the task is done.</p></div></div>{#each pending as reminder}<div class="reminder-row"><span class="reminder-date">{new Date(reminder.dueDate + 'T12:00:00').getDate()}<small>{new Date(reminder.dueDate + 'T12:00:00').toLocaleDateString('en-PH', { month: 'short' })}</small></span><div><strong>{reminder.description}</strong><small>{birdName(store.birds, reminder.birdId)} · {formatDate(reminder.dueDate)}</small></div><button class="icon-button" aria-label={'Mark ' + reminder.description + ' done'} onclick={() => store.toggleReminder(reminder.id)}><Check size={18} /></button></div>{:else}<p class="muted-note">No care reminders scheduled.</p>{/each}</section>
    </div>
  {/if}
</div>
