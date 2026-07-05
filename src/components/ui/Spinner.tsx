export function Spinner() {
  return (
    <div role="status" aria-live="polite" className="inline-flex items-center">
      <span className="h-6 w-6 animate-spin rounded-full border-2 border-muted border-t-brand" />
      <span className="sr-only">Loading…</span>
    </div>
  )
}

export function FullScreenSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface">
      <Spinner />
    </div>
  )
}
