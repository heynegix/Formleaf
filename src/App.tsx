import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import {
  DEFAULT_FORM,
  FIELD_LABELS,
  FIELD_TYPES,
  createExampleForm,
  createField,
  createId,
  createOption,
  type FieldType,
  type FormDefinition,
  type FormField,
} from './types'
import { generateHtml, generateJson } from './lib/export'
import { loadSavedForm, saveForm } from './lib/storage'
import { parseFormJson } from './lib/validation'

type DialogKind = 'export' | 'import' | null
type ExportFormat = 'html' | 'json'

function updateField(form: FormDefinition, fieldId: string, update: Partial<FormField>): FormDefinition {
  return { ...form, fields: form.fields.map((field) => field.id === fieldId ? { ...field, ...update } : field) }
}

function fieldById(form: FormDefinition, fieldId: string | null): FormField | undefined {
  return fieldId ? form.fields.find((field) => field.id === fieldId) : undefined
}

function optionIdForValue(field: FormField, value: string | boolean | undefined): string {
  if (typeof value !== 'string') return ''
  return field.options?.find((option) => option.id === value || option.label === value)?.id ?? ''
}

async function copyText(value: string): Promise<boolean> {
  try {
    if (!navigator.clipboard) return false
    await navigator.clipboard.writeText(value)
    return true
  } catch {
    return false
  }
}

function App() {
  const [form, setForm] = useState<FormDefinition>(() => loadSavedForm())
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(() => loadSavedForm().fields[0]?.id ?? null)
  const [previewValues, setPreviewValues] = useState<Record<string, string | boolean>>({})
  const [previewMessage, setPreviewMessage] = useState('')
  const [savedStatus, setSavedStatus] = useState('Saved locally')
  const [dialog, setDialog] = useState<DialogKind>(null)
  const [exportFormat, setExportFormat] = useState<ExportFormat>('html')
  const [importText, setImportText] = useState('')
  const [importError, setImportError] = useState('')
  const [copied, setCopied] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const selectedField = fieldById(form, selectedFieldId)
  const exportValue = exportFormat === 'html' ? generateHtml(form) : generateJson(form)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSavedStatus(saveForm(form) ? 'Saved locally' : 'Local save unavailable')
    }, 180)
    return () => window.clearTimeout(timer)
  }, [form])

  useEffect(() => {
    if (selectedFieldId && !selectedField) setSelectedFieldId(form.fields[0]?.id ?? null)
  }, [form.fields, selectedField, selectedFieldId])

  function updateForm(update: Partial<FormDefinition>) {
    setForm((current) => ({ ...current, ...update }))
  }

  function addField(type: FieldType) {
    const nextField = createField(type)
    setForm((current) => ({ ...current, fields: [...current.fields, nextField] }))
    setSelectedFieldId(nextField.id)
    setPreviewMessage('')
  }

  function duplicateField(fieldId: string) {
    const index = form.fields.findIndex((field) => field.id === fieldId)
    if (index < 0) return
    const source = form.fields[index]
    const copy: FormField = { ...source, id: createId(), options: source.options?.map((option) => ({ ...option, id: createId('option') })) }
    const fields = [...form.fields]
    fields.splice(index + 1, 0, copy)
    setForm((current) => ({ ...current, fields }))
    setSelectedFieldId(copy.id)
  }

  function deleteField(fieldId: string) {
    const field = fieldById(form, fieldId)
    if (!field || !window.confirm(`Delete “${field.label}”?`)) return
    setForm((current) => ({ ...current, fields: current.fields.filter((item) => item.id !== fieldId) }))
    setSelectedFieldId((current) => current === fieldId ? null : current)
  }

  function moveField(fieldId: string, direction: -1 | 1) {
    const index = form.fields.findIndex((field) => field.id === fieldId)
    const nextIndex = index + direction
    if (index < 0 || nextIndex < 0 || nextIndex >= form.fields.length) return
    const fields = [...form.fields]
    ;[fields[index], fields[nextIndex]] = [fields[nextIndex], fields[index]]
    setForm((current) => ({ ...current, fields }))
  }

  function resetForm() {
    if ((form.fields.length > 0 || form.title !== DEFAULT_FORM.title) && !window.confirm('Start a new form? Your current form will be replaced.')) return
    setForm({ ...DEFAULT_FORM, fields: [] })
    setSelectedFieldId(null)
    setPreviewValues({})
    setPreviewMessage('')
  }

  function loadExample() {
    const example = createExampleForm()
    setForm(example)
    setSelectedFieldId(example.fields[0]?.id ?? null)
    setPreviewValues({})
    setPreviewMessage('')
  }

  function openExport(format: ExportFormat) {
    setExportFormat(format)
    setCopied(false)
    setDialog('export')
  }

  function importForm() {
    const result = parseFormJson(importText)
    if (!result.success) {
      setImportError(result.error)
      return
    }
    if ((form.fields.length > 0 || form.title !== DEFAULT_FORM.title) && !window.confirm('Replace the current form with this import?')) return
    setForm(result.data)
    setSelectedFieldId(result.data.fields[0]?.id ?? null)
    setPreviewValues({})
    setPreviewMessage('')
    setImportError('')
    setImportText('')
    setDialog(null)
  }

  function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    if (file.size > 200_000) {
      setImportError('Invalid Formleaf JSON: the file is too large.')
      return
    }
    const reader = new FileReader()
    reader.onload = () => setImportText(typeof reader.result === 'string' ? reader.result : '')
    reader.onerror = () => setImportError('Could not read that file.')
    reader.readAsText(file)
    event.target.value = ''
  }

  function download(filename: string, content: string, type: string) {
    const blob = new Blob([content], { type })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = filename
    anchor.click()
    URL.revokeObjectURL(url)
  }

  function submitPreview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPreviewMessage('Preview only — no data was submitted.')
  }

  function updatePreview(field: FormField, value: string | boolean) {
    setPreviewValues((current) => ({ ...current, [field.id]: value }))
    setPreviewMessage('')
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="./" aria-label="Formleaf home">
          <span className="brand-mark" aria-hidden="true">F</span>
          <span>Formleaf</span>
        </a>
        <div className="header-actions">
          <span className="save-status" aria-live="polite"><span className="status-dot" aria-hidden="true" />{savedStatus}</span>
          <button className="button button-quiet" type="button" onClick={resetForm}>New form</button>
          <a className="button button-quiet" href="https://github.com/heynegix/Formleaf" target="_blank" rel="noreferrer">GitHub <span aria-hidden="true">↗</span></a>
        </div>
      </header>

      <main className="workspace">
        <section className="builder-column" aria-labelledby="builder-heading">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Create locally</p>
              <h1 id="builder-heading">Builder</h1>
            </div>
            <button className="button button-secondary" type="button" onClick={loadExample}>Load example</button>
          </div>

          <div className="card settings-card">
            <div className="card-heading"><div><h2>Form settings</h2><p>Set the basics for your exported form.</p></div><span className="step-label">01</span></div>
            <div className="form-grid">
              <label className="field-control field-control-wide">Title
                <input value={form.title} maxLength={200} onChange={(event) => updateForm({ title: event.target.value })} placeholder="Untitled Form" />
              </label>
              <label className="field-control field-control-wide">Description
                <textarea value={form.description} maxLength={500} onChange={(event) => updateForm({ description: event.target.value })} placeholder="What is this form for?" rows={3} />
              </label>
              <label className="field-control">Submit button
                <input value={form.submitLabel} maxLength={100} onChange={(event) => updateForm({ submitLabel: event.target.value })} placeholder="Submit" />
              </label>
            </div>
          </div>

          <div className="card fields-card">
            <div className="card-heading"><div><h2>Fields <span className="count-badge">{form.fields.length}</span></h2><p>Add and arrange the inputs your form needs.</p></div><span className="step-label">02</span></div>
            <div className="add-field-row">
              <label className="sr-only" htmlFor="field-type">Field type</label>
              <select id="field-type" defaultValue="text">
                {FIELD_TYPES.map((type) => <option key={type} value={type}>{FIELD_LABELS[type]}</option>)}
              </select>
              <button className="button button-primary" type="button" onClick={() => {
                const select = document.getElementById('field-type') as HTMLSelectElement | null
                addField((select?.value ?? 'text') as FieldType)
              }}>+ Add field</button>
            </div>
            {form.fields.length === 0 ? (
              <div className="empty-state"><div className="empty-icon" aria-hidden="true">＋</div><h3>No fields yet.</h3><p>Add your first field to start building.</p><button className="button button-secondary" type="button" onClick={() => addField('text')}>Add a text field</button></div>
            ) : (
              <div className="field-list" aria-label="Form fields">
                {form.fields.map((field, index) => <FieldCard key={field.id} field={field} index={index} total={form.fields.length} selected={field.id === selectedFieldId} onSelect={() => setSelectedFieldId(field.id)} onDuplicate={() => duplicateField(field.id)} onDelete={() => deleteField(field.id)} onMove={(direction) => moveField(field.id, direction)} />)}
              </div>
            )}
          </div>

          {selectedField && <FieldEditor field={selectedField} onChange={(update) => setForm((current) => updateField(current, selectedField.id, update))} onClose={() => setSelectedFieldId(null)} />}

          <div className="card export-card">
            <div className="card-heading"><div><h2>Export</h2><p>Take your clean, portable form anywhere.</p></div><span className="step-label">03</span></div>
            <div className="export-actions"><button className="button button-primary" type="button" onClick={() => openExport('html')}>Export HTML</button><button className="button button-secondary" type="button" onClick={() => openExport('json')}>Export JSON</button><button className="text-button" type="button" onClick={() => { setImportError(''); setDialog('import') }}>Import JSON</button></div>
          </div>
        </section>

        <section className="preview-column" aria-labelledby="preview-heading">
          <div className="preview-sticky">
            <div className="section-heading preview-heading"><div><p className="eyebrow">See it as you build</p><h1 id="preview-heading">Preview</h1></div><span className="preview-label"><span className="live-dot" aria-hidden="true" />Live</span></div>
            <div className="preview-frame">
              <div className="preview-browser-bar"><span /><span /><span /><small>formleaf.preview</small></div>
              <div className="preview-content">
                <div className="preview-intro"><h2>{form.title || 'Untitled Form'}</h2>{form.description && <p>{form.description}</p>}</div>
                {form.fields.length === 0 ? <div className="preview-empty"><span aria-hidden="true">✦</span><p>Your form preview will appear here.</p></div> : <form onSubmit={submitPreview} noValidate>
                  {form.fields.map((field) => <PreviewField key={field.id} field={field} value={previewValues[field.id] ?? field.defaultValue ?? (field.type === 'checkbox' ? false : '')} onChange={(value) => updatePreview(field, value)} />)}
                  <button className="button button-primary preview-submit" type="submit">{form.submitLabel || 'Submit'}</button>
                  {previewMessage && <p className="preview-message" role="status">{previewMessage}</p>}
                </form>}
              </div>
            </div>
            <div className="privacy-note"><span aria-hidden="true">⌁</span><div><strong>Your forms stay in your browser.</strong><span>Formleaf has no account, backend, or tracking.</span></div></div>
          </div>
        </section>
      </main>

      <footer className="footer"><span>Formleaf</span><span>Build. Export. Done.</span><a href="https://github.com/heynegix/Formleaf" target="_blank" rel="noreferrer">Open source on GitHub ↗</a></footer>

      {dialog === 'export' && <ExportDialog format={exportFormat} content={exportValue} copied={copied} onCopy={async () => setCopied(await copyText(exportValue))} onDownload={() => download(exportFormat === 'html' ? 'form.html' : 'formleaf-form.json', exportValue, exportFormat === 'html' ? 'text/html' : 'application/json')} onClose={() => setDialog(null)} onFormatChange={setExportFormat} />}
      {dialog === 'import' && <ImportDialog value={importText} error={importError} fileInputRef={fileInputRef} onChange={setImportText} onFile={handleFile} onImport={importForm} onClose={() => setDialog(null)} />}
    </div>
  )
}

type FieldCardProps = { field: FormField; index: number; total: number; selected: boolean; onSelect: () => void; onDuplicate: () => void; onDelete: () => void; onMove: (direction: -1 | 1) => void }

function FieldCard({ field, index, total, selected, onSelect, onDuplicate, onDelete, onMove }: FieldCardProps) {
  return <article className={`field-card ${selected ? 'is-selected' : ''}`}>
    <button className="field-card-main" type="button" onClick={onSelect} aria-label={`Edit ${field.label}`} aria-expanded={selected}>
      <span className="drag-handle" aria-hidden="true">⋮⋮</span><span className="field-card-copy"><strong>{field.label || 'Untitled field'}</strong><span>{FIELD_LABELS[field.type]}{field.required ? ' · Required' : ''}</span></span><span className="chevron" aria-hidden="true">{selected ? '⌃' : '›'}</span>
    </button>
    <div className="field-card-actions" aria-label={`${field.label} actions`}>
      <button type="button" onClick={onSelect}>Edit</button><button type="button" onClick={onDuplicate}>Duplicate</button><button type="button" onClick={onMove.bind(null, -1)} disabled={index === 0} aria-label="Move field up">↑</button><button type="button" onClick={onMove.bind(null, 1)} disabled={index === total - 1} aria-label="Move field down">↓</button><button className="danger-button" type="button" onClick={onDelete}>Delete</button>
    </div>
  </article>
}

type FieldEditorProps = { field: FormField; onChange: (update: Partial<FormField>) => void; onClose: () => void }

function FieldEditor({ field, onChange, onClose }: FieldEditorProps) {
  function updateOption(optionId: string, label: string) {
    onChange({ options: field.options?.map((option) => option.id === optionId ? { ...option, label } : option) })
  }
  function removeOption(optionId: string) {
    onChange({ options: field.options?.filter((option) => option.id !== optionId) })
  }
  function moveOption(optionId: string, direction: -1 | 1) {
    const options = field.options ?? []
    const index = options.findIndex((option) => option.id === optionId)
    const nextIndex = index + direction
    if (index < 0 || nextIndex < 0 || nextIndex >= options.length) return
    const reordered = [...options]
    ;[reordered[index], reordered[nextIndex]] = [reordered[nextIndex], reordered[index]]
    onChange({ options: reordered })
  }
  return <div className="card editor-card" aria-labelledby="editor-heading">
    <div className="card-heading"><div><p className="eyebrow">Selected field</p><h2 id="editor-heading">{FIELD_LABELS[field.type]} settings</h2></div><button className="icon-button" type="button" onClick={onClose} aria-label="Close field settings">×</button></div>
    <div className="editor-grid">
      <label className="field-control field-control-wide">Label<input value={field.label} maxLength={100} onChange={(event) => onChange({ label: event.target.value })} /></label>
      {field.type !== 'checkbox' && <label className="field-control field-control-wide">Placeholder<input value={field.placeholder} maxLength={200} onChange={(event) => onChange({ placeholder: event.target.value })} placeholder="Optional hint" /></label>}
      <label className="field-control field-control-wide">Help text<input value={field.helpText} maxLength={500} onChange={(event) => onChange({ helpText: event.target.value })} placeholder="Optional supporting text" /></label>
      {field.type !== 'checkbox' && <label className="field-control">Default value{(field.type === 'select' || field.type === 'radio') ? <select value={optionIdForValue(field, field.defaultValue)} onChange={(event) => onChange({ defaultValue: event.target.value || undefined })}><option value="">None</option>{(field.options ?? []).map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}</select> : <input value={typeof field.defaultValue === 'string' ? field.defaultValue : ''} maxLength={500} onChange={(event) => onChange({ defaultValue: event.target.value })} placeholder="Optional" />}</label>}
      {field.type === 'checkbox' && <label className="toggle-control"><input type="checkbox" checked={field.defaultValue === true} onChange={(event) => onChange({ defaultValue: event.target.checked })} /><span><strong>Checked by default</strong><small>Use sparingly for consent or opt-in fields.</small></span></label>}
      <label className="toggle-control"><input type="checkbox" checked={field.required} onChange={(event) => onChange({ required: event.target.checked })} /><span><strong>Required field</strong><small>Users must complete this before submitting.</small></span></label>
      {field.type === 'number' && <><label className="field-control">Min<input type="number" value={field.min ?? ''} onChange={(event) => onChange({ min: event.target.value === '' ? undefined : Number(event.target.value) })} /></label><label className="field-control">Max<input type="number" value={field.max ?? ''} onChange={(event) => onChange({ max: event.target.value === '' ? undefined : Number(event.target.value) })} /></label></>}
    </div>
    {(field.type === 'select' || field.type === 'radio') && <div className="options-editor"><div className="options-heading"><div><h3>Options</h3><p>Give people clear choices.</p></div><button className="text-button" type="button" onClick={() => onChange({ options: [...(field.options ?? []), createOption(`Option ${(field.options?.length ?? 0) + 1}`)] })}>+ Add option</button></div>{(field.options ?? []).map((option, index) => <div className="option-row" key={option.id}><span className="option-index">{index + 1}</span><input aria-label={`Option ${index + 1}`} value={option.label} maxLength={200} onChange={(event) => updateOption(option.id, event.target.value)} /><button className="icon-button" type="button" onClick={() => moveOption(option.id, -1)} aria-label={`Move option ${index + 1} up`} disabled={index === 0}>↑</button><button className="icon-button" type="button" onClick={() => moveOption(option.id, 1)} aria-label={`Move option ${index + 1} down`} disabled={index === (field.options?.length ?? 0) - 1}>↓</button><button className="icon-button danger-icon" type="button" onClick={() => removeOption(option.id)} aria-label={`Delete option ${index + 1}`} disabled={(field.options?.length ?? 0) <= 1}>×</button></div>)}</div>}
  </div>
}

type PreviewFieldProps = { field: FormField; value: string | boolean; onChange: (value: string | boolean) => void }

function PreviewField({ field, value, onChange }: PreviewFieldProps) {
  const helpId = `${field.id}-help`
  const optionValue = optionIdForValue(field, value)
  const common = { id: field.id, name: field.id, required: field.required, 'aria-describedby': field.helpText ? helpId : undefined }
  const label = <label htmlFor={field.id}>{field.label || 'Untitled field'}</label>
  if (field.type === 'textarea') return <div className="preview-field">{label}<textarea {...common} value={String(value)} placeholder={field.placeholder} onChange={(event) => onChange(event.target.value)} />{field.helpText && <small id={helpId}>{field.helpText}</small>}</div>
  if (field.type === 'select') return <div className="preview-field">{label}<select {...common} value={optionValue} onChange={(event) => onChange(event.target.value)}><option value="">Select an option…</option>{(field.options ?? []).map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}</select>{field.helpText && <small id={helpId}>{field.helpText}</small>}</div>
  if (field.type === 'radio') return <fieldset className="preview-field choice-field"><legend>{field.label || 'Untitled field'}</legend>{(field.options ?? []).map((option) => <label key={option.id}><input type="radio" name={field.id} value={option.id} checked={optionValue === option.id} required={field.required && optionValue === ''} onChange={(event) => onChange(event.target.value)} />{option.label}</label>)}{field.helpText && <small id={helpId}>{field.helpText}</small>}</fieldset>
  if (field.type === 'checkbox') return <div className="preview-field preview-checkbox"><label><input type="checkbox" {...common} checked={Boolean(value)} onChange={(event) => onChange(event.target.checked)} />{field.label || 'Untitled field'}</label>{field.helpText && <small id={helpId}>{field.helpText}</small>}</div>
  return <div className="preview-field">{label}<input {...common} type={field.type} value={String(value)} placeholder={field.placeholder} min={field.min} max={field.max} onChange={(event) => onChange(event.target.value)} />{field.helpText && <small id={helpId}>{field.helpText}</small>}</div>
}

type ExportDialogProps = { format: ExportFormat; content: string; copied: boolean; onCopy: () => void; onDownload: () => void; onClose: () => void; onFormatChange: (format: ExportFormat) => void }

function ExportDialog({ format, content, copied, onCopy, onDownload, onClose, onFormatChange }: ExportDialogProps) {
  return <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}><section className="dialog-card" role="dialog" aria-modal="true" aria-labelledby="export-heading"><div className="dialog-heading"><div><p className="eyebrow">Ready when you are</p><h2 id="export-heading">Export {format.toUpperCase()}</h2></div><button className="icon-button" type="button" onClick={onClose} aria-label="Close export dialog">×</button></div><div className="segmented-control" role="group" aria-label="Export format"><button className={format === 'html' ? 'active' : ''} type="button" onClick={() => onFormatChange('html')}>HTML</button><button className={format === 'json' ? 'active' : ''} type="button" onClick={() => onFormatChange('json')}>JSON</button></div><pre className="code-preview"><code>{content}</code></pre><div className="dialog-actions"><button className="button button-secondary" type="button" onClick={onCopy}>{copied ? 'Copied!' : `Copy ${format.toUpperCase()}`}</button><button className="button button-primary" type="button" onClick={onDownload}>Download {format.toUpperCase()}</button></div></section></div>
}

type ImportDialogProps = { value: string; error: string; fileInputRef: React.RefObject<HTMLInputElement | null>; onChange: (value: string) => void; onFile: (event: ChangeEvent<HTMLInputElement>) => void; onImport: () => void; onClose: () => void }

function ImportDialog({ value, error, fileInputRef, onChange, onFile, onImport, onClose }: ImportDialogProps) {
  return <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}><section className="dialog-card" role="dialog" aria-modal="true" aria-labelledby="import-heading"><div className="dialog-heading"><div><p className="eyebrow">Bring a form back</p><h2 id="import-heading">Import JSON</h2></div><button className="icon-button" type="button" onClick={onClose} aria-label="Close import dialog">×</button></div><label className="field-control">Paste Formleaf JSON<textarea className="import-textarea" value={value} onChange={(event) => onChange(event.target.value)} placeholder={'{\n  "version": 1,\n  "title": "Contact Form",\n  ...\n}'} rows={12} /></label><input ref={fileInputRef} type="file" accept="application/json,.json" className="sr-only" onChange={onFile} />{error && <p className="error-message" role="alert">{error}</p>}<div className="dialog-actions"><button className="button button-quiet" type="button" onClick={() => fileInputRef.current?.click()}>Upload JSON</button><button className="button button-secondary" type="button" onClick={onClose}>Cancel</button><button className="button button-primary" type="button" onClick={onImport}>Import form</button></div></section></div>
}

export default App
