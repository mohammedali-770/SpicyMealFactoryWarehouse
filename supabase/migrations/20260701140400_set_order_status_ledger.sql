-- Concern: extend set_order_status() (Phase 3) to post inventory ledger movements when a
-- WAREHOUSE order is completed — each line leaves stock as a negative order_fulfillment
-- movement, in the same transaction as the status change. Factory orders track a
-- customer-reported stock_level, not warehouse inventory, so they post nothing.
-- On-hand is allowed to go negative (backorder) until Phase 5 purchase-order receipts
-- replenish it; the UI surfaces negative balances.
--
-- Everything else (the transition matrix, price snapshot on approval) is unchanged from
-- 20260701130200_set_order_status.sql; this is a full create-or-replace so the ledger
-- posting is atomic with the transition.
create or replace function public.set_order_status(
  p_order_id uuid,
  p_status   text,
  p_note     text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_role    text := public.jwt_role();
  v_actor   uuid := auth.uid();
  v_order   public.orders%rowtype;
  v_from    text;
  v_manages boolean;
  v_owner   boolean;
  v_allowed boolean := false;
  v_total   numeric(14,2);
begin
  if v_actor is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;

  select * into v_order from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'Order not found' using errcode = 'P0002';
  end if;
  v_from := v_order.status;

  if p_status not in ('draft', 'pending', 'approved', 'completed', 'cancelled') then
    raise exception 'Unknown status: %', p_status using errcode = '22023';
  end if;
  if p_status = v_from then
    raise exception 'Order is already %', p_status using errcode = '22023';
  end if;

  v_owner := (v_order.customer_id = v_actor);
  v_manages := (
    v_role in ('admin', 'general_manager')
    or (v_role = 'warehouse_manager' and v_order.category = 'warehouse')
    or (v_role = 'factory_manager'   and v_order.category = 'factory')
  );

  if v_from = 'draft' and p_status = 'pending' then
    v_allowed := v_manages or (v_role = 'customer' and v_owner);
  elsif v_from = 'pending' and p_status = 'approved' then
    v_allowed := v_manages;
  elsif v_from = 'approved' and p_status = 'completed' then
    v_allowed := v_manages;
  elsif p_status = 'cancelled' and v_from in ('draft', 'pending') then
    v_allowed := v_manages or (v_role = 'customer' and v_owner);
  elsif p_status = 'cancelled' and v_from = 'approved' then
    v_allowed := v_manages;
  else
    raise exception 'Illegal transition % -> %', v_from, p_status using errcode = '22023';
  end if;

  if not v_allowed then
    raise exception 'Not permitted to change this order' using errcode = '42501';
  end if;

  if p_status = 'approved' then
    -- Freeze current catalog prices onto the lines; line_total regenerates.
    update public.order_items oi
      set unit_price = it.unit_price
      from public.items it
      where oi.item_id = it.id and oi.order_id = v_order.id;

    select coalesce(sum(line_total), 0) into v_total
      from public.order_items where order_id = v_order.id;

    update public.orders
      set status = p_status, total_amount = v_total, approved_at = now()
      where id = v_order.id;
  elsif p_status = 'completed' then
    update public.orders
      set status = p_status, completed_at = now()
      where id = v_order.id;

    -- Post the inventory ledger: warehouse fulfillment leaves stock.
    if v_order.category = 'warehouse' then
      insert into public.stock_movements (item_id, quantity, reason, order_id, created_by)
      select oi.item_id, -oi.quantity, 'order_fulfillment', v_order.id, v_actor
      from public.order_items oi
      where oi.order_id = v_order.id;
    end if;
  else
    update public.orders set status = p_status where id = v_order.id;
  end if;

  insert into public.order_history (order_id, from_status, to_status, note, changed_by)
  values (v_order.id, v_from, p_status, p_note, v_actor);

  select total_amount into v_total from public.orders where id = v_order.id;
  return jsonb_build_object('id', v_order.id, 'status', p_status, 'total_amount', v_total);
end;
$$;
