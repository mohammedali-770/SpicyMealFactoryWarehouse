import { describe, it, expect } from 'vitest'
import { allowedTransitions, managesCategory } from '@/features/orders/status'

describe('managesCategory', () => {
  it('admin and general_manager manage any category', () => {
    expect(managesCategory('admin', 'warehouse')).toBe(true)
    expect(managesCategory('admin', 'factory')).toBe(true)
    expect(managesCategory('general_manager', 'factory')).toBe(true)
  })

  it('warehouse/factory managers only manage their own category', () => {
    expect(managesCategory('warehouse_manager', 'warehouse')).toBe(true)
    expect(managesCategory('warehouse_manager', 'factory')).toBe(false)
    expect(managesCategory('factory_manager', 'factory')).toBe(true)
    expect(managesCategory('factory_manager', 'warehouse')).toBe(false)
  })

  it('customer and accountant manage nothing', () => {
    expect(managesCategory('customer', 'warehouse')).toBe(false)
    expect(managesCategory('accountant', 'warehouse')).toBe(false)
    expect(managesCategory(null, 'warehouse')).toBe(false)
  })
})

describe('allowedTransitions', () => {
  const owner = (role: Parameters<typeof allowedTransitions>[1]['role']) => ({
    role,
    isOwner: true,
    category: 'warehouse' as const,
  })

  it('the owning customer can submit or cancel a pending order but not approve', () => {
    expect(allowedTransitions('draft', owner('customer'))).toEqual(['pending', 'cancelled'])
    expect(allowedTransitions('pending', owner('customer'))).toEqual(['cancelled'])
    expect(allowedTransitions('approved', owner('customer'))).toEqual([])
  })

  it('a non-owner customer can do nothing', () => {
    expect(
      allowedTransitions('pending', { role: 'customer', isOwner: false, category: 'warehouse' }),
    ).toEqual([])
  })

  it('a warehouse manager drives its own orders through the lifecycle', () => {
    const ctx = {
      role: 'warehouse_manager' as const,
      isOwner: false,
      category: 'warehouse' as const,
    }
    expect(allowedTransitions('pending', ctx)).toEqual(['approved', 'cancelled'])
    expect(allowedTransitions('approved', ctx)).toEqual(['completed', 'cancelled'])
  })

  it('a warehouse manager cannot touch a factory order', () => {
    const ctx = { role: 'warehouse_manager' as const, isOwner: false, category: 'factory' as const }
    expect(allowedTransitions('pending', ctx)).toEqual([])
  })

  it('admin can approve, complete and cancel', () => {
    const ctx = { role: 'admin' as const, isOwner: false, category: 'factory' as const }
    expect(allowedTransitions('pending', ctx)).toEqual(['approved', 'cancelled'])
    expect(allowedTransitions('approved', ctx)).toEqual(['completed', 'cancelled'])
  })

  it('accountant is read-only', () => {
    const ctx = { role: 'accountant' as const, isOwner: false, category: 'warehouse' as const }
    expect(allowedTransitions('pending', ctx)).toEqual([])
  })

  it('terminal states have no transitions', () => {
    const ctx = { role: 'admin' as const, isOwner: false, category: 'warehouse' as const }
    expect(allowedTransitions('completed', ctx)).toEqual([])
    expect(allowedTransitions('cancelled', ctx)).toEqual([])
  })
})
