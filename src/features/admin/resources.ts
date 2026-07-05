import type { ResourceConfig } from './types'

export const branchesConfig: ResourceConfig = {
  table: 'branches',
  i18nKey: 'admin.branches',
  fields: [
    { name: 'name', labelKey: 'admin.fields.name', type: 'text', required: true },
    { name: 'name_ar', labelKey: 'admin.fields.nameAr', type: 'text' },
    { name: 'internal_only', labelKey: 'admin.branches.fields.internalOnly', type: 'checkbox' },
  ],
  columns: [
    { key: 'name', labelKey: 'admin.fields.name' },
    { key: 'name_ar', labelKey: 'admin.fields.nameAr' },
  ],
}

export const itemsConfig: ResourceConfig = {
  table: 'items',
  i18nKey: 'admin.items',
  hasImage: true,
  hasExcel: true,
  fields: [
    { name: 'sku', labelKey: 'admin.items.fields.sku', type: 'text' },
    { name: 'name', labelKey: 'admin.fields.name', type: 'text', required: true },
    { name: 'name_ar', labelKey: 'admin.fields.nameAr', type: 'text' },
    {
      name: 'category',
      labelKey: 'admin.items.fields.category',
      type: 'select',
      options: [
        { value: 'warehouse', labelKey: 'admin.items.category.warehouse' },
        { value: 'factory', labelKey: 'admin.items.category.factory' },
      ],
    },
    { name: 'unit', labelKey: 'admin.items.fields.unit', type: 'text' },
    { name: 'unit_price', labelKey: 'admin.items.fields.unitPrice', type: 'number', step: '0.01' },
    {
      name: 'stock_level_required',
      labelKey: 'admin.items.fields.stockLevelRequired',
      type: 'checkbox',
    },
  ],
  columns: [
    { key: 'image_url', labelKey: 'admin.items.fields.image', kind: 'image' },
    { key: 'sku', labelKey: 'admin.items.fields.sku' },
    { key: 'name', labelKey: 'admin.fields.name' },
    { key: 'category', labelKey: 'admin.items.fields.category' },
    { key: 'unit', labelKey: 'admin.items.fields.unit' },
    { key: 'unit_price', labelKey: 'admin.items.fields.unitPrice', kind: 'money' },
  ],
}

export const suppliersConfig: ResourceConfig = {
  table: 'suppliers',
  i18nKey: 'admin.suppliers',
  fields: [
    { name: 'name', labelKey: 'admin.fields.name', type: 'text', required: true },
    { name: 'name_ar', labelKey: 'admin.fields.nameAr', type: 'text' },
    { name: 'contact_name', labelKey: 'admin.suppliers.fields.contactName', type: 'text' },
    { name: 'phone', labelKey: 'admin.suppliers.fields.phone', type: 'text' },
    { name: 'email', labelKey: 'admin.suppliers.fields.email', type: 'text' },
    { name: 'address', labelKey: 'admin.suppliers.fields.address', type: 'textarea' },
    { name: 'notes', labelKey: 'admin.suppliers.fields.notes', type: 'textarea' },
  ],
  columns: [
    { key: 'name', labelKey: 'admin.fields.name' },
    { key: 'contact_name', labelKey: 'admin.suppliers.fields.contactName' },
    { key: 'phone', labelKey: 'admin.suppliers.fields.phone' },
    { key: 'email', labelKey: 'admin.suppliers.fields.email' },
  ],
}

export const rawMaterialsConfig: ResourceConfig = {
  table: 'raw_materials',
  i18nKey: 'admin.rawMaterials',
  fields: [
    { name: 'name', labelKey: 'admin.fields.name', type: 'text', required: true },
    { name: 'name_ar', labelKey: 'admin.fields.nameAr', type: 'text' },
    { name: 'unit', labelKey: 'admin.items.fields.unit', type: 'text' },
    { name: 'unit_price', labelKey: 'admin.items.fields.unitPrice', type: 'number', step: '0.01' },
    {
      name: 'supplier_id',
      labelKey: 'admin.rawMaterials.fields.supplier',
      type: 'select',
      optionsTable: 'suppliers',
    },
  ],
  columns: [
    { key: 'name', labelKey: 'admin.fields.name' },
    { key: 'unit', labelKey: 'admin.items.fields.unit' },
    { key: 'unit_price', labelKey: 'admin.items.fields.unitPrice', kind: 'money' },
  ],
}
