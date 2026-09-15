import { describe, expect, it } from 'vitest'
import { createField, DEFAULT_FORM, type FormDefinition } from '../types'
import { generateHtml, generateJson } from './export'
import { parseFormJson, validateFormDefinition } from './validation'

const testForm: FormDefinition = {
  ...DEFAULT_FORM,
  title: 'Contact <Form>',
  description: 'A "safe" form',
  submitLabel: 'Send & go',
  fields: [
    { ...createField('text'), id: 'name', label: '<script>alert(1)</script>', placeholder: 'A & B', helpText: 'Use "your" name', required: true },
    { ...createField('number'), id: 'age', label: 'Age', min: 1, max: 120 },
    { ...createField('select'), id: 'topic', label: 'Topic', options: [{ id: 'support', label: 'Support' }, { id: 'feedback', label: 'Feedback' }], defaultValue: 'feedback' },
  ],
}

describe('Formleaf data validation', () => {
  it('accepts a valid exported form', () => {
    expect(validateFormDefinition(testForm)).toEqual({ success: true, data: testForm })
  })

  it('rejects duplicate field IDs and malformed fields', () => {
    const duplicate = { ...testForm, fields: [{ ...testForm.fields[0] }, { ...testForm.fields[1], id: 'name' }] }
    expect(validateFormDefinition(duplicate).success).toBe(false)
    expect(validateFormDefinition({ ...testForm, fields: 'nope' }).success).toBe(false)
    expect(parseFormJson('{ definitely not json').success).toBe(false)
  })

  it('rejects oversized JSON', () => {
    expect(parseFormJson('x'.repeat(200_001)).success).toBe(false)
  })
})

describe('Formleaf exports', () => {
  it('exports versioned JSON that can be imported again', () => {
    const json = generateJson(testForm)
    expect(JSON.parse(json)).toMatchObject({ version: 1, title: 'Contact <Form>' })
    expect(parseFormJson(json).success).toBe(true)
  })

  it('escapes user content in standalone HTML', () => {
    const html = generateHtml(testForm)
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;')
    expect(html).toContain('A &amp; B')
    expect(html).not.toContain('<script>alert(1)</script>')
    expect(html).toContain('min="1"')
    expect(html).toContain('max="120"')
    expect(html).toContain('<option value="feedback" selected>Feedback</option>')
  })
})
