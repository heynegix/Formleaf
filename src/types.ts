export const FIELD_TYPES = [
  'text',
  'email',
  'number',
  'textarea',
  'select',
  'radio',
  'checkbox',
  'date',
  'url',
  'tel',
] as const

export const CURRENT_FORM_VERSION = 1 as const

export type FieldType = (typeof FIELD_TYPES)[number]

export type FieldOption = {
  id: string
  label: string
}

export type FormField = {
  id: string
  type: FieldType
  label: string
  placeholder: string
  required: boolean
  helpText: string
  defaultValue?: string | boolean
  min?: number
  max?: number
  options?: FieldOption[]
}

export type FormDefinition = {
  version: typeof CURRENT_FORM_VERSION
  title: string
  description: string
  submitLabel: string
  fields: FormField[]
}

export const FIELD_LABELS: Record<FieldType, string> = {
  text: 'Text',
  email: 'Email',
  number: 'Number',
  textarea: 'Textarea',
  select: 'Select',
  radio: 'Radio',
  checkbox: 'Checkbox',
  date: 'Date',
  url: 'URL',
  tel: 'Telephone',
}

export const DEFAULT_FORM: FormDefinition = {
  version: CURRENT_FORM_VERSION,
  title: 'Untitled Form',
  description: '',
  submitLabel: 'Submit',
  fields: [],
}

export function createId(prefix = 'field'): string {
  const uuid = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`
  return `${prefix}-${uuid}`
}

export function createOption(label = 'Option'): FieldOption {
  return { id: createId('option'), label }
}

export function createField(type: FieldType): FormField {
  const field: FormField = {
    id: createId(),
    type,
    label: `${FIELD_LABELS[type]} field`,
    placeholder: type === 'textarea' ? 'Write your answer…' : '',
    required: false,
    helpText: '',
  }

  if (type === 'select' || type === 'radio') {
    field.options = [createOption('Option 1'), createOption('Option 2')]
  }

  return field
}

export function createExampleForm(): FormDefinition {
  return {
    version: 1,
    title: 'Contact Form',
    description: 'Send us a message and we will get back to you.',
    submitLabel: 'Send message',
    fields: [
      {
        ...createField('text'),
        label: 'Name',
        placeholder: 'Your name',
        required: true,
      },
      {
        ...createField('email'),
        label: 'Email',
        placeholder: 'you@example.com',
        required: true,
      },
      {
        ...createField('textarea'),
        label: 'Message',
        placeholder: 'How can we help?',
        required: true,
      },
    ],
  }
}
