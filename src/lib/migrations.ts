import { CURRENT_FORM_VERSION } from '../types'

type UnknownRecord = Record<string, unknown>

export type MigrationResult =
  | { success: true; data: unknown; migratedFrom: number | null }
  | { success: false; error: string }

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function migrateLegacyFields(value: UnknownRecord): unknown {
  if (!Array.isArray(value.fields)) return value.fields

  return value.fields.map((field, fieldIndex) => {
    if (!isRecord(field)) return field

    const migrated = { ...field }
    if (migrated.helpText === undefined && migrated.help !== undefined) migrated.helpText = migrated.help
    if (migrated.defaultValue === undefined && migrated.default !== undefined) migrated.defaultValue = migrated.default
    delete migrated.help
    delete migrated.default
    if (Array.isArray(migrated.options)) {
      migrated.options = migrated.options.map((option, optionIndex) => typeof option === 'string'
        ? { id: `legacy-option-${fieldIndex + 1}-${optionIndex + 1}`, label: option }
        : option)
    }
    return migrated
  })
}

function migrateVersionZero(value: UnknownRecord): UnknownRecord {
  const submitLabel = value.submitLabel ?? value.submitButtonText
  const migrated = { ...value }
  delete migrated.submitButtonText
  return {
    ...migrated,
    version: CURRENT_FORM_VERSION,
    submitLabel: submitLabel ?? 'Submit',
    fields: migrateLegacyFields(value),
  }
}

/**
 * Normalize known older JSON shapes before the strict current-schema validator runs.
 * Keep migrations one-way and explicit so unsupported future versions fail safely.
 */
export function migrateFormDefinition(value: unknown): MigrationResult {
  if (!isRecord(value)) return { success: false, error: 'Invalid Formleaf JSON.' }

  if (value.version === CURRENT_FORM_VERSION) {
    return { success: true, data: value, migratedFrom: null }
  }

  if (value.version === undefined || value.version === 0) {
    return { success: true, data: migrateVersionZero(value), migratedFrom: value.version === 0 ? 0 : 0 }
  }

  return { success: false, error: `Unsupported Formleaf JSON version: ${String(value.version)}.` }
}
