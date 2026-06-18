# Department Catalog (website template)

A practical, mobile-first inventory and cataloging website for a school department or any small library. Everyone gets a clean, **read-only** catalog they can browse, search, view by shelf, print labels from, and export. A single signed-in account (the "teacher" or department head) can add and edit, and changes go live for everyone. It is **free to host and needs no domain**.

Built with React + Vite + TypeScript and Supabase. It runs in two modes:

- **Local demo** (no backend): editable, saved only in your browser. Great for trying it out.
- **Cloud** (Supabase): one shared catalog with **public read** and **password-protected editing**.

---

## Features

- **Seven screens:** Dashboard, Catalog, Add/Edit Item, Shelf View, Label Generator (print-ready), Review/Cleanup, and Export.
- **Public read-only, single-login editing.** Signed-out visitors see no edit controls at all; only the account holder can change anything (enforced by the database, not just the UI).
- **Fast data entry:** quantity steppers, tappable category chips, and "Save & add another".
- **Bulk edits:** select all (or a filtered subset) and change category, status, or location, or delete, in one action. Available on both the Catalog and Review pages.
- **Edition-aware duplicate detection,** plus an optional database rule that refuses duplicate editions outright.
- **CSV import/export** for backups and spreadsheets.
- **Color-coded categories** that tie the on-screen catalog to printed shelf labels.

---

## Quick start (local demo, no backend)

```bash
npm install
npm run dev
```

Open the printed URL. With no Supabase configured, the app runs in **local demo mode**: fully editable, but data is saved only in your browser. This is perfect for exploring the app before setting up the shared version.

Other scripts:

```bash
npm run build      # production build into dist/
npm run preview    # serve the production build
npm run lint       # ESLint
npm run typecheck  # TypeScript check
```

---

## Go live (free, shared)

There are two one-time jobs: connect a database, then turn on hosting. A detailed, click-by-click version is in [`docs/DEPLOY-AND-SETUP.md`](docs/DEPLOY-AND-SETUP.md). The short version:

### 1. Database and the editor login (Supabase)

1. Create a free project at [supabase.com](https://supabase.com).
2. **SQL Editor → New query**, paste all of [`supabase/schema.sql`](supabase/schema.sql), and **Run**. This creates the `items` table and the rules that let everyone read but only signed-in users write. (The same file has an optional unique index that prevents duplicate editions; run it once your data is clean.)
3. **Authentication → Users → Add user**, set an email and password, and tick **Auto Confirm User**. This is the login the editor will use on the site.
4. **Project Settings → API**, copy the **Project URL** and the **anon public** key.
5. Paste both into [`public/config.json`](public/config.json):
   ```json
   {
     "supabaseUrl": "https://YOUR-PROJECT.supabase.co",
     "supabaseAnonKey": "your-anon-public-key"
   }
   ```
   The anon key is safe to commit: the database rules protect your data, not the key. Never use the `service_role` key here.

### 2. Hosting (pick one, both free)

- **GitHub Pages:** in your repo, **Settings → Pages → Source = GitHub Actions**. The included workflow ([`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)) builds and deploys on every push to `main`. Your site lands at `https://<your-username>.github.io/<repo>/`.
- **Azure Static Web Apps / Netlify:** point it at the repo with build command `npm run build` and output directory `dist`.

Once `config.json` has real values and you have hosted it, the site is live. The editor clicks **Teacher sign in** (in the sidebar, or under "More" on mobile), and everyone else just browses.

---

## Customize

- **Categories and their colors:** `src/types.ts` (the `CATEGORIES` list) and `src/data/categories.ts` (each category's color, short label, and default section).
- **Material types and statuses:** `src/types.ts`.
- **App name and branding:** `index.html` (page title) and `src/components/Layout.tsx` (the brand name and the "Made by ..." credit and contact email in the sidebar). Update or remove the credit to suit you.
- **Colors and fonts:** `src/styles/theme.css`.

---

## Bulk-loading existing data (optional)

If you already have a list of items, the fastest path is the in-app **Export → Full catalog CSV** to see the exact column format, fill a CSV, then **Import from CSV** while signed in.

There is also a helper script to push a local `public/catalog.json` into Supabase, signing in as your editor account:

```bash
node scripts/db-upload.mjs "editor@example.com" "your-password"
```

---

## How it works (the two modes)

The app reads `public/config.json` at startup:

- **No `supabaseUrl`** → local demo mode, backed by `localStorage`.
- **`supabaseUrl` + anon key set** → cloud mode: data loads from Supabase, signed-out visitors are read-only, the signed-in account can edit, and changes refresh live for everyone.

`readOnly` is derived from auth state, so every write control across the app is hidden for visitors automatically.

---

*Template by William Yin.*
