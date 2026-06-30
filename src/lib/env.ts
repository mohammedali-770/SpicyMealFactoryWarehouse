import { z } from 'zod'

/** Client environment contract. Anon key only — never the service-role key. */
export const envSchema = z.object({
  VITE_SUPABASE_URL: z.string().url(),
  VITE_SUPABASE_ANON_KEY: z.string().min(20),
})

export type Env = z.infer<typeof envSchema>

/** Parse and validate an env-like object, throwing a readable error on failure. */
export function parseEnv(source: Record<string, unknown>): Env {
  const result = envSchema.safeParse(source)
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  - ${i.path.join('.') || '(root)'}: ${i.message}`)
      .join('\n')
    throw new Error(`Invalid environment configuration. Check your .env file:\n${issues}`)
  }
  return result.data
}

/** Validated env, parsed once at module load so misconfiguration fails loudly at boot. */
export const env = parseEnv(import.meta.env as Record<string, unknown>)
