-- Concern: create_production_batch() — plan a batch (status 'pending') with its raw-material
-- inputs and warehouse-item outputs. No stock moves yet; set_batch_status posts the ledgers
-- at completion. SECURITY DEFINER; authorization self-enforced from the JWT
-- (admin / general_manager / factory_manager).
--
-- p_inputs:  jsonb array of { ref_id: uuid (raw_material), quantity: number }.
-- p_outputs: jsonb array of { ref_id: uuid (warehouse item), quantity: number }.
create or replace function public.create_production_batch(
  p_inputs  jsonb,
  p_outputs jsonb,
  p_notes   text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_role     text := public.jwt_role();
  v_actor    uuid := auth.uid();
  v_matched  int;
  v_batch_id uuid;
  v_batch_no text;
begin
  if v_actor is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;
  if v_role not in ('admin', 'general_manager', 'factory_manager') then
    raise exception 'Not permitted to run production' using errcode = '42501';
  end if;

  if p_inputs is null or jsonb_typeof(p_inputs) <> 'array' or jsonb_array_length(p_inputs) = 0 then
    raise exception 'A batch needs at least one raw-material input' using errcode = '22023';
  end if;
  if p_outputs is null or jsonb_typeof(p_outputs) <> 'array' or jsonb_array_length(p_outputs) = 0 then
    raise exception 'A batch needs at least one output item' using errcode = '22023';
  end if;
  if exists (
    select 1 from jsonb_array_elements(p_inputs || p_outputs) as line
    where coalesce((line->>'quantity')::numeric, 0) <= 0
  ) then
    raise exception 'Quantities must be greater than zero' using errcode = '22023';
  end if;

  -- Inputs must be active raw materials; outputs must be active warehouse items.
  select count(*) into v_matched
  from jsonb_array_elements(p_inputs) as line
  join public.raw_materials rm on rm.id = (line->>'ref_id')::uuid and rm.is_active;
  if v_matched <> jsonb_array_length(p_inputs) then
    raise exception 'One or more raw materials are unavailable' using errcode = '22023';
  end if;

  select count(*) into v_matched
  from jsonb_array_elements(p_outputs) as line
  join public.items it on it.id = (line->>'ref_id')::uuid and it.is_active
    and it.category = 'warehouse';
  if v_matched <> jsonb_array_length(p_outputs) then
    raise exception 'One or more output items are unavailable' using errcode = '22023';
  end if;

  v_batch_no := public.next_batch_number();
  insert into public.production_batches (batch_number, status, notes, created_by)
  values (v_batch_no, 'pending', p_notes, v_actor)
  returning id into v_batch_id;

  insert into public.batch_inputs (batch_id, raw_material_id, line_name, quantity)
  select v_batch_id, rm.id, rm.name, (line->>'quantity')::numeric
  from jsonb_array_elements(p_inputs) as line
  join public.raw_materials rm on rm.id = (line->>'ref_id')::uuid and rm.is_active;

  insert into public.batch_outputs (batch_id, item_id, line_name, quantity)
  select v_batch_id, it.id, it.name, (line->>'quantity')::numeric
  from jsonb_array_elements(p_outputs) as line
  join public.items it on it.id = (line->>'ref_id')::uuid and it.is_active;

  return jsonb_build_object('id', v_batch_id, 'batch_number', v_batch_no);
end;
$$;

revoke all on function public.create_production_batch(jsonb, jsonb, text) from public;
grant execute on function public.create_production_batch(jsonb, jsonb, text) to authenticated;
