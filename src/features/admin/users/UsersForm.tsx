import { useState } from 'react'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { ROLE_VALUES, createUserSchema, updateUserSchema } from '@/shared/userSchemas'

export interface UserRow {
  id: string
  email: string | null
  full_name: string | null
  role: string
  branch_id: string | null
  is_active: boolean
}

type Values = Record<string, unknown>

export function UsersForm({
  initial,
  onClose,
  onSubmit,
}: {
  initial: UserRow | null
  onClose: () => void
  onSubmit: (values: Values) => Promise<unknown>
}) {
  const { t } = useTranslation()
  const isEdit = !!initial
  const schema = isEdit ? updateUserSchema : createUserSchema

  const { data: branches = [] } = useQuery({
    queryKey: ['admin', 'branchOptions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('branches')
        .select('id, name')
        .eq('is_active', true)
        .order('name')
      if (error) throw new Error(error.message)
      return (data ?? []) as { id: string; name: string }[]
    },
  })

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema) as unknown as Resolver<Values>,
    defaultValues: {
      id: initial?.id,
      email: initial?.email ?? '',
      password: '',
      full_name: initial?.full_name ?? '',
      role: initial?.role ?? 'customer',
      branch_id: initial?.branch_id ?? '',
      is_active: initial?.is_active ?? true,
    },
  })

  const [submitError, setSubmitError] = useState<string | null>(null)
  const inputClass =
    'w-full rounded-md border border-border px-3 py-2 outline-none focus:border-brand'

  async function submit(values: Values) {
    setSubmitError(null)
    const payload: Values = { ...values }
    if (payload.branch_id === '') payload.branch_id = null
    if (!isEdit) delete payload.id
    if (isEdit && payload.password === '') delete payload.password
    try {
      await onSubmit(payload)
      onClose()
    } catch (e) {
      setSubmitError((e as Error).message)
    }
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4" noValidate>
      <div className="space-y-1">
        <label htmlFor="email" className="block text-sm font-medium">
          {t('admin.users.fields.email')}
        </label>
        <input id="email" type="email" className={inputClass} {...register('email')} />
        {errors.email?.message && (
          <p className="text-sm text-danger">{t(String(errors.email.message))}</p>
        )}
      </div>

      <div className="space-y-1">
        <label htmlFor="full_name" className="block text-sm font-medium">
          {t('admin.users.fields.fullName')}
        </label>
        <input id="full_name" type="text" className={inputClass} {...register('full_name')} />
        {errors.full_name?.message && (
          <p className="text-sm text-danger">{t(String(errors.full_name.message))}</p>
        )}
      </div>

      <div className="space-y-1">
        <label htmlFor="password" className="block text-sm font-medium">
          {t('admin.users.fields.password')}{' '}
          {isEdit && <span className="text-muted">({t('admin.users.passwordOptional')})</span>}
        </label>
        <input
          id="password"
          type="password"
          autoComplete="new-password"
          className={inputClass}
          {...register('password')}
        />
        {errors.password?.message && (
          <p className="text-sm text-danger">{t(String(errors.password.message))}</p>
        )}
      </div>

      <div className="space-y-1">
        <label htmlFor="role" className="block text-sm font-medium">
          {t('admin.users.fields.role')}
        </label>
        <select id="role" className={inputClass} {...register('role')}>
          {ROLE_VALUES.map((r) => (
            <option key={r} value={r}>
              {t(`admin.roles.${r}`)}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <label htmlFor="branch_id" className="block text-sm font-medium">
          {t('admin.users.fields.branch')}
        </label>
        <select id="branch_id" className={inputClass} {...register('branch_id')}>
          <option value="">—</option>
          {branches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      </div>

      {isEdit && (
        <label className="flex items-center gap-2 text-sm font-medium">
          <input type="checkbox" {...register('is_active')} />
          {t('admin.users.fields.active')}
        </label>
      )}

      <p className="rounded-md bg-surface p-2 text-xs text-muted">
        {t('admin.users.roleChangeNote')}
      </p>

      {submitError && <p className="text-sm text-danger">{submitError}</p>}

      <div className="flex justify-end gap-2">
        <Button type="button" onClick={onClose} className="bg-muted">
          {t('common.cancel')}
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {t('common.save')}
        </Button>
      </div>
    </form>
  )
}
