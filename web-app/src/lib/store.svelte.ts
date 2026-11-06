import type { Bird, BreedingRecord, HealthLog, MatchRecord, Pen, Reminder, Supply } from './types'
import { makeId, offsetDate, today } from './utils'

class DemoStore {
  birds = $state<Bird[]>([
    { id: 'GF-001', name: 'Atlas', breed: 'Gamefowl', bloodline: 'Sweater', sex: 'Male', color: 'Red and black', hatchDate: '2024-03-18', weight: 2.6, status: 'Active', penId: 'P-1', sireId: '', damId: '', breeder: 'San Isidro Farm', pedigreeNotes: 'Strong frame and quick recovery.' },
    { id: 'GF-002', name: 'Sable', breed: 'Gamefowl', bloodline: 'Kelso', sex: 'Female', color: 'Black', hatchDate: '2024-07-09', weight: 2.1, status: 'Brood', penId: 'P-2', sireId: '', damId: '', breeder: 'San Isidro Farm', pedigreeNotes: 'Foundation hen for the Kelso line.' },
    { id: 'GF-003', name: 'Copper', breed: 'Gamefowl', bloodline: 'Sweater × Kelso', sex: 'Male', color: 'Copper', hatchDate: '2025-04-02', weight: 2.3, status: 'Active', penId: 'P-3', sireId: 'GF-001', damId: 'GF-002', breeder: 'San Isidro Farm', pedigreeNotes: 'First offspring of Atlas and Sable.' },
    { id: 'GF-004', name: 'Ember', breed: 'Gamefowl', bloodline: 'Hatch', sex: 'Male', color: 'Red', hatchDate: '2025-01-23', weight: 2.4, status: 'Active', penId: 'P-4', sireId: '', damId: '', breeder: 'S. Villanueva', pedigreeNotes: 'Good balance and consistent conditioning.' },
    { id: 'GF-005', name: 'Luna', breed: 'Gamefowl', bloodline: 'Roundhead', sex: 'Female', color: 'Grey', hatchDate: '2025-06-11', weight: 1.9, status: 'Brood', penId: 'P-5', sireId: '', damId: '', breeder: 'San Isidro Farm', pedigreeNotes: 'Calm temperament.' },
    { id: 'GF-006', name: 'Blaze', breed: 'Gamefowl', bloodline: 'Hatch × Roundhead', sex: 'Male', color: 'Red and white', hatchDate: '2026-02-14', weight: 1.7, status: 'Active', penId: 'P-6', sireId: 'GF-004', damId: 'GF-005', breeder: 'San Isidro Farm', pedigreeNotes: 'Young bird. Monitor growth monthly.' },
  ])
  pens = $state<Pen[]>([
    { id: 'P-1', name: 'Pen 1' }, { id: 'P-2', name: 'Pen 2' }, { id: 'P-3', name: 'Pen 3' },
    { id: 'P-4', name: 'Pen 4' }, { id: 'P-5', name: 'Pen 5' }, { id: 'P-6', name: 'Pen 6' },
  ])
  breeding = $state<BreedingRecord[]>([
    { id: 'BR-001', sireId: 'GF-001', damId: 'GF-002', matingDate: '2024-12-14', eggsCount: 8, hatchedCount: 6, notes: 'Copper is linked to this pairing.' },
    { id: 'BR-002', sireId: 'GF-004', damId: 'GF-005', matingDate: '2025-09-12', eggsCount: 7, hatchedCount: 5, notes: 'Blaze is linked to this pairing.' },
  ])
  health = $state<HealthLog[]>([
    { id: 'HL-001', targetType: 'bird', targetId: 'GF-003', category: 'Vaccination', date: offsetDate(-3), notes: 'Newcastle booster administered.' },
    { id: 'HL-002', targetType: 'pen', targetId: 'P-1', category: 'Routine care', date: offsetDate(-7), notes: 'Pen cleaned and disinfected.' },
    { id: 'HL-003', targetType: 'bird', targetId: 'GF-006', category: 'Vitamin', date: offsetDate(-10), notes: 'Vitamin B complex.' },
  ])
  reminders = $state<Reminder[]>([
    { id: 'R-001', birdId: 'GF-006', description: 'Growth check and weight', dueDate: offsetDate(1), done: false },
    { id: 'R-002', birdId: 'GF-003', description: 'Newcastle booster follow-up', dueDate: offsetDate(3), done: false },
    { id: 'R-003', birdId: 'GF-001', description: 'Deworming', dueDate: offsetDate(6), done: false },
  ])
  supplies = $state<Supply[]>([
    { id: 'SI-001', name: 'Premium grower feed', category: 'Feed', quantity: 18, unit: 'kg', reorderLevel: 10 },
    { id: 'SI-002', name: 'Vitamin B complex', category: 'Vitamin', quantity: 4, unit: 'bottles', reorderLevel: 5 },
    { id: 'SI-003', name: 'Newcastle vaccine', category: 'Medicine', quantity: 2, unit: 'vials', reorderLevel: 4 },
    { id: 'SI-004', name: 'Disinfectant', category: 'Equipment', quantity: 9, unit: 'L', reorderLevel: 3 },
  ])
  matches = $state<MatchRecord[]>([
    { id: 'MT-001', eventName: 'November farm sparring', date: offsetDate(4), birdAId: 'GF-003', birdBId: 'GF-004', round: 1, outcome: 'Pending', winnerId: '' },
    { id: 'MT-002', eventName: 'Autumn derby', date: offsetDate(-14), birdAId: 'GF-001', birdBId: 'GF-004', round: 1, outcome: 'Win', winnerId: 'GF-001' },
    { id: 'MT-003', eventName: 'Autumn derby', date: offsetDate(-12), birdAId: 'GF-003', birdBId: 'GF-001', round: 2, outcome: 'Loss', winnerId: 'GF-001' },
  ])
  addBird(bird: Bird) { this.birds = [bird, ...this.birds] }
  updateBird(bird: Bird) { this.birds = this.birds.map(item => item.id === bird.id ? bird : item) }
  addPen(name: string) { const pen = { id: makeId('P'), name }; this.pens = [...this.pens, pen]; return pen }
  addBreeding(record: BreedingRecord) { this.breeding = [record, ...this.breeding] }
  addHealth(record: HealthLog) { this.health = [record, ...this.health] }
  addReminder(record: Reminder) { this.reminders = [...this.reminders, record] }
  toggleReminder(id: string) { this.reminders = this.reminders.map(item => item.id === id ? { ...item, done: !item.done } : item) }
  addSupply(item: Supply) { this.supplies = [...this.supplies, item] }
  adjustSupply(id: string, delta: number) { this.supplies = this.supplies.map(item => item.id === id ? { ...item, quantity: Math.max(0, +(item.quantity + delta).toFixed(2)) } : item) }
  addMatch(match: MatchRecord) { this.matches = [match, ...this.matches] }
  setMatchOutcome(id: string, outcome: MatchRecord['outcome'], winnerId: string) {
    this.matches = this.matches.map(item => item.id === id ? { ...item, outcome, winnerId } : item)
  }
  createBirdId() {
    const max = Math.max(0, ...this.birds.map(bird => Number(bird.id.replace('GF-', '')) || 0))
    return 'GF-' + String(max + 1).padStart(3, '0')
  }
  createEmptyBird(): Bird {
    return { id: this.createBirdId(), name: '', breed: 'Gamefowl', bloodline: '', sex: 'Male', color: '', hatchDate: today(), weight: 0, status: 'Active', penId: '', sireId: '', damId: '', breeder: '', pedigreeNotes: '' }
  }
}
export const store = new DemoStore()

