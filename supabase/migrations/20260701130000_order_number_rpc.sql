-- Concern: atomic per-day order-number generator (customer orders).
-- WORD- = warehouse order, FORD- = factory order. The sequence is scoped by
-- (business_date, prefix) in daily_counters; the ON CONFLICT ... DO UPDATE takes a
-- row lock, so concurrent callers get distinct, gap-free numbers per day. The unique
-- constraint on orders.order_number is a backstop. Business day = Asia/Riyadh (UTC+3).
--
-- SECURITY DEFINER + a pinned search_path: this is an internal helper only ever called
-- from the ordering RPCs (which own it), so EXECUTE is NOT granted to clients.
create or replace function public.next_order_number(p_category text)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_prefix text;
  v_date   date := (now() at time zone 'Asia/Riyadh')::date;
  v_seq    bigint;
begin
  v_prefix := case p_category
    when 'warehouse' then 'WORD'
    when 'factory'   then 'FORD'
    else null
  end;
  if v_prefix is null then
    raise exception 'Unknown order category: %', p_category using errcode = '22023';
  end if;

  insert into public.daily_counters (business_date, scope, last_value)
    values (v_date, v_prefix, 1)
  on conflict (business_date, scope)
    do update set last_value = public.daily_counters.last_value + 1
  returning last_value into v_seq;

  return v_prefix || '-' || to_char(v_date, 'YYYYMMDD') || '-' || lpad(v_seq::text, 3, '0');
end;
$$;

revoke all on function public.next_order_number(text) from public;
