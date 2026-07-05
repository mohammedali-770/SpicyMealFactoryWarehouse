import { AuthError, requireAdmin } from '../_shared/auth.ts'
import { handleOptions, jsonResponse } from '../_shared/cors.ts'
import { logRequest } from '../_shared/log.ts'
import { rateLimit } from '../_shared/rateLimit.ts'
import { supabaseAdmin } from '../_shared/supabaseAdmin.ts'
import { createUserSchema } from '../_shared/schemas.ts'

export async function handler(req: Request): Promise<Response> {
  const requestId = crypto.randomUUID()
  const started = Date.now()

  if (req.method === 'OPTIONS') return handleOptions(req)
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405, req)

  try {
    const caller = await requireAdmin(req)

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'local'
    if (!rateLimit(`create:${caller.id}:${ip}`)) {
      logRequest({
        requestId,
        action: 'admin-create-user',
        caller: caller.id,
        outcome: 'rate_limited',
        status: 429,
      })
      return jsonResponse({ error: 'Too many requests' }, 429, req)
    }

    const parsed = createUserSchema.safeParse(await req.json())
    if (!parsed.success) {
      return jsonResponse({ error: 'Invalid payload', issues: parsed.error.issues }, 400, req)
    }
    const { email, password, full_name, role } = parsed.data

    const { data, error } = await supabaseAdmin().auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      app_metadata: { role },
      user_metadata: { full_name },
    })
    if (error) {
      logRequest({
        requestId,
        action: 'admin-create-user',
        caller: caller.id,
        outcome: 'error',
        status: 400,
        ms: Date.now() - started,
      })
      return jsonResponse({ error: error.message }, 400, req)
    }

    logRequest({
      requestId,
      action: 'admin-create-user',
      caller: caller.id,
      outcome: 'created',
      status: 200,
      ms: Date.now() - started,
    })
    return jsonResponse({ success: true, user: data.user }, 200, req)
  } catch (e) {
    if (e instanceof AuthError) {
      logRequest({
        requestId,
        action: 'admin-create-user',
        outcome: 'authz_denied',
        status: e.status,
      })
      return jsonResponse({ error: e.message }, e.status, req)
    }
    logRequest({ requestId, action: 'admin-create-user', outcome: 'exception', status: 500 })
    return jsonResponse({ error: 'Internal error' }, 500, req)
  }
}

if (import.meta.main) {
  Deno.serve(handler)
}
