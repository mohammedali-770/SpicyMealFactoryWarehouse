-- Concern: create_customer_order(): the server-authoritative order entry point.
-- A single customer cart is SPLIT into one order per item category (warehouse / factory),
-- each with its own generated order_number, atomically (one function = one transaction).
--
-- Why an RPC and not client INSERTs: order_items has NO customer INSERT policy, so lines
-- can only be written here. Names/serials are snapshotted onto the lines so soft-deleting
-- a catalog item never rewrites history. Prices are deliberately NOT captured yet — they
-- are frozen at approval by set_order_status (order_items.unit_price stays null → total 0).
--
-- Input p_items: jsonb array of { item_id: uuid, quantity: number, stock_level?: number }.
-- Admins may place on behalf of a customer via p_customer_id; customers only for themselves.
create or replace function public.create_customer_order(
  p_items       jsonb,
  p_branch_id   uuid default null,
  p_notes       text default null,
  p_customer_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_role     text := public.jwt_role();
  v_actor    uuid := auth.uid();
  v_customer uuid;
  v_matched  int;
  v_category text;
  v_order_id uuid;
  v_order_no text;
  v_orders   jsonb := '[]'::jsonb;
begin
  if v_actor is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;

  -- Resolve + authorize the customer the order is for.
  v_customer := coalesce(p_customer_id, v_actor);
  if v_role = 'admin' then
    null; -- admins may order on behalf of any customer
  elsif v_role = 'customer' then
    if v_customer <> v_actor then
      raise exception 'Customers may only create their own orders' using errcode = '42501';
    end if;
  else
    raise exception 'Only customers may place orders' using errcode = '42501';
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Order must contain at least one item' using errcode = '22023';
  end if;

  -- Branch (optional) must be a real, active, customer-facing branch.
  if p_branch_id is not null and not exists (
    select 1 from public.branches
    where id = p_branch_id and is_active and not internal_only
  ) then
    raise exception 'Invalid branch' using errcode = '22023';
  end if;

  -- Every referenced item must exist and be active (count the join back).
  select count(*) into v_matched
  from jsonb_array_elements(p_items) as line
  join public.items it
    on it.id = (line->>'item_id')::uuid and it.is_active;
  if v_matched <> jsonb_array_length(p_items) then
    raise exception 'One or more items are unavailable' using errcode = '22023';
  end if;

  -- Quantities must be positive (also guarded by the order_items CHECK).
  if exists (
    select 1 from jsonb_array_elements(p_items) as line
    where coalesce((line->>'quantity')::numeric, 0) <= 0
  ) then
    raise exception 'Quantities must be greater than zero' using errcode = '22023';
  end if;

  -- Every item needs a category to route it to a warehouse/factory order; an
  -- uncategorised item would otherwise be silently dropped from the split.
  if exists (
    select 1 from jsonb_array_elements(p_items) as line
    join public.items it on it.id = (line->>'item_id')::uuid and it.is_active
    where it.category is null
  ) then
    raise exception 'Items must have a category' using errcode = '22023';
  end if;

  -- One order per distinct category present in the cart.
  for v_category in
    select distinct it.category
    from jsonb_array_elements(p_items) as line
    join public.items it on it.id = (line->>'item_id')::uuid and it.is_active
    where it.category is not null
    order by 1
  loop
    v_order_no := public.next_order_number(v_category);

    insert into public.orders
      (order_number, customer_id, branch_id, status, category, notes, created_by)
    values
      (v_order_no, v_customer, p_branch_id, 'pending', v_category, p_notes, v_actor)
    returning id into v_order_id;

    insert into public.order_items
      (order_id, item_id, item_name, item_serial, quantity, stock_level)
    select
      v_order_id,
      it.id,
      it.name,
      it.sku,
      (line->>'quantity')::numeric,
      case when it.stock_level_required
           then nullif(line->>'stock_level', '')::numeric
           else null end
    from jsonb_array_elements(p_items) as line
    join public.items it on it.id = (line->>'item_id')::uuid and it.is_active
    where it.category = v_category;

    insert into public.order_history (order_id, from_status, to_status, note, changed_by)
    values (v_order_id, null, 'pending', p_notes, v_actor);

    v_orders := v_orders || jsonb_build_object(
      'id', v_order_id,
      'order_number', v_order_no,
      'category', v_category
    );
  end loop;

  return jsonb_build_object('orders', v_orders);
end;
$$;

revoke all on function public.create_customer_order(jsonb, uuid, text, uuid) from public;
grant execute on function public.create_customer_order(jsonb, uuid, text, uuid) to authenticated;
