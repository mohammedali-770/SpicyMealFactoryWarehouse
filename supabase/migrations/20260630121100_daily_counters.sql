-- Concern: per-day sequence counters consumed atomically by number generators.
-- The atomic-increment RPC (WORD-/FORD-/WPO-/RPO-/BATCH-) is added in a later phase;
-- this migration only establishes the table.
create table if not exists public.daily_counters (
  business_date date   not null,
  scope         text   not null default 'order',
  last_value    bigint not null default 0,
  updated_at    timestamptz not null default now(),
  primary key (business_date, scope)
);

drop trigger if exists trg_daily_counters_updated_at on public.daily_counters;
create trigger trg_daily_counters_updated_at
  before update on public.daily_counters
  for each row execute function public.set_updated_at();
