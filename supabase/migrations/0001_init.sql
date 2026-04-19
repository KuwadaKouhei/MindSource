-- MindSource initial schema
-- Run via Supabase SQL editor or `supabase db push`.

-- profiles (1:1 with auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz default now()
);

-- mindmaps
create table if not exists public.mindmaps (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'Untitled',
  root_word text,
  snapshot jsonb not null default '{"nodes":[],"edges":[],"viewport":null}'::jsonb,
  settings_override jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists mindmaps_owner_updated_idx
  on public.mindmaps(owner_id, updated_at desc);

-- collaborators (v2 — editor/viewer split)
create table if not exists public.mindmap_collaborators (
  mindmap_id uuid references public.mindmaps(id) on delete cascade,
  user_id    uuid references auth.users(id) on delete cascade,
  role text check (role in ('viewer','editor')) default 'editor',
  primary key (mindmap_id, user_id)
);

-- user_settings (1 row per user)
create table if not exists public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  depth int default 2,
  top_k int default 8,
  min_score double precision default 0.5,
  pos text[] default array['名詞'],
  use_stopwords boolean default true,
  exclude text[] default array[]::text[],
  auto_mode text check (auto_mode in ('cascade','expand')) default 'expand',
  layout text check (layout in ('radial','hierarchical','generation')) default 'radial',
  color_scheme text default 'default',
  max_nodes int default 200,
  updated_at timestamptz default now()
);

-- updated_at trigger for mindmaps
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end$$;

drop trigger if exists mindmaps_touch_updated on public.mindmaps;
create trigger mindmaps_touch_updated
  before update on public.mindmaps
  for each row execute procedure public.touch_updated_at();

drop trigger if exists settings_touch_updated on public.user_settings;
create trigger settings_touch_updated
  before update on public.user_settings
  for each row execute procedure public.touch_updated_at();

-- profile auto-create on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)));
  insert into public.user_settings (user_id) values (new.id);
  return new;
end$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- RLS
alter table public.profiles enable row level security;
alter table public.mindmaps enable row level security;
alter table public.mindmap_collaborators enable row level security;
alter table public.user_settings enable row level security;

-- profiles
drop policy if exists profiles_self_read on public.profiles;
create policy profiles_self_read on public.profiles
  for select using (auth.uid() = id);
drop policy if exists profiles_self_write on public.profiles;
create policy profiles_self_write on public.profiles
  for update using (auth.uid() = id);

-- mindmaps
drop policy if exists mindmaps_owner_all on public.mindmaps;
create policy mindmaps_owner_all on public.mindmaps
  for all using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

drop policy if exists mindmaps_collab_read on public.mindmaps;
create policy mindmaps_collab_read on public.mindmaps
  for select using (
    exists (
      select 1 from public.mindmap_collaborators c
      where c.mindmap_id = id and c.user_id = auth.uid()
    )
  );

drop policy if exists mindmaps_collab_update on public.mindmaps;
create policy mindmaps_collab_update on public.mindmaps
  for update using (
    exists (
      select 1 from public.mindmap_collaborators c
      where c.mindmap_id = id and c.user_id = auth.uid() and c.role = 'editor'
    )
  );

-- collaborators
drop policy if exists collab_owner_all on public.mindmap_collaborators;
create policy collab_owner_all on public.mindmap_collaborators
  for all using (
    exists (select 1 from public.mindmaps m where m.id = mindmap_id and m.owner_id = auth.uid())
  );

drop policy if exists collab_self_read on public.mindmap_collaborators;
create policy collab_self_read on public.mindmap_collaborators
  for select using (user_id = auth.uid());

-- user_settings
drop policy if exists settings_self_all on public.user_settings;
create policy settings_self_all on public.user_settings
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
