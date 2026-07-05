import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { invokeAdminFn } from '@/lib/functions'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { Modal } from '@/components/ui/Modal'
import { UsersForm, type UserRow } from './UsersForm'

export function UsersScreen() {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const usersKey = ['admin', 'profiles']

  const usersQuery = useQuery({
    queryKey: usersKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, role, branch_id, is_active')
        .order('email')
      if (error) throw new Error(error.message)
      return (data ?? []) as UserRow[]
    },
  })

  const createMut = useMutation({
    mutationFn: (values: Record<string, unknown>) => invokeAdminFn('admin-create-user', values),
    onSuccess: () => qc.invalidateQueries({ queryKey: usersKey }),
  })
  const updateMut = useMutation({
    mutationFn: (values: Record<string, unknown>) => invokeAdminFn('admin-update-user', values),
    onSuccess: () => qc.invalidateQueries({ queryKey: usersKey }),
  })

  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<UserRow | null>(null)
  const users = usersQuery.data ?? []

  return (
    <section className="space-y-4" data-testid="admin-users">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-ink">{t('admin.users.title')}</h1>
        <Button type="button" onClick={() => setCreating(true)}>
          <Plus size={16} className="me-1" aria-hidden /> {t('common.add')}
        </Button>
      </div>

      {usersQuery.isLoading ? (
        <Card>
          <Spinner />
        </Card>
      ) : usersQuery.error ? (
        <Card>
          <p className="text-danger">{(usersQuery.error as Error).message}</p>
        </Card>
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-start text-sm">
            <thead className="border-b border-border bg-surface">
              <tr>
                <th className="px-4 py-2 text-start font-medium">
                  {t('admin.users.fields.email')}
                </th>
                <th className="px-4 py-2 text-start font-medium">
                  {t('admin.users.fields.fullName')}
                </th>
                <th className="px-4 py-2 text-start font-medium">{t('admin.users.fields.role')}</th>
                <th className="px-4 py-2 text-start font-medium">{t('common.status')}</th>
                <th className="px-4 py-2 text-end font-medium">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-2">{u.email}</td>
                  <td className="px-4 py-2">
                    {u.full_name || <span className="text-muted">—</span>}
                  </td>
                  <td className="px-4 py-2">{t(`admin.roles.${u.role}`)}</td>
                  <td className="px-4 py-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${u.is_active ? 'bg-green-100 text-green-800' : 'bg-stone-200 text-stone-600'}`}
                    >
                      {u.is_active ? t('common.active') : t('common.inactive')}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-end">
                    <button
                      type="button"
                      aria-label={t('common.edit')}
                      onClick={() => setEditing(u)}
                      className="rounded p-1 hover:bg-surface"
                    >
                      <Pencil size={16} aria-hidden />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {(creating || editing) && (
        <Modal
          title={editing ? t('admin.users.edit') : t('admin.users.create')}
          onClose={() => {
            setCreating(false)
            setEditing(null)
          }}
        >
          <UsersForm
            initial={editing}
            onClose={() => {
              setCreating(false)
              setEditing(null)
            }}
            onSubmit={(values) =>
              editing ? updateMut.mutateAsync(values) : createMut.mutateAsync(values)
            }
          />
        </Modal>
      )}
    </section>
  )
}
