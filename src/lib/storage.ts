import { DEFAULT_FORM, type FormDefinition } from '../types'
import { validateFormDefinition } from './validation'

export const STORAGE_KEY = 'formleaf:form:v1'

export function loadSavedForm(storage: Storage | undefined = typeof localStorage !== 'undefined' ? localStorage : undefined): FormDefinition {
  if (!storage) return DEFAULT_FORM
  try {
    const raw = storage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_FORM
    const result = validateFormDefinition(JSON.parse(raw) as unknown)
    return result.success ? result.data : DEFAULT_FORM
  } catch {
    return DEFAULT_FORM
  }
}

export function saveForm(form: FormDefinition, storage: Storage | undefined = typeof localStorage !== 'undefined' ? localStorage : undefined): boolean {
  if (!storage) return false
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(form))
    return true
  } catch {
    return false
  }
}
