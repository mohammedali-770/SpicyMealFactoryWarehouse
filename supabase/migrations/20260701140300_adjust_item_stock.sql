-- Concern: adjust_item_stock() — the manual entry point into the inventory ledger.
-- Records a SIGNED adjustment (initial load, stock count, damage, correction) for a
-- warehouse item. SECURITY DEFINER; authorization is self-enforced from the JWT.
-- Only admin / general_manager / warehouse_manager may adjust stock.
create or replace function public.adjust_item_stock(
  p_item_id  uuid,
  p_quantity numeric,
  p_note     text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_role   text := public.jwt_role();
  v_actor  uuid := auth.uid();
  v_on_hand numeric(14,3);
begin
  if v_actor is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;
  if v_role not in ('admin', 'general_manager', 'warehouse_manager') then
    raise exception 'Not permitted to adjust stock' using errcode = '42501';
  end if;
  if p_quantity is null or p_quantity = 0 then
    raise exception 'Adjustment quantity must be non-zero' using errcode = '22023';
  end if;
  if not exists (
    select 1 from public.items where id = p_item_id and category = 'warehouse'
  ) then
    raise exception 'Stock is tracked for warehouse items only' using errcode = '22023';
  end if;

  insert into public.stock_movements (item_id, quantity, reason, note, created_by)
  values (p_item_id, p_quantity, 'adjustment', p_note, v_actor);

  select coalesce(sum(quantity), 0) into v_on_hand
    from public.stock_movements where item_id = p_item_id;

  return jsonb_build_object('item_id', p_item_id, 'on_hand', v_on_hand);
end;
$$;

revoke all on function public.adjust_item_stock(uuid, numeric, text) from public;
grant execute on function public.adjust_item_stock(uuid, numeric, text) to authenticated;
