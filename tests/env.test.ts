import { describe, it, expect } from 'vitest'
import { parseEnv } from '@/lib/env'

const VALID = {
  VITE_SUPABASE_URL: 'http://localhost:54321',
  VITE_SUPABASE_ANON_KEY: 'a'.repeat(30),
}

describe('parseEnv', () => {
  it('returns a typed object for valid input', () => {
    const out = parseEnv(VALID)
    expect(out.VITE_SUPABASE_URL).toBe('http://localhost:54321')
  })

  it('throws when the URL is missing', () => {
    expect(() => parseEnv({ VITE_SUPABASE_ANON_KEY: 'a'.repeat(30) })).toThrow()
  })

  it('throws when the URL is invalid', () => {
    expect(() => parseEnv({ ...VALID, VITE_SUPABASE_URL: 'not-a-url' })).toThrow()
  })

  it('throws when the anon key is too short', () => {
    expect(() => parseEnv({ ...VALID, VITE_SUPABASE_ANON_KEY: 'short' })).toThrow()
  })
})
