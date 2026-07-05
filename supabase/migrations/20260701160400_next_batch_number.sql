-- Concern: atomic per-day production-batch number generator (BATCH-). Same daily_counters
-- row-lock scheme as the order/PO number generators. Internal helper; not granted to clients.
create or replace function public.next_batch_number()
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_date date := (now() at time zone 'Asia/Riyadh')::date;
  v_seq  bigint;
begin
  insert into public.daily_counters (business_date, scope, last_value)
    values (v_date, 'BATCH', 1)
  on conflict (business_date, scope)
    do update set last_value = public.daily_counters.last_value + 1
  returning last_value into v_seq;

  return 'BATCH-' || to_char(v_date, 'YYYYMMDD') || '-' || lpad(v_seq::text, 3, '0');
end;
$$;

revoke all on function public.next_batch_number() from public;
