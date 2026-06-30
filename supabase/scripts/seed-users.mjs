// Seed one auth user per role for local development, with the role baked into
// app_metadata so it appears in the JWT (and drives RLS) on first login.
//
// Usage (values come from `npm run sb:status`):
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node supabase/scripts/seed-users.mjs
//
// The service-role key is read from the environment ONLY here (server-side); it
// must never reach the client bundle.
import { createClient } from '@supabase/supabase-js'

const url = process.env.SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceKey) {
  console.error(
    'Missing env. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (see `npm run sb:status`).',
  )
  process.exit(1)
}

const ROLES = [
  'admin',
  'customer',
  'warehouse_manager',
  'factory_manager',
  'general_manager',
  'accountant',
]
const PASSWORD = 'Passw0rd!'

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const { data: existing, error: listError } = await admin.auth.admin.listUsers({ perPage: 200 })
if (listError) {
  console.error('Could not list users:', listError.message)
  process.exit(1)
}

for (const role of ROLES) {
  const email = `${role}@example.test`
  const found = existing.users.find((u) => u.email === email)

  if (found) {
    const { error } = await admin.auth.admin.updateUserById(found.id, {
      password: PASSWORD,
      app_metadata: { role },
    })
    console.log(error ? `! ${email}: ${error.message}` : `~ updated ${email} (${role})`)
    if (error) process.exitCode = 1
    continue
  }

  const { error } = await admin.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
    app_metadata: { role },
  })
  console.log(error ? `! ${email}: ${error.message}` : `+ created ${email} (${role})`)
  if (error) process.exitCode = 1
}

console.log(`\nDone. All seeded users share the password: ${PASSWORD}`)
