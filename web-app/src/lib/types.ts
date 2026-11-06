export type Page = 'dashboard' | 'roster' | 'profile' | 'breeding' | 'health' | 'supplies' | 'matches' | 'reports' | 'more'
export type ModalKind = 'bird' | 'health' | 'breeding' | 'supply' | 'match' | 'reminder' | 'pen'

export interface Bird {
  id: string
  name: string
  breed: string
  bloodline: string
  sex: 'Male' | 'Female'
  color: string
  hatchDate: string
  weight: number
  status: 'Active' | 'Sold' | 'Deceased' | 'Brood'
  penId: string
  sireId: string
  damId: string
  breeder: string
  pedigreeNotes: string
  photo?: string
}
export interface Pen { id: string; name: string }
export interface BreedingRecord {
  id: string; sireId: string; damId: string; matingDate: string
  eggsCount: number; hatchedCount: number; notes: string
}
export interface HealthLog {
  id: string; targetType: 'bird' | 'pen'; targetId: string
  category: 'Vaccination' | 'Vitamin' | 'Medication' | 'Routine care'
  date: string; notes: string
}
export interface Reminder {
  id: string; birdId: string; description: string; dueDate: string; done: boolean
}
export interface Supply {
  id: string; name: string; category: 'Feed' | 'Vitamin' | 'Medicine' | 'Equipment'
  quantity: number; unit: string; reorderLevel: number
}
export interface MatchRecord {
  id: string; eventName: string; date: string; birdAId: string; birdBId: string
  round: number; outcome: 'Pending' | 'Win' | 'Loss' | 'Draw'; winnerId: string
}
