-- OPTIONAL migration: enforce one row per edition at the database level.
--
-- This is NOT applied to the live database, and schema.sql does not create it on
-- the current data on purpose: the catalog deliberately keeps two same-ISBN
-- printings (the Harcourt Shakespeare Hamlet 2nd ed., dismissed via dup_dismissed)
-- as two separate rows. A UNIQUE index would reject that pair.
--
-- Apply this ONLY if you decide the catalog should never hold same-edition
-- duplicates. Steps:
--   1. Resolve every existing duplicate first (merge or delete one of each pair),
--      otherwise the CREATE UNIQUE INDEX below fails. Find them with:
--
--        select
--          coalesce(
--            nullif(regexp_replace(lower(btrim(isbn)), '[^0-9x]', '', 'g'), ''),
--            lower(btrim(title)) || '|' ||
--            lower(btrim(coalesce(author, ''))) || '|' ||
--            lower(btrim(coalesce(notes, '')))
--          ) as edition_key,
--          count(*)
--        from public.items
--        group by 1 having count(*) > 1;
--
--   2. Then run the statement below (matches src/lib/dedupe.ts editionKey: ISBN
--      normalized to digits+x, else title|author|notes).

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
