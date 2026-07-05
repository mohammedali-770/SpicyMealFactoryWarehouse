import { useMemo, useState } from 'react'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { compressImage } from '@/lib/imageCompression'
import { Button } from '@/components/ui/Button'
import { buildSchema } from './buildSchema'
import type { CrudRow } from './crud'
import type { FieldConfig, ResourceConfig } from './types'

type Values = Record<string, unknown>

function buildDefaults(fields: FieldConfig[], initial: CrudRow | null, hasImage: boolean): Values {
  const out: Values = {}
  for (const f of fields) {
    const v = initial?.[f.name]
    if (f.type === 'checkbox') out[f.name] = Boolean(v ?? false)
    else if (f.type === 'number') out[f.name] = v ?? 0
    else out[f.name] = (v as string | null) ?? ''
  }
  if (hasImage) out.image_url = (initial?.image_url as string | null) ?? ''
  return out
}

export function ResourceForm({
  config,
  initial,
  onClose,
  onSaved,
}: {
  config: ResourceConfig
  initial: CrudRow | null
  onClose: () => void
  onSaved: (values: Values) => Promise<void>
}) {
  const { t } = useTranslation()
  const schema = useMemo(() => buildSchema(config.fields), [config])
  const defaults = useMemo(
    () => buildDefaults(config.fields, initial, !!config.hasImage),
    [config, initial],
  )

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema) as Resolver<Values>,
    defaultValues: defaults,
  })

  const [formError, setFormError] = useState<string | null>(null)
  const [imageBusy, setImageBusy] = useState(false)
  const imageUrl = config.hasImage ? (watch('image_url') as string | undefined) : undefined

  const optionsField = config.fields.find((f) => f.optionsTable)
  const { data: dynamicOptions = [] } = useQuery({
    queryKey: ['admin', 'options', optionsField?.optionsTable],
    enabled: !!optionsField,
    queryFn: async () => {
      const { data, error } = await supabase
        .from(optionsField!.optionsTable!)
        .select('id, name')
        .eq('is_active', true)
        .order('name')
      if (error) throw new Error(error.message)
      return (data ?? []) as { id: string; name: string }[]
    },
  })

  async function onPickImage(file?: File) {
    if (!file) return
    setFormError(null)
    setImageBusy(true)
    try {
      const compressed = await compressImage(file)
      const path = `${crypto.randomUUID()}.webp`
      const { error } = await supabase.storage
        .from('item-images')
        .upload(path, compressed, { upsert: true, contentType: 'image/webp' })
      if (error) throw error
      const { data } = supabase.storage.from('item-images').getPublicUrl(path)
      setValue('image_url', `${data.publicUrl}?t=${Date.now()}`, { shouldDirty: true })
    } catch (e) {
      setFormError((e as Error).message)
    } finally {
      setImageBusy(false)
    }
  }

  async function submit(values: Values) {
    setFormError(null)
    const cleaned: Values = { ...values }
    // Omit blank optional fields so NOT NULL columns fall back to their DB default
    // (e.g. items.unit defaults to 'kg') and nullable columns stay null.
    for (const f of config.fields) {
      if (
        (f.type === 'select' || f.type === 'text' || f.type === 'textarea') &&
        (cleaned[f.name] === '' || cleaned[f.name] == null)
      ) {
        delete cleaned[f.name]
      }
    }
    if (config.hasImage) {
      if (imageUrl) cleaned.image_url = imageUrl
      else delete cleaned.image_url
    }
    try {
      await onSaved(initial ? { id: initial.id, ...cleaned } : cleaned)
      onClose()
    } catch (e) {
      setFormError((e as Error).message)
    }
  }

  const inputClass =
    'w-full rounded-md border border-border px-3 py-2 outline-none focus:border-brand'

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4" noValidate>
      {config.fields.map((f) => (
        <div key={f.name} className="space-y-1">
          {f.type !== 'checkbox' && (
            <label htmlFor={f.name} className="block text-sm font-medium">
              {t(f.labelKey)}
            </label>
          )}
          {f.type === 'textarea' ? (
            <textarea id={f.name} className={inputClass} rows={3} {...register(f.name)} />
          ) : f.type === 'checkbox' ? (
            <label className="flex items-center gap-2 text-sm font-medium">
              <input id={f.name} type="checkbox" {...register(f.name)} />
              {t(f.labelKey)}
            </label>
          ) : f.type === 'select' ? (
            <select id={f.name} className={inputClass} {...register(f.name)}>
              <option value="">—</option>
              {(f.options
                ? f.options.map((o) => ({
                    value: o.value,
                    label: o.labelKey ? t(o.labelKey) : (o.label ?? ''),
                  }))
                : dynamicOptions.map((o) => ({ value: o.id, label: o.name }))
              ).map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          ) : (
            <input
              id={f.name}
              type={f.type === 'number' ? 'number' : 'text'}
              step={f.step}
              className={inputClass}
              {...register(f.name)}
            />
          )}
          {errors[f.name]?.message && (
            <p className="text-sm text-danger" role="alert">
              {t(String(errors[f.name]?.message))}
            </p>
          )}
        </div>
      ))}

      {config.hasImage && (
        <div className="space-y-1">
          <label htmlFor="image" className="block text-sm font-medium">
            {t('admin.items.fields.image')}
          </label>
          {imageUrl && (
            <img
              src={imageUrl}
              alt=""
              className="mb-2 h-20 w-20 rounded object-cover"
              data-testid="item-image-preview"
            />
          )}
          <input
            id="image"
            type="file"
            accept="image/*"
            onChange={(e) => void onPickImage(e.target.files?.[0])}
          />
          {imageBusy && <p className="text-sm text-muted">{t('admin.items.imageUploading')}</p>}
        </div>
      )}

      {formError && (
        <p className="text-sm text-danger" role="alert">
          {formError}
        </p>
      )}

      <div className="flex justify-end gap-2">
        <Button type="button" onClick={onClose} className="bg-muted">
          {t('common.cancel')}
        </Button>
        <Button type="submit" disabled={isSubmitting || imageBusy}>
          {t('common.save')}
        </Button>
      </div>
    </form>
  )
}
