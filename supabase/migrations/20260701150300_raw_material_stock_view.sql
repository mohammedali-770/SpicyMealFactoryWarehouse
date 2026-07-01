-- Concern: on-hand quantity per raw material = running sum of its ledger movements.
-- security_invoker so the caller's RLS on raw_materials/raw_material_movements applies.
create or replace view public.raw_material_stock
  with (security_invoker = true) as
select
  rm.id                                    as raw_material_id,
  rm.name,
  rm.name_ar,
  rm.unit,
  coalesce(sum(m.quantity), 0)::numeric(14,3) as on_hand
from public.raw_materials rm
left join public.raw_material_movements m on m.raw_material_id = rm.id
group by rm.id;

grant select on public.raw_material_stock to authenticated;
