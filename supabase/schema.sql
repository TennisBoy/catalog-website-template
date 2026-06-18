-- English Department Catalog: Supabase schema
-- Run this once in your Supabase project: Dashboard → SQL Editor → New query → paste → Run.

-- 1) The catalog table
create table if not exists public.items (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  quantity      integer not null default 0,
  category      text not null default 'Other / Uncategorized',
  material_type text not null default 'Other',
  section       text not null default '',
  shelf         text not null default '',
  author        text,
  isbn          text,
  notes         text,
  condition     text,
  status        text not null default 'Cataloged',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- 2) Row Level Security: everyone can READ, only signed-in users can WRITE
alter table public.items enable row level security;

-- Anyone (even signed-out visitors) can view the catalog
create policy "Public can read items"
  on public.items for select
  using (true);

-- Only authenticated users (the teacher) can add / edit / delete
create policy "Authenticated can insert items"
  on public.items for insert to authenticated with check (true);

create policy "Authenticated can update items"
  on public.items for update to authenticated using (true) with check (true);

create policy "Authenticated can delete items"
  on public.items for delete to authenticated using (true);

-- 3) Live updates: let viewers' pages refresh automatically when data changes
alter publication supabase_realtime add table public.items;

-- 4) Prevent duplicate editions.
-- One row per edition: if an ISBN is present, the ISBN must be unique; when
-- there's no ISBN, the (title + author + notes) combination must be unique.
-- Different editions of the same title (different ISBN/publisher) are still
-- allowed. Run this AFTER removing any existing exact duplicates.
create unique index if not exists items_edition_uniq
  on public.items (
    (
      coalesce(
        nullif(btrim(isbn), ''),
        lower(btrim(title)) || '|' ||
        lower(btrim(coalesce(author, ''))) || '|' ||
        lower(btrim(coalesce(notes, '')))
      )
    )
  );
