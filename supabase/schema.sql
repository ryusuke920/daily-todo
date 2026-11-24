-- Supabase の SQL Editor に貼り付けて実行してください
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  date date not null,
  title text not null,
  time time,
  note text not null default '',
  done boolean not null default false,
  done_at timestamptz,
  list_order double precision not null default 0,
  time_order double precision not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists tasks_user_date_idx on public.tasks (user_id, date);

alter table public.tasks enable row level security;

drop policy if exists "own tasks" on public.tasks;
create policy "own tasks" on public.tasks
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ログインユーザーが API 経由でテーブルを操作できるように権限を付与（行の制限は上の RLS で行う）
grant select, insert, update, delete on public.tasks to authenticated;
