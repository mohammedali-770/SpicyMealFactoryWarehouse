-- Concern: base table privileges for the PostgREST roles so RLS (not a missing GRANT)
-- is the actual access gate. Idempotent; Supabase grants some of these already.
grant usage on schema public to authenticated, anon;

grant select, insert, update, delete on
  public.profiles,
  public.branches,
  public.items,
  public.orders,
  public.order_items,
  public.order_history,
  public.daily_counters
to authenticated;

-- anon may read the public catalog only.
grant select on public.branches, public.items to anon;
