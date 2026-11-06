<script lang="ts">
  import { tick } from 'svelte'
  import { ArrowRight, Bell, Bird, CalendarDays, CirclePlus, FileText, HeartPulse, LayoutDashboard, LogOut, Menu, Package, Swords, X } from '@lucide/svelte'
  import Auth from './screens/Auth.svelte'
  import Dashboard from './screens/Dashboard.svelte'
  import Roster from './screens/Roster.svelte'
  import Profile from './screens/Profile.svelte'
  import Breeding from './screens/Breeding.svelte'
  import Health from './screens/Health.svelte'
  import Supplies from './screens/Supplies.svelte'
  import Matches from './screens/Matches.svelte'
  import Reports from './screens/Reports.svelte'
  import More from './screens/More.svelte'
  import { store } from './lib/store.svelte'
  import type { Bird as BirdRecord, ModalKind, Page } from './lib/types'
  import { BLOODLINES, age, makeId, today } from './lib/utils'

  let signedIn = $state(false)
  let farmName = $state('San Isidro Farm')
  let page = $state<Page>('dashboard')
  let selectedBirdId = $state('GF-003')
  let modalKind = $state<ModalKind | null>(null)
  let draft = $state<Record<string, string>>({})
  let errors = $state<Record<string, string>>({})
  let toast = $state('')
  let mobileMenu = $state(false)
  let pendingBirdDraft = $state<Record<string, string> | null>(null)
  let modalElement: HTMLDialogElement
  let toastTimer: ReturnType<typeof setTimeout>

  const nav = [
    { id: 'dashboard' as Page, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'roster' as Page, label: 'Bird directory', icon: Bird },
    { id: 'breeding' as Page, label: 'Breeding & lineage', icon: Bird },
    { id: 'health' as Page, label: 'Care & schedule', icon: HeartPulse },
    { id: 'supplies' as Page, label: 'Supply tracker', icon: Package },
    { id: 'matches' as Page, label: 'Matches & brackets', icon: Swords },
    { id: 'reports' as Page, label: 'Reports', icon: FileText },
  ]
  const pageLabels: Record<Page, string> = { dashboard: 'Dashboard', roster: 'Bird directory', profile: 'Bird profile', breeding: 'Breeding & lineage', health: 'Care & schedule', supplies: 'Supply tracker', matches: 'Matches & brackets', reports: 'Reports', more: 'More tools' }
  const modalLabels: Record<ModalKind, { title: string; description: string; action: string }> = {
    bird: { title: 'Register bird', description: 'Create a profile and link its place in your stable.', action: 'Save bird' },
    health: { title: 'Log care', description: 'Record a treatment, vaccination, vitamin, or routine check.', action: 'Save care log' },
    breeding: { title: 'Record pairing', description: 'Link a sire and dam and track the hatch result.', action: 'Save pairing' },
    supply: { title: 'Add supply', description: 'Track another feed, medicine, or farm item.', action: 'Add supply' },
    match: { title: 'Schedule match', description: 'Add a derby or sparring event to the calendar.', action: 'Schedule match' },
    reminder: { title: 'Set care reminder', description: 'Schedule a task for a bird in your stable.', action: 'Save reminder' },
    pen: { title: 'Add pen', description: 'Create another housing location.', action: 'Add pen' },
  }
  let pendingCount = $derived(store.reminders.filter(item => !item.done).length)

  function navigate(next: Page, birdId?: string) {
    if (birdId) selectedBirdId = birdId
    page = next
    mobileMenu = false
    window.scrollTo({ top: 0, behavior: 'instant' })
  }
  function notify(message: string) {
    toast = message
    clearTimeout(toastTimer)
    toastTimer = setTimeout(() => toast = '', 3800)
  }
  function enter(farm?: string) {
    if (farm) farmName = farm
    signedIn = true
    navigate('dashboard')
  }
  function signOut() {
    signedIn = false
    page = 'dashboard'
    mobileMenu = false
    notify('Signed out of the UI demo')
  }
  async function open(kind: ModalKind, values: Record<string, string> = {}) {
    errors = {}
    modalKind = kind
    if (kind === 'bird') {
      const bird = values.id ? store.birds.find(item => item.id === values.id) : undefined
      const base = bird || store.createEmptyBird()
      draft = { ...base, weight: String(base.weight || ''), photo: base.photo || '', ...values }
    } else if (kind === 'health') draft = { targetType: 'bird', targetId: store.birds[0]?.id || '', category: 'Vaccination', date: today(), notes: '', ...values }
    else if (kind === 'breeding') draft = { sireId: store.birds.find(item => item.sex === 'Male')?.id || '', damId: store.birds.find(item => item.sex === 'Female')?.id || '', matingDate: today(), eggsCount: '0', hatchedCount: '0', notes: '', ...values }
    else if (kind === 'supply') draft = { name: '', category: 'Feed', quantity: '0', unit: 'kg', reorderLevel: '0', ...values }
    else if (kind === 'match') draft = { eventName: '', date: today(), birdAId: store.birds.find(item => item.sex === 'Male')?.id || '', birdBId: '', round: '1', ...values }
    else if (kind === 'reminder') draft = { birdId: store.birds[0]?.id || '', description: '', dueDate: today(), ...values }
    else draft = { name: '', ...values }
    await tick()
    modalElement?.showModal()
  }
  function closeModal() {
    if (modalElement?.open) modalElement.close()
    modalKind = null
    errors = {}
  }
  async function submitModal(event: SubmitEvent) {
    event.preventDefault()
    if (!modalKind) return
    const next: Record<string, string> = {}
    const required = (key: string, message: string) => { if (!draft[key]?.trim()) next[key] = message }
    if (modalKind === 'bird') {
      required('name', 'Enter a bird name.')
      required('bloodline', 'Choose a bloodline.')
      required('color', 'Enter the bird color or markings.')
      required('hatchDate', 'Choose a hatch date.')
      if (draft.hatchDate && draft.hatchDate > today()) next.hatchDate = 'Hatch date cannot be in the future.'
      if (draft.sireId && draft.sireId === draft.damId) next.damId = 'Sire and dam must be different birds.'
      if (!Object.keys(next).length) {
        const bird: BirdRecord = { id: draft.id, name: draft.name.trim(), breed: draft.breed || 'Gamefowl', bloodline: draft.bloodline, sex: draft.sex as BirdRecord['sex'], color: draft.color.trim(), hatchDate: draft.hatchDate, weight: Math.max(0, Number(draft.weight) || 0), status: draft.status as BirdRecord['status'], penId: draft.penId || '', sireId: draft.sireId || '', damId: draft.damId || '', breeder: draft.breeder?.trim() || '', pedigreeNotes: draft.pedigreeNotes?.trim() || '', photo: draft.photo || undefined }
        const exists = store.birds.some(item => item.id === bird.id)
        if (exists) store.updateBird(bird)
        else store.addBird(bird)
        closeModal(); notify(exists ? 'Bird profile updated' : bird.name + ' added to your stable'); navigate('profile', bird.id)
      }
    } else if (modalKind === 'health') {
      required('targetId', 'Choose a bird or pen.')
      required('notes', 'Describe the care provided.')
      required('date', 'Choose a date.')
      if (!Object.keys(next).length) { store.addHealth({ id: makeId('HL'), targetType: draft.targetType as 'bird' | 'pen', targetId: draft.targetId, category: draft.category as 'Vaccination' | 'Vitamin' | 'Medication' | 'Routine care', date: draft.date, notes: draft.notes.trim() }); closeModal(); notify('Care log saved'); navigate('health') }
    } else if (modalKind === 'breeding') {
      required('sireId', 'Choose a sire.')
      required('damId', 'Choose a dam.')
      if (draft.sireId === draft.damId) next.damId = 'Choose a different bird for the dam.'
      if (Number(draft.hatchedCount) > Number(draft.eggsCount)) next.hatchedCount = 'Hatched count cannot exceed eggs set.'
      if (!Object.keys(next).length) { store.addBreeding({ id: makeId('BR'), sireId: draft.sireId, damId: draft.damId, matingDate: draft.matingDate, eggsCount: Math.max(0, Number(draft.eggsCount) || 0), hatchedCount: Math.max(0, Number(draft.hatchedCount) || 0), notes: draft.notes?.trim() || '' }); closeModal(); notify('Pairing recorded'); navigate('breeding') }
    } else if (modalKind === 'supply') {
      required('name', 'Enter an item name.')
      required('unit', 'Enter a unit, such as kg or bottles.')
      if (!Object.keys(next).length) { store.addSupply({ id: makeId('SI'), name: draft.name.trim(), category: draft.category as 'Feed' | 'Vitamin' | 'Medicine' | 'Equipment', quantity: Math.max(0, Number(draft.quantity) || 0), unit: draft.unit.trim(), reorderLevel: Math.max(0, Number(draft.reorderLevel) || 0) }); closeModal(); notify('Supply item added'); navigate('supplies') }
    } else if (modalKind === 'match') {
      required('eventName', 'Enter an event name.')
      required('birdAId', 'Choose the first bird.')
      required('birdBId', 'Choose the second bird.')
      if (draft.birdAId && draft.birdAId === draft.birdBId) next.birdBId = 'Choose a different second bird.'
      if (!Object.keys(next).length) { store.addMatch({ id: makeId('MT'), eventName: draft.eventName.trim(), date: draft.date, birdAId: draft.birdAId, birdBId: draft.birdBId, round: Math.max(1, Number(draft.round) || 1), outcome: 'Pending', winnerId: '' }); closeModal(); notify('Match scheduled'); navigate('matches') }
    } else if (modalKind === 'reminder') {
      required('birdId', 'Choose a bird.')
      required('description', 'Describe the care task.')
      if (!Object.keys(next).length) { store.addReminder({ id: makeId('R'), birdId: draft.birdId, description: draft.description.trim(), dueDate: draft.dueDate, done: false }); closeModal(); notify('Care reminder scheduled'); navigate('health') }
    } else {
      required('name', 'Enter a pen name.')
      if (!Object.keys(next).length) { const pen = store.addPen(draft.name.trim()); const previousBird = pendingBirdDraft; pendingBirdDraft = null; closeModal(); notify('Pen added'); if (previousBird) open('bird', { ...previousBird, penId: pen.id }) }
    }
    errors = next
    if (Object.keys(next).length) {
      await tick()
      modalElement?.querySelector<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>('[aria-invalid="true"]')?.focus()
    }
  }
  function handlePhoto(event: Event) {
    const file = (event.currentTarget as HTMLInputElement).files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => { draft.photo = String(reader.result || '') }
    reader.readAsDataURL(file)
  }
</script>

{#if !signedIn}
  <Auth onEnter={enter} />
{:else}
  <div class="app-shell">
    <aside class="sidebar">
      <button class="sidebar-brand" onclick={() => navigate('dashboard')} aria-label="Sabong dashboard"><span class="brand-mark"><img src="/sabong-mark.png" alt="" /></span><span><strong>SABONG</strong><small>Stable manager</small></span></button>
      <div class="farm-switch"><span class="farm-initial">S</span><span><strong>{farmName}</strong><small>Demo workspace</small></span></div>
      <div class="sidebar-section-label">Workspace</div>
      <nav class="side-nav" aria-label="Main navigation">
        {#each nav as item}
          {@const Icon = item.icon}
          <button class:current={page === item.id || (page === 'profile' && item.id === 'roster')} onclick={() => navigate(item.id)}><Icon size={19} strokeWidth={1.8} /><span>{item.label}</span>{#if item.id === 'health' && pendingCount}<small>{pendingCount}</small>{/if}</button>
        {/each}
      </nav>
      <div class="sidebar-bottom"><div class="sidebar-help"><Bell size={18} /><span><strong>Stay on schedule</strong><small>{pendingCount} care reminders ahead</small></span></div><button class="logout-button" onclick={signOut}><LogOut size={18} /> Sign out</button></div>
    </aside>
    <div class="app-main">
      <header class="topbar"><div class="mobile-top-brand"><img src="/sabong-mark.png" alt="" /><strong>SABONG</strong></div><div class="breadcrumb"><span>Workspace</span><ArrowRight size={14} /><strong>{pageLabels[page]}</strong></div><div class="topbar-actions"><span class="demo-badge">UI demo</span><button class="topbar-notification" aria-label="Open care reminders" onclick={() => navigate('health')}><Bell size={19} />{#if pendingCount}<i></i>{/if}</button><span class="user-avatar" title={farmName}>S</span><button class="mobile-logout" aria-label="Sign out" onclick={signOut}><LogOut size={19} /></button></div></header>
      <main class="content" id="main-content">
        {#if page === 'dashboard'}<Dashboard {navigate} {open} {farmName} />
        {:else if page === 'roster'}<Roster {navigate} {open} />
        {:else if page === 'profile'}<Profile birdId={selectedBirdId} {navigate} {open} />
        {:else if page === 'breeding'}<Breeding {navigate} {open} />
        {:else if page === 'health'}<Health {open} />
        {:else if page === 'supplies'}<Supplies {open} {notify} />
        {:else if page === 'matches'}<Matches {open} {notify} />
        {:else if page === 'reports'}<Reports />
        {:else}<More {navigate} />{/if}
      </main>
    </div>
    <nav class="mobile-nav" aria-label="Mobile navigation">
      <button class:current={page === 'dashboard'} onclick={() => navigate('dashboard')}><LayoutDashboard size={21} /><span>Home</span></button>
      <button class:current={page === 'roster' || page === 'profile'} onclick={() => navigate('roster')}><Bird size={21} /><span>Birds</span></button>
      <button class="mobile-add" aria-label="Register bird" onclick={() => open('bird')}><CirclePlus size={27} /><span>Add</span></button>
      <button class:current={page === 'health'} onclick={() => navigate('health')}><HeartPulse size={21} /><span>Care</span></button>
      <button class:current={!['dashboard','roster','profile','health'].includes(page)} onclick={() => navigate('more')}><Menu size={21} /><span>More</span></button>
    </nav>
  </div>
{/if}

<dialog class="form-dialog" bind:this={modalElement} onclose={() => { if (!modalElement.open) modalKind = null }} onclick={(event) => { if (event.target === modalElement) closeModal() }}>
  {#if modalKind}
    <div class="dialog-header"><div><p class="kicker">Sabong records</p><h2>{draft.id && modalKind === 'bird' && store.birds.some(item => item.id === draft.id) ? 'Edit bird profile' : modalLabels[modalKind].title}</h2><p>{modalLabels[modalKind].description}</p></div><button class="icon-button" aria-label="Close form" onclick={closeModal}><X size={20} /></button></div>
    <form class="dialog-form" onsubmit={submitModal} novalidate>
      {#if Object.keys(errors).length}<div class="error-summary" role="alert">Please correct the highlighted fields.</div>{/if}
      {#if modalKind === 'bird'}
        <label class="photo-upload"><span class="bird-photo-preview">{#if draft.photo}<img src={draft.photo} alt="Selected bird" />{:else}<Bird size={28} />{/if}</span><span>{draft.photo ? 'Change photo' : 'Add bird photo'}<small>Choose a photo or use your camera</small></span><input type="file" accept="image/*" capture="environment" onchange={handlePhoto} /></label>
        <div class="form-grid"><label class="field"><span>Bird name <b>*</b></span><input bind:value={draft.name} aria-invalid={!!errors.name} placeholder="e.g. Atlas" />{#if errors.name}<small class="field-error">{errors.name}</small>{/if}</label><label class="field"><span>Bloodline <b>*</b></span><select bind:value={draft.bloodline} aria-invalid={!!errors.bloodline}><option value="">Select bloodline</option>{#each BLOODLINES as line}<option value={line}>{line}</option>{/each}</select>{#if errors.bloodline}<small class="field-error">{errors.bloodline}</small>{/if}</label></div>
        <div class="form-grid"><label class="field"><span>Breed</span><input bind:value={draft.breed} placeholder="Gamefowl" /></label><label class="field"><span>Sex</span><select bind:value={draft.sex}><option>Male</option><option>Female</option></select></label></div>
        <div class="form-grid"><label class="field"><span>Color / markings <b>*</b></span><input bind:value={draft.color} aria-invalid={!!errors.color} placeholder="e.g. Red and black" />{#if errors.color}<small class="field-error">{errors.color}</small>{/if}</label><label class="field"><span>Hatch date <b>*</b></span><input type="date" bind:value={draft.hatchDate} aria-invalid={!!errors.hatchDate} max={today()} />{#if errors.hatchDate}<small class="field-error">{errors.hatchDate}</small>{:else}<small class="field-hint">{age(draft.hatchDate)}</small>{/if}</label></div>
        <div class="form-grid"><label class="field"><span>Pen</span><select bind:value={draft.penId}><option value="">Unassigned</option>{#each store.pens as pen}<option value={pen.id}>{pen.name}</option>{/each}</select></label><label class="field"><span>Status</span><select bind:value={draft.status}><option>Active</option><option>Brood</option><option>Sold</option><option>Deceased</option></select></label></div>
        <button type="button" class="inline-link" onclick={() => { pendingBirdDraft = { ...draft }; closeModal(); open('pen') }}>Add a new pen</button>
        <div class="form-grid"><label class="field"><span>Sire</span><select bind:value={draft.sireId}><option value="">Unknown</option>{#each store.birds.filter(item => item.sex === 'Male' && item.id !== draft.id) as bird}<option value={bird.id}>{bird.name}</option>{/each}</select></label><label class="field"><span>Dam</span><select bind:value={draft.damId} aria-invalid={!!errors.damId}><option value="">Unknown</option>{#each store.birds.filter(item => item.sex === 'Female' && item.id !== draft.id) as bird}<option value={bird.id}>{bird.name}</option>{/each}</select>{#if errors.damId}<small class="field-error">{errors.damId}</small>{/if}</label></div>
        <div class="form-grid"><label class="field"><span>Weight (kg)</span><input type="number" step="0.01" min="0" bind:value={draft.weight} /></label><label class="field"><span>Breeder</span><input bind:value={draft.breeder} placeholder="Farm or breeder name" /></label></div><label class="field"><span>Pedigree notes</span><textarea rows="3" bind:value={draft.pedigreeNotes} placeholder="Traits, ancestry, and notes"></textarea></label>
      {:else if modalKind === 'health'}
        <div class="form-grid"><label class="field"><span>Apply to</span><select bind:value={draft.targetType} onchange={() => draft.targetId = draft.targetType === 'bird' ? store.birds[0]?.id || '' : store.pens[0]?.id || ''}><option value="bird">Single bird</option><option value="pen">Entire pen</option></select></label><label class="field"><span>{draft.targetType === 'bird' ? 'Bird' : 'Pen'} <b>*</b></span><select bind:value={draft.targetId} aria-invalid={!!errors.targetId}>{#if draft.targetType === 'bird'}{#each store.birds as bird}<option value={bird.id}>{bird.name}</option>{/each}{:else}{#each store.pens as pen}<option value={pen.id}>{pen.name}</option>{/each}{/if}</select>{#if errors.targetId}<small class="field-error">{errors.targetId}</small>{/if}</label></div>
        <div class="form-grid"><label class="field"><span>Care type</span><select bind:value={draft.category}><option>Vaccination</option><option>Vitamin</option><option>Medication</option><option>Routine care</option></select></label><label class="field"><span>Date</span><input type="date" bind:value={draft.date} /></label></div><label class="field"><span>Notes <b>*</b></span><textarea rows="4" bind:value={draft.notes} aria-invalid={!!errors.notes} placeholder="Treatment, dosage, and observations"></textarea>{#if errors.notes}<small class="field-error">{errors.notes}</small>{/if}</label>
      {:else if modalKind === 'breeding'}
        <div class="form-grid"><label class="field"><span>Sire <b>*</b></span><select bind:value={draft.sireId} aria-invalid={!!errors.sireId}>{#each store.birds.filter(item => item.sex === 'Male') as bird}<option value={bird.id}>{bird.name} · {bird.bloodline}</option>{/each}</select>{#if errors.sireId}<small class="field-error">{errors.sireId}</small>{/if}</label><label class="field"><span>Dam <b>*</b></span><select bind:value={draft.damId} aria-invalid={!!errors.damId}>{#each store.birds.filter(item => item.sex === 'Female') as bird}<option value={bird.id}>{bird.name} · {bird.bloodline}</option>{/each}</select>{#if errors.damId}<small class="field-error">{errors.damId}</small>{/if}</label></div>
        <div class="form-grid"><label class="field"><span>Mating date</span><input type="date" bind:value={draft.matingDate} /></label><label class="field"><span>Eggs set</span><input type="number" min="0" bind:value={draft.eggsCount} /></label></div><label class="field"><span>Chicks hatched</span><input type="number" min="0" bind:value={draft.hatchedCount} aria-invalid={!!errors.hatchedCount} />{#if errors.hatchedCount}<small class="field-error">{errors.hatchedCount}</small>{/if}</label><label class="field"><span>Notes</span><textarea rows="3" bind:value={draft.notes} placeholder="Pairing notes"></textarea></label>
      {:else if modalKind === 'supply'}
        <label class="field"><span>Item name <b>*</b></span><input bind:value={draft.name} aria-invalid={!!errors.name} placeholder="e.g. Grower feed" />{#if errors.name}<small class="field-error">{errors.name}</small>{/if}</label><div class="form-grid"><label class="field"><span>Category</span><select bind:value={draft.category}><option>Feed</option><option>Vitamin</option><option>Medicine</option><option>Equipment</option></select></label><label class="field"><span>Unit <b>*</b></span><input bind:value={draft.unit} aria-invalid={!!errors.unit} placeholder="kg, bottles, vials" />{#if errors.unit}<small class="field-error">{errors.unit}</small>{/if}</label></div><div class="form-grid"><label class="field"><span>Starting quantity</span><input type="number" min="0" step="0.1" bind:value={draft.quantity} /></label><label class="field"><span>Low stock alert at</span><input type="number" min="0" step="0.1" bind:value={draft.reorderLevel} /></label></div>
      {:else if modalKind === 'match'}
        <label class="field"><span>Event name <b>*</b></span><input bind:value={draft.eventName} aria-invalid={!!errors.eventName} placeholder="e.g. November sparring" />{#if errors.eventName}<small class="field-error">{errors.eventName}</small>{/if}</label><div class="form-grid"><label class="field"><span>Match date</span><input type="date" bind:value={draft.date} /></label><label class="field"><span>Bracket round</span><input type="number" min="1" bind:value={draft.round} /></label></div><div class="form-grid"><label class="field"><span>First bird <b>*</b></span><select bind:value={draft.birdAId} aria-invalid={!!errors.birdAId}><option value="">Choose a bird</option>{#each store.birds as bird}<option value={bird.id}>{bird.name}</option>{/each}</select>{#if errors.birdAId}<small class="field-error">{errors.birdAId}</small>{/if}</label><label class="field"><span>Second bird <b>*</b></span><select bind:value={draft.birdBId} aria-invalid={!!errors.birdBId}><option value="">Choose a bird</option>{#each store.birds as bird}<option value={bird.id}>{bird.name}</option>{/each}</select>{#if errors.birdBId}<small class="field-error">{errors.birdBId}</small>{/if}</label></div>
      {:else if modalKind === 'reminder'}
        <label class="field"><span>Bird <b>*</b></span><select bind:value={draft.birdId} aria-invalid={!!errors.birdId}>{#each store.birds as bird}<option value={bird.id}>{bird.name}</option>{/each}</select>{#if errors.birdId}<small class="field-error">{errors.birdId}</small>{/if}</label><label class="field"><span>Care task <b>*</b></span><input bind:value={draft.description} aria-invalid={!!errors.description} placeholder="e.g. Deworming" />{#if errors.description}<small class="field-error">{errors.description}</small>{/if}</label><label class="field"><span>Due date</span><input type="date" bind:value={draft.dueDate} /></label>
      {:else}
        <label class="field"><span>Pen name <b>*</b></span><input bind:value={draft.name} aria-invalid={!!errors.name} placeholder="e.g. Pen 7" />{#if errors.name}<small class="field-error">{errors.name}</small>{/if}</label>
      {/if}
      <div class="dialog-actions"><button type="button" class="secondary-button" onclick={closeModal}>Cancel</button><button type="submit" class="primary-button">{modalLabels[modalKind].action} <ArrowRight size={17} /></button></div>
    </form>
  {/if}
</dialog>
{#if toast}<div class="toast" role="status">{toast}</div>{/if}
