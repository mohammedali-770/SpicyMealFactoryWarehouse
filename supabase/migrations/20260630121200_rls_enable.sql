-- Concern: enable Row Level Security on every table (deny-by-default).
-- service_role still bypasses RLS for trusted server-side RPCs.
alter table public.profiles       enable row level security;
alter table public.branches       enable row level security;
alter table public.items          enable row level security;
alter table public.orders         enable row level security;
alter table public.order_items    enable row level security;
alter table public.order_history  enable row level security;
alter table public.daily_counters enable row level security;
