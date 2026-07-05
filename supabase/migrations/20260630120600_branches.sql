-- Concern: branches (customer delivery/ordering locations).
create table if not exists public.branches (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  name_ar     text,
  is_active   boolean not null default true,
  -- internal_only branches are excluded from the customer order flow (later phase).
  internal_only boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

drop trigger if exists trg_branches_updated_at on public.branches;
create trigger trg_branches_updated_at
  before update on public.branches
  for each row execute function public.set_updated_at();

-- Now that branches exists, link profiles.branch_id (idempotent).
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'profiles_branch_id_fkey'
  ) then
    alter table public.profiles
      add constraint profiles_branch_id_fkey
      foreign key (branch_id) references public.branches (id) on delete set null;
  end if;
end
$$;
