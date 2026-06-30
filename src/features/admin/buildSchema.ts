import { z, type ZodTypeAny } from 'zod'
import type { FieldConfig } from './types'

/** Build a RHF/Zod object schema from a resource's field config. */
export function buildSchema(fields: FieldConfig[]) {
  const shape: Record<string, ZodTypeAny> = {}
  for (const f of fields) {
    if (f.type === 'number') {
      shape[f.name] = z.coerce
        .number({ message: 'admin.errors.number' })
        .min(0, { message: 'admin.errors.nonNegative' })
    } else if (f.type === 'checkbox') {
      shape[f.name] = z.boolean().default(false)
    } else if (f.type === 'image') {
      shape[f.name] = z.string().optional()
    } else if (f.required) {
      shape[f.name] = z.string().trim().min(1, { message: 'admin.errors.required' })
    } else {
      shape[f.name] = z.string().trim().optional().or(z.literal(''))
    }
  }
  return z.object(shape)
}
