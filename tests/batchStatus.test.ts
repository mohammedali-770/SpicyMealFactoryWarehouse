import { describe, it, expect } from 'vitest'
import { allowedBatchTransitions, managesProduction } from '@/features/production/status'

describe('managesProduction', () => {
  it('admin, general_manager and factory_manager may run production', () => {
    expect(managesProduction('admin')).toBe(true)
    expect(managesProduction('general_manager')).toBe(true)
    expect(managesProduction('factory_manager')).toBe(true)
  })

  it('other roles may not', () => {
    expect(managesProduction('warehouse_manager')).toBe(false)
    expect(managesProduction('accountant')).toBe(false)
    expect(managesProduction('customer')).toBe(false)
    expect(managesProduction(null)).toBe(false)
  })
})

describe('allowedBatchTransitions', () => {
  it('a manager drives a batch pending -> in_progress -> completed', () => {
    expect(allowedBatchTransitions('pending', true)).toEqual(['in_progress', 'cancelled'])
    expect(allowedBatchTransitions('in_progress', true)).toEqual(['completed', 'cancelled'])
  })

  it('terminal states have no transitions', () => {
    expect(allowedBatchTransitions('completed', true)).toEqual([])
    expect(allowedBatchTransitions('cancelled', true)).toEqual([])
  })

  it('a non-manager gets no transitions', () => {
    expect(allowedBatchTransitions('pending', false)).toEqual([])
    expect(allowedBatchTransitions('in_progress', false)).toEqual([])
  })
})
