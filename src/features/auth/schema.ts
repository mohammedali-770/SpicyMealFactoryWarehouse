import { z } from 'zod'

// Error messages are i18n keys, translated at render time.
export const loginSchema = z.object({
  email: z.email({ message: 'auth.login.emailRequired' }),
  password: z.string().min(8, { message: 'auth.login.passwordRequired' }),
})

export type LoginValues = z.infer<typeof loginSchema>
