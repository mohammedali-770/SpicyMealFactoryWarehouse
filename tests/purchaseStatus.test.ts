import { describe, it, expect } from 'vitest'
import {
  allowedPurchaseTransitions,
  creatableKinds,
  managesKind,
} from '@/features/purchasing/status'

describe('managesKind', () => {
  it('admin and general_manager manage both kinds', () => {
    expect(managesKind('admin', 'warehouse')).toBe(true)
    expect(managesKind('admin', 'raw_material')).toBe(true)
    expect(managesKind('general_manager', 'raw_material')).toBe(true)
  })

  it('warehouse manager owns warehouse POs, factory manager owns raw-material POs', () => {
    expect(managesKind('warehouse_manager', 'warehouse')).toBe(true)
    expect(managesKind('warehouse_manager', 'raw_material')).toBe(false)
    expect(managesKind('factory_manager', 'raw_material')).toBe(true)
    expect(managesKind('factory_manager', 'warehouse')).toBe(false)
  })

  it('customers and accountants manage nothing', () => {
    expect(managesKind('customer', 'warehouse')).toBe(false)
    expect(managesKind('accountant', 'raw_material')).toBe(false)
  })
})

describe('creatableKinds', () => {
  it('returns the kinds each role can create', () => {
    expect(creatableKinds('admin')).toEqual(['warehouse', 'raw_material'])
    expect(creatableKinds('warehouse_manager')).toEqual(['warehouse'])
    expect(creatableKinds('factory_manager')).toEqual(['raw_material'])
    expect(creatableKinds('accountant')).toEqual([])
    expect(creatableKinds('customer')).toEqual([])
  })
})

describe('allowedPurchaseTransitions', () => {
  it('a manager drives their PO pending -> approved -> received', () => {
    const ctx = { role: 'warehouse_manager' as const, kind: 'warehouse' as const }
    expect(allowedPurchaseTransitions('pending', ctx)).toEqual(['approved', 'cancelled'])
    expect(allowedPurchaseTransitions('approved', ctx)).toEqual(['received', 'cancelled'])
    expect(allowedPurchaseTransitions('received', ctx)).toEqual([])
  })

  it('a non-managing role gets no transitions', () => {
    expect(
      allowedPurchaseTransitions('pending', { role: 'factory_manager', kind: 'warehouse' }),
    ).toEqual([])
    expect(
      allowedPurchaseTransitions('pending', { role: 'accountant', kind: 'warehouse' }),
    ).toEqual([])
  })

  it('terminal states have no transitions', () => {
    const ctx = { role: 'admin' as const, kind: 'raw_material' as const }
    expect(allowedPurchaseTransitions('received', ctx)).toEqual([])
    expect(allowedPurchaseTransitions('cancelled', ctx)).toEqual([])
  })
})
