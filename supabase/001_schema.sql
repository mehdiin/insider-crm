-- ============================================================================
-- CRM Insider — Schema complet
-- Exécuter dans Supabase SQL Editor (Dashboard > SQL Editor > New Query)
-- ============================================================================

-- ── 1. PROFILES ─────────────────────────────────────────────────────────────

create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null unique,
  display_name text,
  role text not null default 'user' check (role in ('super_admin', 'admin', 'user')),
  avatar_url text,
  created_at timestamptz default now()
);

-- Trigger: auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, display_name, role)
  values (
    new.id,
    new.email,
    split_part(new.email, '@', 1),
    case when new.email = 'mehdi@insider.paris' then 'super_admin' else 'user' end
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── 2. ORGANIZATIONS (marques) ──────────────────────────────────────────────

create table if not exists public.organizations (
  id uuid default gen_random_uuid() primary key,
  owner_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  created_at timestamptz default now()
);

-- ── 3. TALENTS ──────────────────────────────────────────────────────────────

create table if not exists public.talents (
  id uuid default gen_random_uuid() primary key,
  owner_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  created_at timestamptz default now()
);

-- ── 4. TODO LISTS ───────────────────────────────────────────────────────────

create table if not exists public.todo_lists (
  id uuid default gen_random_uuid() primary key,
  owner_id uuid references public.profiles(id) on delete cascade not null,
  name text not null default 'Toutes les tâches',
  emoji text default '✅',
  created_at timestamptz default now()
);

-- ── 5. TODOS ────────────────────────────────────────────────────────────────

create table if not exists public.todos (
  id uuid default gen_random_uuid() primary key,
  list_id uuid references public.todo_lists(id) on delete cascade not null,
  parent_id uuid references public.todos(id) on delete cascade,
  text text not null default '',
  status text not null default 'pending' check (status in ('pending', 'in-progress', 'done')),
  priority text check (priority in ('high', 'medium', 'low')),
  due_date timestamptz,
  notes text,
  sort_order integer not null default 0,
  created_at timestamptz default now()
);

create index if not exists idx_todos_list_id on public.todos(list_id);
create index if not exists idx_todos_parent_id on public.todos(parent_id);

-- ── 6. TODO ↔ ORGANIZATIONS (M2M) ──────────────────────────────────────────

create table if not exists public.todo_organizations (
  todo_id uuid references public.todos(id) on delete cascade not null,
  organization_id uuid references public.organizations(id) on delete cascade not null,
  primary key (todo_id, organization_id)
);

-- ── 7. TODO ↔ TALENTS (M2M) ────────────────────────────────────────────────

create table if not exists public.todo_talents (
  todo_id uuid references public.todos(id) on delete cascade not null,
  talent_id uuid references public.talents(id) on delete cascade not null,
  primary key (todo_id, talent_id)
);

-- ── 8. TODO LIST SHARES ─────────────────────────────────────────────────────

create table if not exists public.todo_list_shares (
  id uuid default gen_random_uuid() primary key,
  list_id uuid references public.todo_lists(id) on delete cascade not null,
  shared_with_id uuid references public.profiles(id) on delete cascade not null,
  permission text not null default 'viewer' check (permission in ('editor', 'viewer')),
  created_at timestamptz default now(),
  unique(list_id, shared_with_id)
);

-- ── 9. BOARDS (Kanban) ─────────────────────────────────────────────────────

create table if not exists public.boards (
  id uuid default gen_random_uuid() primary key,
  owner_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  section text not null default 'projets',
  view_mode text,
  stage_order text[],
  created_at timestamptz default now()
);

-- ── 10. STAGES ──────────────────────────────────────────────────────────────

create table if not exists public.stages (
  id uuid default gen_random_uuid() primary key,
  board_id uuid references public.boards(id) on delete cascade not null,
  name text not null,
  sort_order integer not null default 0,
  created_at timestamptz default now()
);

-- ── 11. CARDS ───────────────────────────────────────────────────────────────

create table if not exists public.cards (
  id uuid default gen_random_uuid() primary key,
  board_id uuid references public.boards(id) on delete cascade not null,
  stage_id uuid references public.stages(id) on delete set null,
  title text not null default '',
  description text,
  organization_id uuid references public.organizations(id) on delete set null,
  sort_order integer not null default 0,
  created_at timestamptz default now()
);

-- ── 12. PROJECTS (préparé pour la phase future) ────────────────────────────

create table if not exists public.projects (
  id uuid default gen_random_uuid() primary key,
  owner_id uuid references public.profiles(id) on delete cascade not null,
  number integer not null,
  organization_id uuid references public.organizations(id) on delete set null,
  talent_id uuid references public.talents(id) on delete set null,
  name text not null default '',
  status text not null default 'brief' check (status in ('brief', 'script', 'preview', 'livrable', 'done')),
  budget_brand numeric,
  budget_talent numeric,
  margin numeric,
  promo_code text,
  share_token_brand text unique default encode(gen_random_bytes(24), 'hex'),
  share_token_talent text unique default encode(gen_random_bytes(24), 'hex'),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ── 13. PROJECT DOCUMENTS ───────────────────────────────────────────────────

create table if not exists public.project_documents (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  type text not null check (type in ('brief', 'script', 'preview_link', 'livrable', 'other')),
  uploaded_by text not null check (uploaded_by in ('brand', 'talent', 'admin')),
  file_url text not null,
  file_name text not null,
  status text not null default 'draft' check (status in ('draft', 'submitted', 'approved', 'rejected')),
  created_at timestamptz default now()
);

-- ── 14. PROJECT COMMENTS ────────────────────────────────────────────────────

create table if not exists public.project_comments (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  document_id uuid references public.project_documents(id) on delete cascade,
  author_type text not null check (author_type in ('brand', 'talent', 'admin')),
  author_name text not null,
  content text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================================
-- RLS (Row Level Security)
-- ============================================================================

-- Helper function: is super admin?
create or replace function public.is_super_admin()
returns boolean as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'super_admin'
  );
$$ language sql security definer stable;

-- ── PROFILES ────────────────────────────────────────────────────────────────
alter table public.profiles enable row level security;

create policy "Anyone authenticated can read profiles"
  on public.profiles for select
  using (auth.uid() is not null);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Super admin full access to profiles"
  on public.profiles for all
  using (public.is_super_admin());

-- ── ORGANIZATIONS ───────────────────────────────────────────────────────────
alter table public.organizations enable row level security;

create policy "Users manage own organizations"
  on public.organizations for all
  using (auth.uid() = owner_id);

create policy "Super admin full access to organizations"
  on public.organizations for all
  using (public.is_super_admin());

-- ── TALENTS ─────────────────────────────────────────────────────────────────
alter table public.talents enable row level security;

create policy "Users manage own talents"
  on public.talents for all
  using (auth.uid() = owner_id);

create policy "Super admin full access to talents"
  on public.talents for all
  using (public.is_super_admin());

-- ── TODO LISTS ──────────────────────────────────────────────────────────────
alter table public.todo_lists enable row level security;

create policy "Users manage own todo lists"
  on public.todo_lists for all
  using (auth.uid() = owner_id);

create policy "Shared users can read todo lists"
  on public.todo_lists for select
  using (
    exists (
      select 1 from public.todo_list_shares
      where todo_list_shares.list_id = todo_lists.id
      and todo_list_shares.shared_with_id = auth.uid()
    )
  );

create policy "Super admin full access to todo lists"
  on public.todo_lists for all
  using (public.is_super_admin());

-- ── TODOS ───────────────────────────────────────────────────────────────────
alter table public.todos enable row level security;

create policy "Users manage own todos"
  on public.todos for all
  using (
    exists (
      select 1 from public.todo_lists
      where todo_lists.id = todos.list_id
      and todo_lists.owner_id = auth.uid()
    )
  );

create policy "Shared users can read todos"
  on public.todos for select
  using (
    exists (
      select 1 from public.todo_list_shares
      join public.todo_lists on todo_lists.id = todo_list_shares.list_id
      where todo_lists.id = todos.list_id
      and todo_list_shares.shared_with_id = auth.uid()
    )
  );

create policy "Shared editors can modify todos"
  on public.todos for update
  using (
    exists (
      select 1 from public.todo_list_shares
      join public.todo_lists on todo_lists.id = todo_list_shares.list_id
      where todo_lists.id = todos.list_id
      and todo_list_shares.shared_with_id = auth.uid()
      and todo_list_shares.permission = 'editor'
    )
  );

create policy "Super admin full access to todos"
  on public.todos for all
  using (public.is_super_admin());

-- ── TODO_ORGANIZATIONS ──────────────────────────────────────────────────────
alter table public.todo_organizations enable row level security;

create policy "Users manage own todo_organizations"
  on public.todo_organizations for all
  using (
    exists (
      select 1 from public.todos
      join public.todo_lists on todo_lists.id = todos.list_id
      where todos.id = todo_organizations.todo_id
      and todo_lists.owner_id = auth.uid()
    )
  );

create policy "Super admin full access to todo_organizations"
  on public.todo_organizations for all
  using (public.is_super_admin());

-- ── TODO_TALENTS ────────────────────────────────────────────────────────────
alter table public.todo_talents enable row level security;

create policy "Users manage own todo_talents"
  on public.todo_talents for all
  using (
    exists (
      select 1 from public.todos
      join public.todo_lists on todo_lists.id = todos.list_id
      where todos.id = todo_talents.todo_id
      and todo_lists.owner_id = auth.uid()
    )
  );

create policy "Super admin full access to todo_talents"
  on public.todo_talents for all
  using (public.is_super_admin());

-- ── TODO LIST SHARES ────────────────────────────────────────────────────────
alter table public.todo_list_shares enable row level security;

create policy "List owners manage shares"
  on public.todo_list_shares for all
  using (
    exists (
      select 1 from public.todo_lists
      where todo_lists.id = todo_list_shares.list_id
      and todo_lists.owner_id = auth.uid()
    )
  );

create policy "Shared users can see their shares"
  on public.todo_list_shares for select
  using (auth.uid() = shared_with_id);

create policy "Super admin full access to shares"
  on public.todo_list_shares for all
  using (public.is_super_admin());

-- ── BOARDS ──────────────────────────────────────────────────────────────────
alter table public.boards enable row level security;

create policy "Users manage own boards"
  on public.boards for all
  using (auth.uid() = owner_id);

create policy "Super admin full access to boards"
  on public.boards for all
  using (public.is_super_admin());

-- ── STAGES ──────────────────────────────────────────────────────────────────
alter table public.stages enable row level security;

create policy "Users manage own stages"
  on public.stages for all
  using (
    exists (
      select 1 from public.boards
      where boards.id = stages.board_id
      and boards.owner_id = auth.uid()
    )
  );

create policy "Super admin full access to stages"
  on public.stages for all
  using (public.is_super_admin());

-- ── CARDS ───────────────────────────────────────────────────────────────────
alter table public.cards enable row level security;

create policy "Users manage own cards"
  on public.cards for all
  using (
    exists (
      select 1 from public.boards
      where boards.id = cards.board_id
      and boards.owner_id = auth.uid()
    )
  );

create policy "Super admin full access to cards"
  on public.cards for all
  using (public.is_super_admin());

-- ── PROJECTS ────────────────────────────────────────────────────────────────
alter table public.projects enable row level security;

create policy "Users manage own projects"
  on public.projects for all
  using (auth.uid() = owner_id);

create policy "Super admin full access to projects"
  on public.projects for all
  using (public.is_super_admin());

-- ── PROJECT DOCUMENTS ───────────────────────────────────────────────────────
alter table public.project_documents enable row level security;

create policy "Users manage own project documents"
  on public.project_documents for all
  using (
    exists (
      select 1 from public.projects
      where projects.id = project_documents.project_id
      and projects.owner_id = auth.uid()
    )
  );

create policy "Super admin full access to project documents"
  on public.project_documents for all
  using (public.is_super_admin());

-- ── PROJECT COMMENTS ────────────────────────────────────────────────────────
alter table public.project_comments enable row level security;

create policy "Users manage own project comments"
  on public.project_comments for all
  using (
    exists (
      select 1 from public.projects
      where projects.id = project_comments.project_id
      and projects.owner_id = auth.uid()
    )
  );

create policy "Super admin full access to project comments"
  on public.project_comments for all
  using (public.is_super_admin());

-- ============================================================================
-- Done! Now go to Authentication > Providers and enable Email provider.
-- Then sign up with mehdi@insider.paris to create the super_admin profile.
-- ============================================================================
