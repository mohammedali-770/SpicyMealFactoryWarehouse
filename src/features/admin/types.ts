export type FieldType = 'text' | 'textarea' | 'number' | 'checkbox' | 'select' | 'image'

export interface FieldConfig {
  name: string
  labelKey: string
  type: FieldType
  required?: boolean
  step?: string
  /** Static options for a select. */
  options?: { value: string; labelKey?: string; label?: string }[]
  /** Load select options ({id, name}) from another table where is_active. */
  optionsTable?: string
}

export type ColumnKind = 'text' | 'money' | 'bool' | 'image'

export interface ColumnConfig {
  key: string
  labelKey: string
  kind?: ColumnKind
}

export interface ResourceConfig {
  table: string
  /** i18n key prefix, e.g. 'admin.branches'. */
  i18nKey: string
  fields: FieldConfig[]
  columns: ColumnConfig[]
  hasImage?: boolean
  hasExcel?: boolean
}
