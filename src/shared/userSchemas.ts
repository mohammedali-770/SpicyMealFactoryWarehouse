import { z } from 'zod'

// Canonical user schemas, shared between the Vite client (npm `zod`) and the Deno
// edge functions (bare `zod` -> npm:zod via supabase/functions/deno.json import map).
// Keep this file plain (no DOM / Vite-only imports) so both runtimes can load it.
// Error messages are i18n keys, translated at render time on the client.

export const ROLE_VALUES = [
  'admin',
  'customer',
  'warehouse_manager',
  'factory_manager',
  'general_manager',
  'accountant',
] as const

export const createUserSchema = z.object({
  email: z.email({ message: 'admin.users.errors.email' }),
  password: z.string().min(6, { message: 'admin.users.errors.password' }),
  full_name: z.string().trim().min(1, { message: 'admin.users.errors.fullName' }),
  role: z.enum(ROLE_VALUES),
  branch_id: z.uuid().nullable().optional(),
})

export const updateUserSchema = z.object({
  id: z.uuid(),
  email: z.email({ message: 'admin.users.errors.email' }).optional(),
  // allow blank (means "leave password unchanged")
  password: z
    .union([z.string().min(6, { message: 'admin.users.errors.password' }), z.literal('')])
    .optional(),
  full_name: z.string().trim().min(1, { message: 'admin.users.errors.fullName' }),
  role: z.enum(ROLE_VALUES),
  branch_id: z.uuid().nullable().optional(),
  is_active: z.boolean().optional(),
})

export type CreateUserInput = z.infer<typeof createUserSchema>
export type UpdateUserInput = z.infer<typeof updateUserSchema>
