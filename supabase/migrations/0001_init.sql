-- =====================================================================
-- VALO SET : 初期スキーマ
-- 設計: docs/spec.md §3
-- Supabase SQL Editor で実行、または `supabase db push` で適用
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- 共通: updated_at 自動更新
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- ユーザー / 管理者
-- ---------------------------------------------------------------------
create table public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url   text,
  created_at   timestamptz not null default now()
);

create table public.admins (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- サインアップ時に profiles を自動作成
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', new.email),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 管理者判定（RLS から利用。security definer で admins の RLS を迂回）
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

grant execute on function public.is_admin() to anon, authenticated;

-- ---------------------------------------------------------------------
-- マスタ
-- ---------------------------------------------------------------------
create table public.maps (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,
  name_ja      text not null,
  name_en      text not null,
  minimap_path text not null,
  splash_path  text not null,
  sort_order   int  not null default 0,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now()
);

create table public.sites (
  id         uuid primary key default gen_random_uuid(),
  map_id     uuid not null references public.maps(id) on delete cascade,
  code       text not null check (code ~ '^[A-Z]$'),
  sort_order int  not null default 0,
  unique (map_id, code)
);

create table public.characters (
  id         uuid primary key default gen_random_uuid(),
  slug       text not null unique,
  name_ja    text not null,
  name_en    text not null,
  role       text not null,
  icon_path  text not null,
  sort_order int  not null default 0,
  is_active  boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.skills (
  id           uuid primary key default gen_random_uuid(),
  character_id uuid not null references public.characters(id) on delete cascade,
  slot         text not null check (slot in ('C', 'Q', 'E', 'X')),
  name_ja      text not null,
  name_en      text not null,
  unique (character_id, slot)
);

create table public.purposes (
  id         uuid primary key default gen_random_uuid(),
  slug       text not null unique,
  name_ja    text not null,
  sort_order int  not null default 0
);

-- ---------------------------------------------------------------------
-- 定点
-- ---------------------------------------------------------------------
create table public.lineups (
  id           uuid primary key default gen_random_uuid(),
  title        text check (title is null or char_length(title) between 1 and 80),
  map_id       uuid not null references public.maps(id),
  character_id uuid not null references public.characters(id),
  side         text not null check (side in ('attack', 'defense')),
  site_id      uuid not null references public.sites(id),
  skill_id     uuid not null references public.skills(id),
  -- 正規化座標 (0.0 ~ 1.0, 左上原点)
  start_x      numeric(6,5) not null check (start_x between 0 and 1),
  start_y      numeric(6,5) not null check (start_y between 0 and 1),
  land_x       numeric(6,5) not null check (land_x between 0 and 1),
  land_y       numeric(6,5) not null check (land_y between 0 and 1),
  aim_note     text check (aim_note is null or char_length(aim_note) <= 200),
  -- draft: メディア未登録 / published: 公開。将来 pending / rejected を追加予定
  status       text not null default 'draft' check (status in ('draft', 'published')),
  created_by   uuid references auth.users(id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  deleted_at   timestamptz
);

create index lineups_search_idx
  on public.lineups (map_id, character_id, side, site_id, created_at desc)
  where deleted_at is null;

create trigger lineups_updated_at
  before update on public.lineups
  for each row execute function public.set_updated_at();

-- site が map に、skill が character に属することを保証
create or replace function public.check_lineup_integrity()
returns trigger language plpgsql as $$
begin
  if not exists (select 1 from public.sites where id = new.site_id and map_id = new.map_id) then
    raise exception 'site % does not belong to map %', new.site_id, new.map_id;
  end if;
  if not exists (select 1 from public.skills where id = new.skill_id and character_id = new.character_id) then
    raise exception 'skill % does not belong to character %', new.skill_id, new.character_id;
  end if;
  return new;
end;
$$;

create trigger lineups_integrity
  before insert or update on public.lineups
  for each row execute function public.check_lineup_integrity();

create table public.lineup_purposes (
  lineup_id  uuid not null references public.lineups(id) on delete cascade,
  purpose_id uuid not null references public.purposes(id) on delete cascade,
  primary key (lineup_id, purpose_id)
);

create index lineup_purposes_purpose_idx on public.lineup_purposes (purpose_id);

create table public.lineup_media (
  id           uuid primary key default gen_random_uuid(),
  lineup_id    uuid not null references public.lineups(id) on delete cascade,
  kind         text not null check (kind in ('video', 'image')),
  role         text not null default 'execution' check (role in ('execution', 'aim', 'other')),
  storage_path text not null unique,
  mime_type    text not null,
  size_bytes   bigint not null check (size_bytes > 0),
  sort_order   int not null default 0,
  created_at   timestamptz not null default now(),
  check (
    (kind = 'video' and mime_type in ('video/mp4', 'video/webm') and size_bytes <= 52428800) or
    (kind = 'image' and mime_type in ('image/png', 'image/jpeg', 'image/webp') and size_bytes <= 5242880)
  )
);

create index lineup_media_lineup_idx on public.lineup_media (lineup_id, sort_order);

-- ---------------------------------------------------------------------
-- お気に入り
-- ---------------------------------------------------------------------
create table public.favorites (
  user_id    uuid not null references auth.users(id) on delete cascade,
  lineup_id  uuid not null references public.lineups(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, lineup_id)
);

create index favorites_user_idx on public.favorites (user_id, created_at desc);

-- =====================================================================
-- Row Level Security
-- =====================================================================
alter table public.profiles        enable row level security;
alter table public.admins          enable row level security;
alter table public.maps            enable row level security;
alter table public.sites           enable row level security;
alter table public.characters      enable row level security;
alter table public.skills          enable row level security;
alter table public.purposes        enable row level security;
alter table public.lineups         enable row level security;
alter table public.lineup_purposes enable row level security;
alter table public.lineup_media    enable row level security;
alter table public.favorites       enable row level security;

-- profiles: 本人のみ
create policy "profiles: self select" on public.profiles
  for select using (id = auth.uid());
create policy "profiles: self update" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- admins: 本人レコードのみ参照可。書込はSQLのみ（ポリシーなし）
create policy "admins: self select" on public.admins
  for select using (user_id = auth.uid());

-- マスタ: 全員参照 / 管理者のみ書込
do $$
declare t text;
begin
  foreach t in array array['maps', 'sites', 'characters', 'skills', 'purposes'] loop
    execute format('create policy "%1$s: public read" on public.%1$I for select using (true)', t);
    execute format('create policy "%1$s: admin write" on public.%1$I for all using (public.is_admin()) with check (public.is_admin())', t);
  end loop;
end $$;

-- lineups
create policy "lineups: public read published" on public.lineups
  for select using (deleted_at is null and status = 'published');
create policy "lineups: admin read all" on public.lineups
  for select using (public.is_admin());
create policy "lineups: admin insert" on public.lineups
  for insert with check (public.is_admin());
create policy "lineups: admin update" on public.lineups
  for update using (public.is_admin()) with check (public.is_admin());
-- 物理削除は運用上行わない（論理削除）。必要時はSQLで実施。

-- lineup_purposes / lineup_media: 親 lineup が見えれば参照可
create policy "lineup_purposes: read via lineup" on public.lineup_purposes
  for select using (exists (select 1 from public.lineups l where l.id = lineup_id));
create policy "lineup_purposes: admin write" on public.lineup_purposes
  for all using (public.is_admin()) with check (public.is_admin());

create policy "lineup_media: read via lineup" on public.lineup_media
  for select using (exists (select 1 from public.lineups l where l.id = lineup_id));
create policy "lineup_media: admin write" on public.lineup_media
  for all using (public.is_admin()) with check (public.is_admin());

-- favorites: 本人のみ
create policy "favorites: self select" on public.favorites
  for select using (user_id = auth.uid());
create policy "favorites: self insert" on public.favorites
  for insert with check (user_id = auth.uid());
create policy "favorites: self delete" on public.favorites
  for delete using (user_id = auth.uid());

-- =====================================================================
-- Storage: lineup-media バケット
-- =====================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'lineup-media', 'lineup-media', true, 52428800,
  array['video/mp4', 'video/webm', 'image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "lineup-media: public read" on storage.objects
  for select using (bucket_id = 'lineup-media');
create policy "lineup-media: admin insert" on storage.objects
  for insert to authenticated with check (bucket_id = 'lineup-media' and public.is_admin());
create policy "lineup-media: admin update" on storage.objects
  for update to authenticated using (bucket_id = 'lineup-media' and public.is_admin());
create policy "lineup-media: admin delete" on storage.objects
  for delete to authenticated using (bucket_id = 'lineup-media' and public.is_admin());
