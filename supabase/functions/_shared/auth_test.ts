import { assertEquals, assertRejects } from '@std/assert'
import { AuthError, type GetUser, requireAdmin } from './auth.ts'

function postWith(token?: string): Request {
  const headers = new Headers()
  if (token) headers.set('Authorization', `Bearer ${token}`)
  return new Request('http://localhost', { method: 'POST', headers })
}

const userWithRole = (role: string | null): GetUser => () =>
  Promise.resolve({ id: 'u1', email: 'u@x.test', role })

Deno.test('requireAdmin: missing token -> 401', async () => {
  const err = await assertRejects(() => requireAdmin(postWith(), userWithRole('admin')), AuthError)
  assertEquals(err.status, 401)
})

Deno.test('requireAdmin: invalid token (getUser null) -> 401', async () => {
  const err = await assertRejects(
    () => requireAdmin(postWith('tok'), () => Promise.resolve(null)),
    AuthError,
  )
  assertEquals(err.status, 401)
})

Deno.test('requireAdmin: non-admin -> 403', async () => {
  const err = await assertRejects(
    () => requireAdmin(postWith('tok'), userWithRole('customer')),
    AuthError,
  )
  assertEquals(err.status, 403)
})

Deno.test('requireAdmin: admin -> returns caller', async () => {
  const caller = await requireAdmin(postWith('tok'), userWithRole('admin'))
  assertEquals(caller.role, 'admin')
  assertEquals(caller.id, 'u1')
})
