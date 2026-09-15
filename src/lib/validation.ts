import { CURRENT_FORM_VERSION, FIELD_TYPES, type FieldType, type FormDefinition, type FormField, type FieldOption } from '../types'
import { migrateFormDefinition } from './migrations'

const MAX_JSON_LENGTH = 200_000
const MAX_FIELDS = 100
const MAX_OPTIONS = 50
const MAX_TEXT_LENGTH = 500

export type ValidationResult =
  | { success: true; data: FormDefinition }
  | { success: false; error: string }

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function validText(value: unknown, required = false): value is string {
  return typeof value === 'string' && value.length <= MAX_TEXT_LENGTH && (!required || value.trim().length > 0)
}

function validateOption(value: unknown): value is FieldOption {
  return isRecord(value)
    && typeof value.id === 'string'
    && value.id.length > 0
    && value.id.length <= 100
    && validText(value.label, true)
}

function validateField(value: unknown): value is FormField {
  if (!isRecord(value)) return false
  if (typeof value.id !== 'string' || value.id.length === 0 || value.id.length > 100) return false
  if (!FIELD_TYPES.includes(value.type as FieldType)) return false
  if (!validText(value.label, true) || !validText(value.placeholder) || typeof value.required !== 'boolean' || !validText(value.helpText)) return false

  if (value.defaultValue !== undefined && typeof value.defaultValue !== 'string' && typeof value.defaultValue !== 'boolean') return false
  if (typeof value.defaultValue === 'string' && value.defaultValue.length > MAX_TEXT_LENGTH) return false
  if (value.min !== undefined && (typeof value.min !== 'number' || !Number.isFinite(value.min))) return false
  if (value.max !== undefined && (typeof value.max !== 'number' || !Number.isFinite(value.max))) return false
  if (typeof value.min === 'number' && typeof value.max === 'number' && value.min > value.max) return false

  if (value.type === 'select' || value.type === 'radio') {
    if (!Array.isArray(value.options) || value.options.length === 0 || value.options.length > MAX_OPTIONS || !value.options.every(validateOption)) return false
    const ids = value.options.map((option) => option.id)
    if (new Set(ids).size !== ids.length) return false
  } else if (value.options !== undefined) {
    return false
  }

  return true
}

export function validateFormDefinition(value: unknown): ValidationResult {
  const migration = migrateFormDefinition(value)
  if (!migration.success) return migration
  const migrated = migration.data

  if (!isRecord(migrated) || migrated.version !== CURRENT_FORM_VERSION || !validText(migrated.title, true) || !validText(migrated.description) || !validText(migrated.submitLabel, true)) {
    return { success: false, error: 'Invalid Formleaf JSON.' }
  }
  if (!Array.isArray(migrated.fields) || migrated.fields.length > MAX_FIELDS || !migrated.fields.every(validateField)) {
    return { success: false, error: 'Invalid Formleaf JSON: check the fields and their settings.' }
  }
  const ids = migrated.fields.map((field) => field.id)
  if (new Set(ids).size !== ids.length) return { success: false, error: 'Invalid Formleaf JSON: field IDs must be unique.' }

  return { success: true, data: migrated as FormDefinition }
}

export function parseFormJson(json: string): ValidationResult {
  if (json.length > MAX_JSON_LENGTH) return { success: false, error: 'Invalid Formleaf JSON: the file is too large.' }
  try {
    return validateFormDefinition(JSON.parse(json) as unknown)
  } catch {
    return { success: false, error: 'Invalid Formleaf JSON: the JSON could not be parsed.' }
  }
}
