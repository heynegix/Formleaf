import { beforeEach, describe, expect, it } from 'vitest'
import { DEFAULT_FORM, createField } from '../types'
import { loadSavedForm, saveForm, STORAGE_KEY } from './storage'

describe('local persistence', () => {
  beforeEach(() => localStorage.clear())

  it('saves and restores a valid form', () => {
    const form = { ...DEFAULT_FORM, title: 'Saved form', fields: [{ ...createField('email'), label: 'Email' }] }
    expect(saveForm(form)).toBe(true)
    expect(loadSavedForm()).toEqual(form)
  })

  it('falls back safely when local data is corrupted', () => {
    localStorage.setItem(STORAGE_KEY, '{broken')
    expect(loadSavedForm()).toEqual(DEFAULT_FORM)
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, fields: [] }))
    expect(loadSavedForm()).toEqual(DEFAULT_FORM)
  })
})
