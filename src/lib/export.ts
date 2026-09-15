import type { FormDefinition, FormField } from '../types'

export function escapeHtml(value: string | number | boolean | undefined): string {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function fieldAttributes(field: FormField): string {
  const attributes = [`id="${escapeHtml(field.id)}"`, `name="${escapeHtml(field.id)}"`]
  if (field.required) attributes.push('required')
  if (field.placeholder && field.type !== 'checkbox') attributes.push(`placeholder="${escapeHtml(field.placeholder)}"`)
  if (field.type === 'number') {
    if (field.min !== undefined) attributes.push(`min="${escapeHtml(field.min)}"`)
    if (field.max !== undefined) attributes.push(`max="${escapeHtml(field.max)}"`)
  }
  return attributes.join(' ')
}

function renderField(field: FormField): string {
  const label = escapeHtml(field.label)
  const help = field.helpText ? `\n      <small id="${escapeHtml(field.id)}-help">${escapeHtml(field.helpText)}</small>` : ''
  const describedBy = field.helpText ? ` aria-describedby="${escapeHtml(field.id)}-help"` : ''
  const attributes = fieldAttributes(field) + describedBy
  const defaultValue = typeof field.defaultValue === 'string' ? field.defaultValue : ''

  if (field.type === 'textarea') {
    return `<div class="field">\n      <label for="${escapeHtml(field.id)}">${label}</label>\n      <textarea ${attributes}>${escapeHtml(defaultValue)}</textarea>${help}\n    </div>`
  }
  if (field.type === 'select') {
    const options = (field.options ?? []).map((option) => `        <option value="${escapeHtml(option.id)}"${field.defaultValue === option.id ? ' selected' : ''}>${escapeHtml(option.label)}</option>`).join('\n')
    return `<div class="field">\n      <label for="${escapeHtml(field.id)}">${label}</label>\n      <select ${attributes}>\n${options}\n      </select>${help}\n    </div>`
  }
  if (field.type === 'radio') {
    const options = (field.options ?? []).map((option) => `      <label class="choice"><input type="radio" name="${escapeHtml(field.id)}" value="${escapeHtml(option.id)}"${field.required ? ' required' : ''}> ${escapeHtml(option.label)}</label>`).join('\n')
    return `<fieldset class="field"${describedBy}>\n      <legend>${label}</legend>\n${options}${help}\n    </fieldset>`
  }
  if (field.type === 'checkbox') {
    const checked = field.defaultValue === true ? ' checked' : ''
    return `<div class="field checkbox-field">\n      <label><input type="checkbox" ${attributes}${checked}> ${label}</label>${help}\n    </div>`
  }
  const value = defaultValue ? ` value="${escapeHtml(defaultValue)}"` : ''
  return `<div class="field">\n      <label for="${escapeHtml(field.id)}">${label}</label>\n      <input type="${escapeHtml(field.type)}" ${attributes}${value}>${help}\n    </div>`
}

export function generateHtml(form: FormDefinition): string {
  const fields = form.fields.map(renderField).join('\n')
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(form.title)}</title>
    <style>
      :root { color-scheme: light; font-family: Inter, system-ui, sans-serif; color: #172019; background: #f4f7f4; }
      body { margin: 0; padding: 32px 16px; }
      main { max-width: 640px; margin: 0 auto; padding: 32px; background: #fff; border: 1px solid #dce5dd; border-radius: 16px; }
      h1 { margin: 0 0 8px; font-size: 1.8rem; } p { color: #5f6c62; }
      .field { display: grid; gap: 8px; margin: 22px 0; } label, legend { font-weight: 650; }
      input, textarea, select { width: 100%; box-sizing: border-box; padding: 11px 12px; border: 1px solid #bdcabe; border-radius: 9px; font: inherit; }
      textarea { min-height: 120px; resize: vertical; } small { color: #68766b; }
      fieldset { border: 0; padding: 0; } .choice, .checkbox-field label { display: flex; gap: 8px; align-items: center; font-weight: 400; }
      .choice input, .checkbox-field input { width: auto; } button { border: 0; border-radius: 9px; padding: 12px 18px; background: #2f8148; color: #fff; font: inherit; font-weight: 700; cursor: pointer; }
    </style>
  </head>
  <body>
    <main>
      <h1>${escapeHtml(form.title)}</h1>
      ${form.description ? `<p>${escapeHtml(form.description)}</p>` : ''}
      <form>
${fields}
        <button type="submit">${escapeHtml(form.submitLabel)}</button>
      </form>
    </main>
  </body>
</html>
`
}

export function generateJson(form: FormDefinition): string {
  return JSON.stringify(form, null, 2)
}
