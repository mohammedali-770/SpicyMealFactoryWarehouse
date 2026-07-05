import { describe, it, expect } from 'vitest'
import { businessDate } from '@/lib/datetime'

describe('businessDate (Asia/Riyadh, UTC+3)', () => {
  it('rolls to the next day after Riyadh midnight', () => {
    // 22:30 UTC = 01:30 next day in Riyadh.
    expect(businessDate('2026-06-30T22:30:00Z')).toBe('2026-07-01')
  })

  it('stays on the same day before Riyadh midnight', () => {
    expect(businessDate('2026-06-30T10:00:00Z')).toBe('2026-06-30')
  })
})
