import { describe, it, expect } from 'vitest'
import { buildSchema } from '@/features/admin/buildSchema'
import { createUserSchema, updateUserSchema } from '@/shared/userSchemas'

describe('buildSchema', () => {
  const schema = buildSchema([
    { name: 'name', labelKey: 'x', type: 'text', required: true },
    { name: 'price', labelKey: 'x', type: 'number' },
    { name: 'flag', labelKey: 'x', type: 'checkbox' },
  ])

  it('rejects a blank required text field', () => {
    expect(schema.safeParse({ name: '', price: 1, flag: false }).success).toBe(false)
  })

  it('coerces numeric strings and rejects negatives', () => {
    expect(schema.safeParse({ name: 'a', price: '5', flag: false }).success).toBe(true)
    expect(schema.safeParse({ name: 'a', price: -1, flag: false }).success).toBe(false)
  })
})

describe('user schemas', () => {
  it('rejects a bad email / short password', () => {
    const r = createUserSchema.safeParse({
      email: 'bad',
      password: 'short',
      full_name: 'A',
      role: 'customer',
    })
    expect(r.success).toBe(false)
  })

  it('accepts valid create input', () => {
    const r = createUserSchema.safeParse({
      email: 'a@b.test',
      password: 'secret1',
      full_name: 'Ann',
      role: 'admin',
    })
    expect(r.success).toBe(true)
  })

  it('allows a blank password on update (keep existing)', () => {
    const r = updateUserSchema.safeParse({
      id: '00000000-0000-4000-8000-000000000000',
      full_name: 'Ann',
      role: 'admin',
      password: '',
    })
    expect(r.success).toBe(true)
  })
})
