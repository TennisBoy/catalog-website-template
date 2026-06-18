// Core domain model. One entity, Item, drives the whole app.

export const CATEGORIES = [
  'Grade 9',
  'Grade 10',
  'Grade 11',
  'Grade 12',
  'ESL',
  'French',
  'Theory of Knowledge',
  'Board Games',
  'Films',
  'Book Club',
  'Other / Uncategorized',
] as const

export type Category = (typeof CATEGORIES)[number]

export const UNCATEGORIZED: Category = 'Other / Uncategorized'

export const MATERIAL_TYPES = [
  'Book',
  'Dictionary',
  'ESL Material',
  'Board Game',
  'Film',
  'Other',
] as const

export type MaterialType = (typeof MATERIAL_TYPES)[number]

export const CONDITIONS = ['New', 'Good', 'Worn', 'Damaged'] as const
export type Condition = (typeof CONDITIONS)[number]

export const STATUSES = [
  'Cataloged',
  'Needs review',
  'Misplaced',
  'Duplicate possible',
] as const
export type Status = (typeof STATUSES)[number]

export interface ItemLocation {
  section: string
  shelf: string
}

export interface Item {
  id: string
  title: string
  quantity: number
  category: Category
  materialType: MaterialType
  location: ItemLocation
  author?: string
  isbn?: string
  notes?: string
  condition?: Condition
  status: Status
  createdAt: string
  updatedAt: string
}

// Shape used by the Add/Edit form before an id/timestamps are assigned.
export type ItemDraft = Omit<Item, 'id' | 'createdAt' | 'updatedAt'>
