import { describe, it, expect } from 'vitest'
import en from '@/i18n/en.json'
import ar from '@/i18n/ar.json'

function keys(obj: Record<string, unknown>, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([k, v]) =>
    v && typeof v === 'object'
      ? keys(v as Record<string, unknown>, `${prefix}${k}.`)
      : [`${prefix}${k}`],
  )
}

describe('i18n parity', () => {
  it('en and ar expose the identical key set', () => {
    expect(keys(ar).sort()).toEqual(keys(en).sort())
  })
})
