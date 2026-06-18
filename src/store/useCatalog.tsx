/* eslint-disable react-refresh/only-export-components -- store module exports the provider + useCatalog hook together */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { Item, ItemDraft } from '../types'
import { SAMPLE_ITEMS } from '../data/sampleData'
import { reconcileLocalCatalog, parseSnapshot, type LocalSnapshot } from './localCatalog'
import {
  initSupabase,
  getSupabase,
  isSupabaseConfigured,
  rowToItem,
  draftToRow,
  patchToRow,
  TABLE,
  type AppConfig,
} from '../lib/supabase'

const STORAGE_KEY = 'engdep.catalog.v1'

function now(): string {
  return new Date().toISOString()
}

function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return 'id-' + Math.random().toString(36).slice(2) + Date.now().toString(36)
}

export type LoadStatus = 'loading' | 'ready'

export interface CatalogApi {
  items: Item[]
  /** True when the viewer cannot edit (public, signed-out on the live site). */
  readOnly: boolean
  /** Is a shared database connected? (false = local demo / dev mode) */
  cloud: boolean
  /** Email of the signed-in editor, or null. */
  userEmail: string | null
  status: LoadStatus
  notice: string | null
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  reload: () => void
  getItem: (id: string) => Item | undefined
  addItem: (draft: ItemDraft) => Item
  updateItem: (id: string, patch: Partial<ItemDraft>) => void
  removeItem: (id: string) => void
  /** Apply the same patch to many items in one DB call. */
  bulkUpdate: (ids: string[], patch: Partial<ItemDraft>) => void
  /** Delete many items in one DB call. */
  bulkRemove: (ids: string[]) => void
  importItems: (drafts: ItemDraft[]) => void
  replaceAll: (items: Item[]) => void
  mergeDuplicate: (keepId: string, dropId: string) => void
  resetToSample: () => void
  clearAll: () => void
}

const CatalogContext = createContext<CatalogApi | null>(null)

export function CatalogProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Item[]>([])
  const [cloud, setCloud] = useState(false)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [status, setStatus] = useState<LoadStatus>('loading')
  const [notice, setNotice] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const cloudRef = useRef(false)
  const fileHashRef = useRef('')

  // ---- shared helpers ----
  const fetchAll = useCallback(async () => {
    const sb = getSupabase()
    if (!sb) return
    try {
      const { data, error } = await sb
        .from(TABLE)
        .select('*')
        .order('updated_at', { ascending: false })
      if (error) {
        setNotice('Could not load the catalog: ' + error.message)
        return
      }
      setItems((data ?? []).map(rowToItem))
    } catch {
      setNotice('Could not reach the catalog database. Check the connection settings.')
    }
  }, [])

  // ---- boot: load config, connect, fetch ----
  useEffect(() => {
    let cancelled = false
    let unsubAuth: (() => void) | undefined
    let unsubRealtime: (() => void) | undefined

    async function boot() {
      setStatus('loading')
      const cfg: AppConfig = await fetch('./config.json', { cache: 'no-store' })
        .then((r) => (r.ok ? r.json() : null))
        .then((j) => ({
          supabaseUrl: String(j?.supabaseUrl ?? ''),
          supabaseAnonKey: String(j?.supabaseAnonKey ?? ''),
        }))
        .catch(() => ({ supabaseUrl: '', supabaseAnonKey: '' }))
      if (cancelled) return

      initSupabase(cfg)

      if (!isSupabaseConfigured()) {
        // Local demo / dev: catalog comes from the committed public/catalog.json,
        // reconciled against any in-browser edits cached in localStorage.
        cloudRef.current = false
        setCloud(false)
        const fileText = await fetch('./catalog.json', { cache: 'no-store' })
          .then((r) => (r.ok ? r.text() : null))
          .catch(() => null)
        const cached = parseSnapshot(localStorage.getItem(STORAGE_KEY))
        const { items: localItems, fileHash } = reconcileLocalCatalog({ fileText, cached })
        if (cancelled) return
        fileHashRef.current = fileHash
        setItems(localItems)
        setNotice(null)
        setStatus('ready')
        return
      }

      cloudRef.current = true
      setCloud(true)
      const sb = getSupabase()!

      try {
        const { data: sessionData } = await sb.auth.getSession()
        if (cancelled) return
        setUserEmail(sessionData.session?.user?.email ?? null)
        await fetchAll()
      } catch {
        /* offline / misconfigured: still render the (empty) read-only shell */
      }
      if (cancelled) return
      setStatus('ready')

      // React to sign in / out.
      const { data: sub } = sb.auth.onAuthStateChange((_e, session) => {
        setUserEmail(session?.user?.email ?? null)
      })
      unsubAuth = () => sub.subscription.unsubscribe()

      // Live updates: any change in the table triggers a refetch so viewers stay current.
      const channel = sb
        .channel('items-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: TABLE }, () => {
          fetchAll()
        })
        .subscribe()
      unsubRealtime = () => {
        sb.removeChannel(channel)
      }
    }

    boot()
    return () => {
      cancelled = true
      unsubAuth?.()
      unsubRealtime?.()
    }
  }, [reloadKey, fetchAll])

  // Persist only in local mode: store items plus the hash of the file they were
  // reconciled from, so a later skill write (new hash) re-seeds instead of being
  // shadowed by this cache.
  useEffect(() => {
    if (cloud || status !== 'ready') return
    try {
      const snapshot: LocalSnapshot = { items, fileHash: fileHashRef.current }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot))
    } catch {
      /* non-fatal */
    }
  }, [items, cloud, status])

  const readOnly = cloud && !userEmail

  // ---- auth ----
  const signIn = useCallback(async (email: string, password: string) => {
    const sb = getSupabase()
    if (!sb) return { error: 'No database connected.' }
    const { error } = await sb.auth.signInWithPassword({ email, password })
    return { error: error ? error.message : null }
  }, [])

  const signOut = useCallback(async () => {
    const sb = getSupabase()
    if (sb) await sb.auth.signOut()
    setUserEmail(null)
  }, [])

  const reload = useCallback(() => setReloadKey((k) => k + 1), [])
  const getItem = useCallback((id: string) => items.find((it) => it.id === id), [items])

  // ---- mutations (optimistic local update + async DB write in cloud mode) ----
  const addItem = useCallback((draft: ItemDraft): Item => {
    const ts = now()
    const optimistic: Item = { ...draft, id: 'temp-' + newId(), createdAt: ts, updatedAt: ts }
    setItems((prev) => [optimistic, ...prev])
    if (cloudRef.current) {
      const sb = getSupabase()!
      void (async () => {
        const { data, error } = await sb.from(TABLE).insert(draftToRow(draft)).select().single()
        if (error) {
          setNotice('Could not save “' + draft.title + '”: ' + error.message)
          setItems((prev) => prev.filter((it) => it.id !== optimistic.id))
        } else if (data) {
          setItems((prev) => prev.map((it) => (it.id === optimistic.id ? rowToItem(data) : it)))
        }
      })()
    }
    return optimistic
  }, [])

  const updateItem = useCallback((id: string, patch: Partial<ItemDraft>) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch, updatedAt: now() } : it)))
    if (cloudRef.current) {
      const sb = getSupabase()!
      void (async () => {
        const { error } = await sb.from(TABLE).update(patchToRow(patch)).eq('id', id)
        if (error) setNotice('Could not save changes: ' + error.message)
      })()
    }
  }, [])

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id))
    if (cloudRef.current) {
      const sb = getSupabase()!
      void (async () => {
        const { error } = await sb.from(TABLE).delete().eq('id', id)
        if (error) setNotice('Could not delete: ' + error.message)
      })()
    }
  }, [])

  const bulkUpdate = useCallback((ids: string[], patch: Partial<ItemDraft>) => {
    if (ids.length === 0) return
    const idSet = new Set(ids)
    setItems((prev) =>
      prev.map((it) => (idSet.has(it.id) ? { ...it, ...patch, updatedAt: now() } : it)),
    )
    if (cloudRef.current) {
      const sb = getSupabase()!
      void (async () => {
        const { error } = await sb.from(TABLE).update(patchToRow(patch)).in('id', ids)
        if (error) setNotice('Could not update the selected items: ' + error.message)
      })()
    }
  }, [])

  const bulkRemove = useCallback((ids: string[]) => {
    if (ids.length === 0) return
    const idSet = new Set(ids)
    setItems((prev) => prev.filter((it) => !idSet.has(it.id)))
    if (cloudRef.current) {
      const sb = getSupabase()!
      void (async () => {
        const { error } = await sb.from(TABLE).delete().in('id', ids)
        if (error) setNotice('Could not delete the selected items: ' + error.message)
      })()
    }
  }, [])

  const importItems = useCallback((drafts: ItemDraft[]) => {
    const ts = now()
    const optimistic: Item[] = drafts.map((d) => ({ ...d, id: 'temp-' + newId(), createdAt: ts, updatedAt: ts }))
    setItems((prev) => [...optimistic, ...prev])
    if (cloudRef.current) {
      const sb = getSupabase()!
      void (async () => {
        const { error } = await sb.from(TABLE).insert(drafts.map(draftToRow))
        if (error) setNotice('Import failed: ' + error.message)
        else fetchAll()
      })()
    }
  }, [fetchAll])

  const replaceAll = useCallback((next: Item[]) => setItems(next), [])

  const mergeDuplicate = useCallback((keepId: string, dropId: string) => {
    let mergedQty = 0
    setItems((prev) => {
      const drop = prev.find((it) => it.id === dropId)
      const keep = prev.find((it) => it.id === keepId)
      if (!drop || !keep) return prev
      mergedQty = keep.quantity + drop.quantity
      return prev
        .map((it) => (it.id === keepId ? { ...it, quantity: mergedQty, updatedAt: now() } : it))
        .filter((it) => it.id !== dropId)
    })
    if (cloudRef.current && mergedQty) {
      const sb = getSupabase()!
      void (async () => {
        await sb.from(TABLE).update({ quantity: mergedQty, updated_at: now() }).eq('id', keepId)
        await sb.from(TABLE).delete().eq('id', dropId)
      })()
    }
  }, [])

  const clearAll = useCallback(() => {
    setItems([])
    if (cloudRef.current) {
      const sb = getSupabase()!
      void (async () => {
        await sb.from(TABLE).delete().neq('id', '00000000-0000-0000-0000-000000000000')
      })()
    }
  }, [])

  const resetToSample = useCallback(() => {
    setItems(SAMPLE_ITEMS)
    if (cloudRef.current) {
      const sb = getSupabase()!
      void (async () => {
        await sb.from(TABLE).delete().neq('id', '00000000-0000-0000-0000-000000000000')
        const { error } = await sb.from(TABLE).insert(SAMPLE_ITEMS.map((it) => draftToRow(it)))
        if (error) setNotice('Reset failed: ' + error.message)
        else fetchAll()
      })()
    }
  }, [fetchAll])

  const api = useMemo<CatalogApi>(
    () => ({
      items,
      readOnly,
      cloud,
      userEmail,
      status,
      notice,
      signIn,
      signOut,
      reload,
      getItem,
      addItem,
      updateItem,
      removeItem,
      bulkUpdate,
      bulkRemove,
      importItems,
      replaceAll,
      mergeDuplicate,
      resetToSample,
      clearAll,
    }),
    [items, readOnly, cloud, userEmail, status, notice, signIn, signOut, reload, getItem, addItem, updateItem, removeItem, bulkUpdate, bulkRemove, importItems, replaceAll, mergeDuplicate, resetToSample, clearAll],
  )

  return <CatalogContext.Provider value={api}>{children}</CatalogContext.Provider>
}

export function useCatalog(): CatalogApi {
  const ctx = useContext(CatalogContext)
  if (!ctx) throw new Error('useCatalog must be used within <CatalogProvider>')
  return ctx
}
