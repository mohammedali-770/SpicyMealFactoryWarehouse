import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { Navigate, useLocation } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { loginSchema } from '@/features/auth/schema'
import type { LoginValues } from '@/features/auth/schema'
import { Button } from '@/components/ui/Button'
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher'

export function LoginPage() {
  const { t } = useTranslation()
  const { session, loading } = useAuth()
  const location = useLocation()
  const [formError, setFormError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) })

  if (!loading && session) {
    const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname
    return <Navigate to={from ?? '/'} replace />
  }

  async function onSubmit(values: LoginValues) {
    setFormError(null)
    const { error } = await supabase.auth.signInWithPassword(values)
    if (error) setFormError(t('auth.login.invalid'))
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface p-4">
      <div className="w-full max-w-sm space-y-6 rounded-lg border border-border bg-white p-8 shadow-sm">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-xl font-bold text-ink">{t('auth.login.title')}</h1>
          <LanguageSwitcher />
        </div>

        <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="email" className="block text-sm font-medium">
              {t('auth.login.email')}
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              className="w-full rounded-md border border-border px-3 py-2 outline-none focus:border-brand"
              {...register('email')}
            />
            {errors.email?.message && (
              <p className="text-sm text-danger" role="alert">
                {t(errors.email.message)}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <label htmlFor="password" className="block text-sm font-medium">
              {t('auth.login.password')}
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              className="w-full rounded-md border border-border px-3 py-2 outline-none focus:border-brand"
              {...register('password')}
            />
            {errors.password?.message && (
              <p className="text-sm text-danger" role="alert">
                {t(errors.password.message)}
              </p>
            )}
          </div>

          {formError && (
            <p className="text-sm text-danger" role="alert">
              {formError}
            </p>
          )}

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? t('auth.login.submitting') : t('auth.login.submit')}
          </Button>
        </form>
      </div>
    </div>
  )
}
