<script lang="ts">
  import { FileText, Printer } from '@lucide/svelte'
  import { store } from '../lib/store.svelte'
  import { age, birdName, formatDate, recordFor } from '../lib/utils'
  type Report = 'Birds' | 'Health' | 'Breeding' | 'Supplies' | 'Events'
  let report = $state<Report>('Birds')
  let rows = $derived.by((): string[][] => {
    if (report === 'Birds') return store.birds.map(bird => {
      const record = recordFor(bird.id, store.matches)
      return [bird.id, bird.name, bird.bloodline, age(bird.hatchDate), bird.status, record.wins + 'W / ' + record.losses + 'L']
    })
    if (report === 'Health') return store.health.map(log => [formatDate(log.date), log.category, log.targetType === 'bird' ? birdName(store.birds, log.targetId) : store.pens.find(pen => pen.id === log.targetId)?.name || 'Pen', log.notes])
    if (report === 'Breeding') return store.breeding.map(item => [formatDate(item.matingDate), birdName(store.birds, item.sireId), birdName(store.birds, item.damId), String(item.eggsCount), String(item.hatchedCount), item.eggsCount ? Math.round(item.hatchedCount / item.eggsCount * 100) + '%' : '0%'])
    if (report === 'Supplies') return store.supplies.map(item => [item.name, item.category, item.quantity + ' ' + item.unit, item.reorderLevel + ' ' + item.unit, item.quantity <= item.reorderLevel ? 'Low stock' : 'In stock'])
    return store.matches.map(item => [formatDate(item.date), item.eventName, birdName(store.birds, item.birdAId) + ' vs ' + birdName(store.birds, item.birdBId), item.outcome === 'Pending' ? 'Pending' : item.outcome === 'Draw' ? 'Draw' : birdName(store.birds, item.winnerId) + ' won'])
  })
  let headings = $derived(report === 'Birds' ? ['ID','Name','Bloodline','Age','Status','Record'] : report === 'Health' ? ['Date','Care type','Target','Notes'] : report === 'Breeding' ? ['Date','Sire','Dam','Eggs','Hatched','Rate'] : report === 'Supplies' ? ['Item','Category','Balance','Reorder at','Status'] : ['Date','Event','Participants','Result'])
</script>
<div class="page-stack print-page"><div class="page-heading"><div><p class="kicker">Farm records</p><h1>Reports</h1><p class="page-lead">Clear, printable views of your stable data.</p></div><button class="primary-button print-hide" onclick={() => window.print()}><Printer size={18} /> Print report</button></div>
  <div class="report-types print-hide">{#each ['Birds','Health','Breeding','Supplies','Events'] as kind}<button class:current={report === kind} onclick={() => report = kind as Report}><FileText size={18} /> {kind}</button>{/each}</div>
  <section class="panel report-panel"><div class="report-head"><div><span class="brand-small">SABONG</span><h2>{report} report</h2><p>San Isidro Farm · Generated {formatDate(new Date().toISOString().slice(0,10))}</p></div><span class="tag">{rows.length} records</span></div><div class="table-scroll"><table><thead><tr>{#each headings as heading}<th scope="col">{heading}</th>{/each}</tr></thead><tbody>{#each rows as row}<tr>{#each row as cell}<td>{cell}</td>{/each}</tr>{/each}</tbody></table></div>{#if !rows.length}<p class="muted-note">No records are available for this report.</p>{/if}</section>
</div>
