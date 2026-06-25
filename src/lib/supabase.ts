import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Item, ItemDraft, Category, MaterialType, Condition, Status } from '../types'
import { CATEGORIES, MATERIAL_TYPES, CONDITIONS, STATUSES, UNCATEGORIZED } from '../types'

// Validate enum-typed columns coming from the DB so a stray/legacy value can't
// slip through `as` casts and make an item invisible to category/status filters.
function asCategory(v: string): Category {
  return (CATEGORIES as readonly string[]).includes(v) ? (v as Category) : UNCATEGORIZED
}
function asType(v: string): MaterialType {
  return (MATERIAL_TYPES as readonly string[]).includes(v) ? (v as MaterialType) : 'Other'
}
function asStatus(v: string): Status {
  return (STATUSES as readonly string[]).includes(v) ? (v as Status) : 'Needs review'
}
function asCondition(v: string | null): Condition | undefined {
  return v && (CONDITIONS as readonly string[]).includes(v) ? (v as Condition) : undefined
}

export interface AppConfig {
  supabaseUrl: string
  supabaseAnonKey: string
}

/** Database row shape for the `items` table (snake_case columns). */
interface ItemRow {
  id: string
  title: string
  quantity: number
  category: string
  material_type: string
  section: string
  shelf: string
  author: string | null
  isbn: string | null
  notes: string | null
  condition: string | null
  status: string
  shelf_dismissed?: boolean | null
  dup_dismissed?: boolean | null
  created_at: string
  updated_at: string
}

export const TABLE = 'items'

let client: SupabaseClient | null = null
let configured = false

/** Initialise the Supabase client from runtime config. Safe to call once. */
export function initSupabase(cfg: AppConfig): SupabaseClient | null {
  configured = Boolean(cfg.supabaseUrl && cfg.supabaseAnonKey)
  if (!configured) return null
  client = createClient(cfg.supabaseUrl, cfg.supabaseAnonKey, {
    auth: { persistSession: true, autoRefreshToken: true },
  })
  return client
}

export function getSupabase(): SupabaseClient | null {
  return client
}

export function isSupabaseConfigured(): boolean {
  return configured
}

// ---- mappers between the DB row and the app's Item ----

export function rowToItem(r: ItemRow): Item {
  return {
    id: r.id,
    title: r.title,
    quantity: r.quantity,
    category: asCategory(r.category),
    materialType: asType(r.material_type),
    location: { section: r.section ?? '', shelf: r.shelf ?? '' },
    author: r.author ?? undefined,
    isbn: r.isbn ?? undefined,
    notes: r.notes ?? undefined,
    condition: asCondition(r.condition),
    status: asStatus(r.status),
    shelfDismissed: r.shelf_dismissed === true,
    dupDismissed: r.dup_dismissed === true,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}

/** Maps a partial draft (an edit patch) to the matching DB columns. */
export function patchToRow(p: Partial<ItemDraft>): Record<string, unknown> {
  const row: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (p.title !== undefined) row.title = p.title
  if (p.quantity !== undefined) row.quantity = p.quantity
  if (p.category !== undefined) row.category = p.category
  if (p.materialType !== undefined) row.material_type = p.materialType
  if (p.location !== undefined) {
    row.section = p.location.section
    row.shelf = p.location.shelf
  }
  if (p.author !== undefined) row.author = p.author ?? null
  if (p.isbn !== undefined) row.isbn = p.isbn ?? null
  if (p.notes !== undefined) row.notes = p.notes ?? null
  if (p.condition !== undefined) row.condition = p.condition ?? null
  if (p.status !== undefined) row.status = p.status
  if (p.shelfDismissed !== undefined) row.shelf_dismissed = p.shelfDismissed
  if (p.dupDismissed !== undefined) row.dup_dismissed = p.dupDismissed
  return row
}

/** Columns for an insert/update (id and timestamps are managed by the DB). */
export function draftToRow(d: ItemDraft): Record<string, unknown> {
  return {
    title: d.title,
    quantity: d.quantity,
    category: d.category,
    material_type: d.materialType,
    section: d.location.section,
    shelf: d.location.shelf,
    author: d.author ?? null,
    isbn: d.isbn ?? null,
    notes: d.notes ?? null,
    condition: d.condition ?? null,
    status: d.status,
    updated_at: new Date().toISOString(),
  }
}
