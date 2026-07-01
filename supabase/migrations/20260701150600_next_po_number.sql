-- Concern: atomic per-day purchase-order number generator. WPO- = warehouse PO,
-- RPO- = raw-material PO. Same daily_counters row-lock scheme as next_order_number.
-- Internal helper (called only by create_purchase_order); not granted to clients.
create or replace function public.next_po_number(p_kind text)
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
  v_prefix := case p_kind
    when 'warehouse'    then 'WPO'
    when 'raw_material' then 'RPO'
    else null
  end;
  if v_prefix is null then
    raise exception 'Unknown purchase-order kind: %', p_kind using errcode = '22023';
  end if;

  insert into public.daily_counters (business_date, scope, last_value)
    values (v_date, v_prefix, 1)
  on conflict (business_date, scope)
    do update set last_value = public.daily_counters.last_value + 1
  returning last_value into v_seq;

  return v_prefix || '-' || to_char(v_date, 'YYYYMMDD') || '-' || lpad(v_seq::text, 3, '0');
end;
$$;

revoke all on function public.next_po_number(text) from public;
