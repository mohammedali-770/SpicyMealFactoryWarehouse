-- Concern: set_purchase_order_status() — the guarded gate for PO transitions.
--   pending  -> approved   (manager of the kind)
--   approved -> received   (manager)  ── POSTS RECEIPTS INTO THE LEDGER ──
--   pending/approved -> cancelled (manager)
-- On receipt each line adds stock: warehouse POs post positive purchase_receipt rows into
-- stock_movements (item ledger), raw-material POs into raw_material_movements. Atomic with
-- the status change. SECURITY DEFINER; authorization self-enforced from the JWT.
create or replace function public.set_purchase_order_status(
  p_po_id  uuid,
  p_status text
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_role    text := public.jwt_role();
  v_actor   uuid := auth.uid();
  v_po      public.purchase_orders%rowtype;
  v_from    text;
  v_manages boolean;
begin
  if v_actor is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;

  select * into v_po from public.purchase_orders where id = p_po_id for update;
  if not found then
    raise exception 'Purchase order not found' using errcode = 'P0002';
  end if;
  v_from := v_po.status;

  if p_status not in ('draft', 'pending', 'approved', 'received', 'cancelled') then
    raise exception 'Unknown status: %', p_status using errcode = '22023';
  end if;
  if p_status = v_from then
    raise exception 'Purchase order is already %', p_status using errcode = '22023';
  end if;

  v_manages := (
    v_role in ('admin', 'general_manager')
    or (v_role = 'warehouse_manager' and v_po.kind = 'warehouse')
    or (v_role = 'factory_manager'   and v_po.kind = 'raw_material')
  );
  if not v_manages then
    raise exception 'Not permitted to change this purchase order' using errcode = '42501';
  end if;

  if not (
    (v_from = 'pending' and p_status = 'approved')
    or (v_from = 'approved' and p_status = 'received')
    or (p_status = 'cancelled' and v_from in ('pending', 'approved'))
  ) then
    raise exception 'Illegal transition % -> %', v_from, p_status using errcode = '22023';
  end if;

  if p_status = 'approved' then
    update public.purchase_orders set status = p_status, approved_at = now() where id = v_po.id;
  elsif p_status = 'received' then
    update public.purchase_orders set status = p_status, received_at = now() where id = v_po.id;

    -- Post receipts into the appropriate inventory ledger.
    if v_po.kind = 'warehouse' then
      insert into public.stock_movements
        (item_id, quantity, reason, purchase_order_id, created_by)
      select poi.item_id, poi.quantity, 'purchase_receipt', v_po.id, v_actor
      from public.purchase_order_items poi
      where poi.po_id = v_po.id;
    else
      insert into public.raw_material_movements
        (raw_material_id, quantity, reason, purchase_order_id, created_by)
      select poi.raw_material_id, poi.quantity, 'purchase_receipt', v_po.id, v_actor
      from public.purchase_order_items poi
      where poi.po_id = v_po.id;
    end if;
  else
    update public.purchase_orders set status = p_status where id = v_po.id;
  end if;

  return jsonb_build_object('id', v_po.id, 'status', p_status);
end;
$$;

revoke all on function public.set_purchase_order_status(uuid, text) from public;
grant execute on function public.set_purchase_order_status(uuid, text) to authenticated;
