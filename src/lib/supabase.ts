import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Item, ItemDraft, Category, MaterialType, Condition, Status } from '../types'

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
    category: r.category as Category,
    materialType: r.material_type as MaterialType,
    location: { section: r.section ?? '', shelf: r.shelf ?? '' },
    author: r.author ?? undefined,
    isbn: r.isbn ?? undefined,
    notes: r.notes ?? undefined,
    condition: (r.condition as Condition) ?? undefined,
    status: r.status as Status,
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
