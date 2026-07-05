-- Concern: set_batch_status() — the guarded gate for production batch transitions.
--   pending      -> in_progress (start)
--   in_progress  -> completed   ── POSTS THE LEDGERS ──
--   pending/in_progress -> cancelled
-- Completing a batch atomically consumes its inputs (negative raw_material_movements) and
-- produces its outputs (positive stock_movements), each linked to the batch. On-hand may go
-- negative (over-consumption), consistent with the rest of the ledger. SECURITY DEFINER;
-- authorization self-enforced from the JWT (admin / general_manager / factory_manager).
create or replace function public.set_batch_status(
  p_batch_id uuid,
  p_status   text
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_role  text := public.jwt_role();
  v_actor uuid := auth.uid();
  v_batch public.production_batches%rowtype;
  v_from  text;
begin
  if v_actor is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;
  if v_role not in ('admin', 'general_manager', 'factory_manager') then
    raise exception 'Not permitted to run production' using errcode = '42501';
  end if;

  select * into v_batch from public.production_batches where id = p_batch_id for update;
  if not found then
    raise exception 'Batch not found' using errcode = 'P0002';
  end if;
  v_from := v_batch.status;

  if p_status not in ('pending', 'in_progress', 'completed', 'cancelled') then
    raise exception 'Unknown status: %', p_status using errcode = '22023';
  end if;
  if p_status = v_from then
    raise exception 'Batch is already %', p_status using errcode = '22023';
  end if;
  if not (
    (v_from = 'pending' and p_status = 'in_progress')
    or (v_from = 'in_progress' and p_status = 'completed')
    or (p_status = 'cancelled' and v_from in ('pending', 'in_progress'))
  ) then
    raise exception 'Illegal transition % -> %', v_from, p_status using errcode = '22023';
  end if;

  if p_status = 'in_progress' then
    update public.production_batches set status = p_status, started_at = now() where id = v_batch.id;
  elsif p_status = 'completed' then
    update public.production_batches set status = p_status, completed_at = now() where id = v_batch.id;

    -- Consume raw-material inputs.
    insert into public.raw_material_movements
      (raw_material_id, quantity, reason, production_batch_id, created_by)
    select bi.raw_material_id, -bi.quantity, 'consumption', v_batch.id, v_actor
    from public.batch_inputs bi
    where bi.batch_id = v_batch.id;

    -- Produce warehouse-item outputs.
    insert into public.stock_movements
      (item_id, quantity, reason, production_batch_id, created_by)
    select bo.item_id, bo.quantity, 'production', v_batch.id, v_actor
    from public.batch_outputs bo
    where bo.batch_id = v_batch.id;
  else
    update public.production_batches set status = p_status where id = v_batch.id;
  end if;

  return jsonb_build_object('id', v_batch.id, 'status', p_status);
end;
$$;

revoke all on function public.set_batch_status(uuid, text) from public;
grant execute on function public.set_batch_status(uuid, text) to authenticated;
