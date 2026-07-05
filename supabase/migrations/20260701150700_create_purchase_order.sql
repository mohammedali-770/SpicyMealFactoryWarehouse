-- Concern: create_purchase_order() — server-authoritative PO entry. Builds one PO (status
-- 'pending') with its lines for a supplier. Line refs resolve against items (warehouse) or
-- raw_materials (raw_material) per kind; names/serials are snapshotted and unit_price is the
-- purchase cost (caller-supplied, else defaulted from the master). total_amount is set now.
--
-- Authorization (self-enforced from the JWT): admin/general_manager for either kind,
-- warehouse_manager for warehouse POs, factory_manager for raw-material POs.
--
-- p_items: jsonb array of { ref_id: uuid, quantity: number, unit_price?: number }.
create or replace function public.create_purchase_order(
  p_kind        text,
  p_supplier_id uuid,
  p_items       jsonb,
  p_notes       text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_role    text := public.jwt_role();
  v_actor   uuid := auth.uid();
  v_manages boolean;
  v_matched int;
  v_po_id   uuid;
  v_po_no   text;
  v_total   numeric(14,2);
begin
  if v_actor is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;
  if p_kind not in ('warehouse', 'raw_material') then
    raise exception 'Unknown purchase-order kind: %', p_kind using errcode = '22023';
  end if;

  v_manages := (
    v_role in ('admin', 'general_manager')
    or (v_role = 'warehouse_manager' and p_kind = 'warehouse')
    or (v_role = 'factory_manager'   and p_kind = 'raw_material')
  );
  if not v_manages then
    raise exception 'Not permitted to create this purchase order' using errcode = '42501';
  end if;

  if not exists (select 1 from public.suppliers where id = p_supplier_id and is_active) then
    raise exception 'Invalid supplier' using errcode = '22023';
  end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Purchase order must contain at least one item' using errcode = '22023';
  end if;
  if exists (
    select 1 from jsonb_array_elements(p_items) as line
    where coalesce((line->>'quantity')::numeric, 0) <= 0
  ) then
    raise exception 'Quantities must be greater than zero' using errcode = '22023';
  end if;

  -- Every referenced master row must exist and be active (count the join back).
  if p_kind = 'warehouse' then
    select count(*) into v_matched
    from jsonb_array_elements(p_items) as line
    join public.items it on it.id = (line->>'ref_id')::uuid and it.is_active
      and it.category = 'warehouse';
  else
    select count(*) into v_matched
    from jsonb_array_elements(p_items) as line
    join public.raw_materials rm on rm.id = (line->>'ref_id')::uuid and rm.is_active;
  end if;
  if v_matched <> jsonb_array_length(p_items) then
    raise exception 'One or more items are unavailable' using errcode = '22023';
  end if;

  v_po_no := public.next_po_number(p_kind);
  insert into public.purchase_orders (po_number, kind, supplier_id, status, notes, created_by)
  values (v_po_no, p_kind, p_supplier_id, 'pending', p_notes, v_actor)
  returning id into v_po_id;

  if p_kind = 'warehouse' then
    insert into public.purchase_order_items
      (po_id, item_id, line_name, line_serial, quantity, unit_price)
    select
      v_po_id, it.id, it.name, it.sku,
      (line->>'quantity')::numeric,
      coalesce(nullif(line->>'unit_price', '')::numeric, it.unit_price)
    from jsonb_array_elements(p_items) as line
    join public.items it on it.id = (line->>'ref_id')::uuid and it.is_active;
  else
    insert into public.purchase_order_items
      (po_id, raw_material_id, line_name, line_serial, quantity, unit_price)
    select
      v_po_id, rm.id, rm.name, null,
      (line->>'quantity')::numeric,
      coalesce(nullif(line->>'unit_price', '')::numeric, rm.unit_price)
    from jsonb_array_elements(p_items) as line
    join public.raw_materials rm on rm.id = (line->>'ref_id')::uuid and rm.is_active;
  end if;

  select coalesce(sum(line_total), 0) into v_total
    from public.purchase_order_items where po_id = v_po_id;
  update public.purchase_orders set total_amount = v_total where id = v_po_id;

  return jsonb_build_object('id', v_po_id, 'po_number', v_po_no, 'total_amount', v_total);
end;
$$;

revoke all on function public.create_purchase_order(text, uuid, jsonb, text) from public;
grant execute on function public.create_purchase_order(text, uuid, jsonb, text) to authenticated;
