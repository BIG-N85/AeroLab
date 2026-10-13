-- AeroLab schema and row-level security policies. Safe to run repeatedly in a new Supabase project.
-- This project uses only the browser-safe anon/publishable key; never use service_role in the site.

create table if not exists public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    full_name text,
    grade_level text,
    created_at timestamptz not null default now()
);

create table if not exists public.projects (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    title text not null,
    description text,
    objective text,
    status text not null default 'Planning',
    progress integer not null default 0 check (progress between 0 and 100),
    deadline date,
    research text,
    design_notes text,
    experiment text,
    data text,
    results text,
    conclusion text,
    budget numeric not null default 0 check (budget >= 0),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists public.project_tasks (
    id uuid primary key default gen_random_uuid(),
    project_id uuid not null references public.projects(id) on delete cascade,
    user_id uuid not null references auth.users(id) on delete cascade,
    title text not null,
    completed boolean not null default false,
    due_date date,
    created_at timestamptz not null default now()
);

create table if not exists public.project_materials (
    id uuid primary key default gen_random_uuid(),
    project_id uuid not null references public.projects(id) on delete cascade,
    user_id uuid not null references auth.users(id) on delete cascade,
    name text not null,
    quantity integer not null default 1 check (quantity > 0),
    estimated_cost numeric not null default 0 check (estimated_cost >= 0),
    purchased boolean not null default false,
    created_at timestamptz not null default now()
);

create table if not exists public.experimental_data (
    id uuid primary key default gen_random_uuid(),
    project_id uuid not null references public.projects(id) on delete cascade,
    user_id uuid not null references auth.users(id) on delete cascade,
    label text,
    x_value numeric,
    y_value numeric,
    notes text,
    created_at timestamptz not null default now()
);

create table if not exists public.learning_progress (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    topic text not null,
    progress integer not null default 0 check (progress between 0 and 100),
    updated_at timestamptz not null default now()
);
create unique index if not exists learning_progress_user_topic_uidx on public.learning_progress(user_id, topic);

create table if not exists public.skills (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    skill_name text not null,
    proficiency integer not null default 0 check (proficiency between 0 and 100),
    updated_at timestamptz not null default now()
);
create unique index if not exists skills_user_name_uidx on public.skills(user_id, skill_name);

create table if not exists public.college_entries (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    college_name text not null,
    program text,
    location text,
    notes text,
    application_deadline date,
    created_at timestamptz not null default now()
);

create table if not exists public.career_tasks (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    title text not null,
    completed boolean not null default false,
    created_at timestamptz not null default now()
);

create table if not exists public.portfolio_projects (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    project_id uuid references public.projects(id) on delete set null,
    title text not null,
    description text,
    status text,
    skills text,
    project_date date,
    results text,
    technical_details text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists projects_user_created_idx on public.projects(user_id, created_at desc);
create index if not exists project_tasks_project_created_idx on public.project_tasks(project_id, created_at);
create index if not exists project_materials_project_created_idx on public.project_materials(project_id, created_at);
create index if not exists experimental_data_project_created_idx on public.experimental_data(project_id, created_at);
create index if not exists college_entries_user_created_idx on public.college_entries(user_id, created_at desc);
create index if not exists career_tasks_user_created_idx on public.career_tasks(user_id, created_at);
create index if not exists portfolio_projects_user_created_idx on public.portfolio_projects(user_id, created_at desc);

create or replace function public.aerolab_set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
    new.updated_at := now();
    return new;
end;
$$;

drop trigger if exists projects_set_updated_at on public.projects;
create trigger projects_set_updated_at before update on public.projects
for each row execute function public.aerolab_set_updated_at();
drop trigger if exists learning_progress_set_updated_at on public.learning_progress;
create trigger learning_progress_set_updated_at before update on public.learning_progress
for each row execute function public.aerolab_set_updated_at();
drop trigger if exists skills_set_updated_at on public.skills;
create trigger skills_set_updated_at before update on public.skills
for each row execute function public.aerolab_set_updated_at();
drop trigger if exists portfolio_projects_set_updated_at on public.portfolio_projects;
create trigger portfolio_projects_set_updated_at before update on public.portfolio_projects
for each row execute function public.aerolab_set_updated_at();

-- Create exactly one profile row for each new Auth user. Full name is optional metadata, not a password.
create or replace function public.aerolab_create_profile()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
    insert into public.profiles (id, full_name)
    values (new.id, nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''))
    on conflict (id) do nothing;
    return new;
end;
$$;
drop trigger if exists on_aerolab_user_created on auth.users;
create trigger on_aerolab_user_created after insert on auth.users
for each row execute function public.aerolab_create_profile();

-- Protect every personal table and give the browser client only authenticated access.
alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.project_tasks enable row level security;
alter table public.project_materials enable row level security;
alter table public.experimental_data enable row level security;
alter table public.learning_progress enable row level security;
alter table public.skills enable row level security;
alter table public.college_entries enable row level security;
alter table public.career_tasks enable row level security;
alter table public.portfolio_projects enable row level security;

revoke all on public.profiles, public.projects, public.project_tasks, public.project_materials, public.experimental_data, public.learning_progress, public.skills, public.college_entries, public.career_tasks, public.portfolio_projects from public, anon, authenticated;
grant select, insert, update, delete on public.profiles, public.projects, public.project_tasks, public.project_materials, public.experimental_data, public.learning_progress, public.skills, public.college_entries, public.career_tasks, public.portfolio_projects to authenticated;

-- Idempotently replace the policies managed by this file.
drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles for select to authenticated using ((select auth.uid()) = id);
drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own on public.profiles for insert to authenticated with check ((select auth.uid()) = id);
drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
drop policy if exists profiles_delete_own on public.profiles;
create policy profiles_delete_own on public.profiles for delete to authenticated using ((select auth.uid()) = id);

drop policy if exists projects_select_own on public.projects;
create policy projects_select_own on public.projects for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists projects_insert_own on public.projects;
create policy projects_insert_own on public.projects for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists projects_update_own on public.projects;
create policy projects_update_own on public.projects for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists projects_delete_own on public.projects;
create policy projects_delete_own on public.projects for delete to authenticated using ((select auth.uid()) = user_id);

-- Child records must match the signed-in owner and a project owned by that same user.
drop policy if exists project_tasks_select_own on public.project_tasks;
create policy project_tasks_select_own on public.project_tasks for select to authenticated using (user_id = (select auth.uid()) and exists (select 1 from public.projects p where p.id = project_id and p.user_id = (select auth.uid())));
drop policy if exists project_tasks_insert_own on public.project_tasks;
create policy project_tasks_insert_own on public.project_tasks for insert to authenticated with check (user_id = (select auth.uid()) and exists (select 1 from public.projects p where p.id = project_id and p.user_id = (select auth.uid())));
drop policy if exists project_tasks_update_own on public.project_tasks;
create policy project_tasks_update_own on public.project_tasks for update to authenticated using (user_id = (select auth.uid()) and exists (select 1 from public.projects p where p.id = project_id and p.user_id = (select auth.uid()))) with check (user_id = (select auth.uid()) and exists (select 1 from public.projects p where p.id = project_id and p.user_id = (select auth.uid())));
drop policy if exists project_tasks_delete_own on public.project_tasks;
create policy project_tasks_delete_own on public.project_tasks for delete to authenticated using (user_id = (select auth.uid()) and exists (select 1 from public.projects p where p.id = project_id and p.user_id = (select auth.uid())));

drop policy if exists project_materials_select_own on public.project_materials;
create policy project_materials_select_own on public.project_materials for select to authenticated using (user_id = (select auth.uid()) and exists (select 1 from public.projects p where p.id = project_id and p.user_id = (select auth.uid())));
drop policy if exists project_materials_insert_own on public.project_materials;
create policy project_materials_insert_own on public.project_materials for insert to authenticated with check (user_id = (select auth.uid()) and exists (select 1 from public.projects p where p.id = project_id and p.user_id = (select auth.uid())));
drop policy if exists project_materials_update_own on public.project_materials;
create policy project_materials_update_own on public.project_materials for update to authenticated using (user_id = (select auth.uid()) and exists (select 1 from public.projects p where p.id = project_id and p.user_id = (select auth.uid()))) with check (user_id = (select auth.uid()) and exists (select 1 from public.projects p where p.id = project_id and p.user_id = (select auth.uid())));
drop policy if exists project_materials_delete_own on public.project_materials;
create policy project_materials_delete_own on public.project_materials for delete to authenticated using (user_id = (select auth.uid()) and exists (select 1 from public.projects p where p.id = project_id and p.user_id = (select auth.uid())));

drop policy if exists experimental_data_select_own on public.experimental_data;
create policy experimental_data_select_own on public.experimental_data for select to authenticated using (user_id = (select auth.uid()) and exists (select 1 from public.projects p where p.id = project_id and p.user_id = (select auth.uid())));
drop policy if exists experimental_data_insert_own on public.experimental_data;
create policy experimental_data_insert_own on public.experimental_data for insert to authenticated with check (user_id = (select auth.uid()) and exists (select 1 from public.projects p where p.id = project_id and p.user_id = (select auth.uid())));
drop policy if exists experimental_data_update_own on public.experimental_data;
create policy experimental_data_update_own on public.experimental_data for update to authenticated using (user_id = (select auth.uid()) and exists (select 1 from public.projects p where p.id = project_id and p.user_id = (select auth.uid()))) with check (user_id = (select auth.uid()) and exists (select 1 from public.projects p where p.id = project_id and p.user_id = (select auth.uid())));
drop policy if exists experimental_data_delete_own on public.experimental_data;
create policy experimental_data_delete_own on public.experimental_data for delete to authenticated using (user_id = (select auth.uid()) and exists (select 1 from public.projects p where p.id = project_id and p.user_id = (select auth.uid())));

-- Owner-only policies for personal records.
drop policy if exists learning_progress_own_select on public.learning_progress;
create policy learning_progress_own_select on public.learning_progress for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists learning_progress_own_insert on public.learning_progress;
create policy learning_progress_own_insert on public.learning_progress for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists learning_progress_own_update on public.learning_progress;
create policy learning_progress_own_update on public.learning_progress for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists learning_progress_own_delete on public.learning_progress;
create policy learning_progress_own_delete on public.learning_progress for delete to authenticated using ((select auth.uid()) = user_id);
drop policy if exists skills_own_select on public.skills;
create policy skills_own_select on public.skills for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists skills_own_insert on public.skills;
create policy skills_own_insert on public.skills for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists skills_own_update on public.skills;
create policy skills_own_update on public.skills for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists skills_own_delete on public.skills;
create policy skills_own_delete on public.skills for delete to authenticated using ((select auth.uid()) = user_id);
drop policy if exists college_entries_own_select on public.college_entries;
create policy college_entries_own_select on public.college_entries for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists college_entries_own_insert on public.college_entries;
create policy college_entries_own_insert on public.college_entries for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists college_entries_own_update on public.college_entries;
create policy college_entries_own_update on public.college_entries for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists college_entries_own_delete on public.college_entries;
create policy college_entries_own_delete on public.college_entries for delete to authenticated using ((select auth.uid()) = user_id);
drop policy if exists career_tasks_own_select on public.career_tasks;
create policy career_tasks_own_select on public.career_tasks for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists career_tasks_own_insert on public.career_tasks;
create policy career_tasks_own_insert on public.career_tasks for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists career_tasks_own_update on public.career_tasks;
create policy career_tasks_own_update on public.career_tasks for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists career_tasks_own_delete on public.career_tasks;
create policy career_tasks_own_delete on public.career_tasks for delete to authenticated using ((select auth.uid()) = user_id);
drop policy if exists portfolio_projects_own_select on public.portfolio_projects;
create policy portfolio_projects_own_select on public.portfolio_projects for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists portfolio_projects_own_insert on public.portfolio_projects;
create policy portfolio_projects_own_insert on public.portfolio_projects for insert to authenticated with check ((select auth.uid()) = user_id and (project_id is null or exists (select 1 from public.projects p where p.id = project_id and p.user_id = (select auth.uid()))));
drop policy if exists portfolio_projects_own_update on public.portfolio_projects;
create policy portfolio_projects_own_update on public.portfolio_projects for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id and (project_id is null or exists (select 1 from public.projects p where p.id = project_id and p.user_id = (select auth.uid()))));
drop policy if exists portfolio_projects_own_delete on public.portfolio_projects;
create policy portfolio_projects_own_delete on public.portfolio_projects for delete to authenticated using ((select auth.uid()) = user_id);

-- The browser client uses authenticated-role grants only; RLS remains the data boundary.
