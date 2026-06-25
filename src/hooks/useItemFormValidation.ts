import type { ItemDraft } from '../types'

export interface ItemFormValidation {
  canSave: boolean
  errors: Partial<Record<keyof ItemDraft, string>>
}

/**
 * Encodes the save-gating rules for ItemForm.
 * Current rule: title is the only required field.
 * No per-field error strings are surfaced in the UI yet, so errors is always {}.
 */
export function useItemFormValidation(draft: Pick<ItemDraft, 'title'>): ItemFormValidation {
  const canSave = draft.title.trim().length > 0
  return { canSave, errors: {} }
}
