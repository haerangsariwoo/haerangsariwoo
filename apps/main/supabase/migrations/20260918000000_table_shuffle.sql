-- 관리자 > 팀짜기 > 테이블 섞기
-- 운영진이 함께 보는 자리 배치 한 벌. 사람을 빼거나 전체 비우기를 하면 행이 실제로 지워진다.
-- 적용: Supabase 대시보드 > SQL Editor 에서 한 번 실행한다. (개발 DB에서 먼저 확인 권장)

create table if not exists public.table_shuffle_settings (
  id smallint primary key default 1 check (id = 1),
  table_count smallint not null default 4 check (table_count between 1 and 30),
  even_sizes boolean not null default true,
  updated_at timestamptz not null default now()
);

insert into public.table_shuffle_settings (id) values (1) on conflict (id) do nothing;

create table if not exists public.table_shuffle_seats (
  id uuid primary key default gen_random_uuid(),
  table_number smallint not null check (table_number between 1 and 30),
  seat_order smallint not null default 0,
  name text not null default '' check (char_length(name) <= 40),
  gender text not null default '남' check (gender in ('남', '여')),
  is_staff boolean not null default false,
  updated_at timestamptz not null default now()
);

create index if not exists table_shuffle_seats_table_idx
  on public.table_shuffle_seats (table_number, seat_order);

-- 운영진·관리자(승인된 회원)만 읽고 쓴다
create or replace function public.is_table_shuffle_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.members m
    where m.id = auth.uid()
      and m.status = 'approved'
      and m.role in ('운영진', '관리자')
  );
$$;

revoke all on function public.is_table_shuffle_staff() from public, anon;
grant execute on function public.is_table_shuffle_staff() to authenticated;

alter table public.table_shuffle_settings enable row level security;
alter table public.table_shuffle_seats enable row level security;

revoke all on public.table_shuffle_settings from anon;
revoke all on public.table_shuffle_seats from anon;
grant select, insert, update on public.table_shuffle_settings to authenticated;
grant select, insert, update, delete on public.table_shuffle_seats to authenticated;

drop policy if exists "staff manage table shuffle settings" on public.table_shuffle_settings;
create policy "staff manage table shuffle settings" on public.table_shuffle_settings
  for all to authenticated
  using (public.is_table_shuffle_staff())
  with check (public.is_table_shuffle_staff());

drop policy if exists "staff manage table shuffle seats" on public.table_shuffle_seats;
create policy "staff manage table shuffle seats" on public.table_shuffle_seats
  for all to authenticated
  using (public.is_table_shuffle_staff())
  with check (public.is_table_shuffle_staff());
