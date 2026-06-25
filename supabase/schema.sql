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

-- 4) Prevent duplicate editions (OPTIONAL — see note).
-- One row per edition: if an ISBN is present, the normalized ISBN must be unique;
-- when there's no ISBN, the (title + author + notes) combination must be unique.
-- The ISBN is normalized to digits + x (matching the app's editionKey in
-- src/lib/dedupe.ts), so "978-0-19..." and "9780019..." count as one edition.
-- Different editions of the same title (different ISBN/publisher) are still allowed.
--
-- NOTE: this index is intentionally NOT applied on the current live database,
-- because the catalog deliberately keeps two same-ISBN printings as separate rows
-- (dismissed via dup_dismissed). Creating the index would reject that pair. Run it
-- only on a database that has no intended same-edition duplicates.
create unique index if not exists items_edition_uniq
  on public.items (
    (
      coalesce(
        nullif(regexp_replace(lower(btrim(isbn)), '[^0-9x]', '', 'g'), ''),
        lower(btrim(title)) || '|' ||
        lower(btrim(coalesce(author, ''))) || '|' ||
        lower(btrim(coalesce(notes, '')))
      )
    )
  );

-- 5) "No shelf needed" flag.
-- Lets the head dismiss a shelfless item from the Review "No shelf/location"
-- list (Save without a shelf). Safe to run on an existing table.
alter table public.items
  add column if not exists shelf_dismissed boolean not null default false;

-- 6) "Not a duplicate" flag.
-- Lets the head dismiss an edition from the Review "Possible duplicates" list
-- ("Keep both") so the warning stays cleared. Safe to run on an existing table.
alter table public.items
  add column if not exists dup_dismissed boolean not null default false;
