import { assertEquals } from '@std/assert'
import { handler } from './index.ts'

Deno.test('OPTIONS preflight -> 204', async () => {
  const res = await handler(new Request('http://localhost', { method: 'OPTIONS' }))
  assertEquals(res.status, 204)
})

Deno.test('GET -> 405', async () => {
  const res = await handler(new Request('http://localhost', { method: 'GET' }))
  assertEquals(res.status, 405)
})

Deno.test('POST without a bearer token -> 401', async () => {
  const res = await handler(new Request('http://localhost', { method: 'POST' }))
  assertEquals(res.status, 401)
})
