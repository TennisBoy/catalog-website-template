import { createContext, useContext } from 'react'

/** Opens the global "Add item" overlay. No-op by default (e.g. read-only). */
export const AddPanelContext = createContext<() => void>(() => {})

/** Open the Add-item overlay from any screen, without navigating away. */
export function useAddPanel(): () => void {
  return useContext(AddPanelContext)
}
