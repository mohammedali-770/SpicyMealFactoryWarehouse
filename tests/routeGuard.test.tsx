import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { RoleGuard } from '@/app/router/RoleGuard'
import type { AuthContextValue } from '@/app/providers/AuthProvider'

const mockAuth = vi.fn<() => Partial<AuthContextValue>>()
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => mockAuth() }))

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route
          path="/admin"
          element={
            <RoleGuard allow={['admin']}>
              <div>admin area</div>
            </RoleGuard>
          }
        />
        <Route path="/customer" element={<div>customer home</div>} />
        <Route path="/login" element={<div>login screen</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('RoleGuard', () => {
  beforeEach(() => mockAuth.mockReset())

  it('redirects a customer away from an admin-only route to their own home', () => {
    mockAuth.mockReturnValue({ role: 'customer', loading: false })
    renderAt('/admin')
    expect(screen.getByText('customer home')).toBeInTheDocument()
    expect(screen.queryByText('admin area')).not.toBeInTheDocument()
  })

  it('renders the route when the role is allowed', () => {
    mockAuth.mockReturnValue({ role: 'admin', loading: false })
    renderAt('/admin')
    expect(screen.getByText('admin area')).toBeInTheDocument()
  })

  it('redirects an unauthenticated user to login', () => {
    mockAuth.mockReturnValue({ role: null, loading: false })
    renderAt('/admin')
    expect(screen.getByText('login screen')).toBeInTheDocument()
  })
})
