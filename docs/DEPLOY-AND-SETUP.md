# Putting the catalog online (free, no domain)

This sets up a **public, read-only website** that anyone can view and export, where **only the Department Head (with a password) can add or edit** items. Edits are instant and global. Hosting is free (GitHub Pages) and needs no domain.

There are two one-time jobs:
- **A. Connect the shared database** (Supabase), so editing is live and protected.
- **B. Turn on the website** (GitHub Pages), so people can visit it.

After that, the Head just signs in and uses the app normally; everyone else only views.

---

## A. Connect the shared database (Supabase), ~10 minutes

### 1. Create a free Supabase project
1. Go to **https://supabase.com** → sign up (free) → **New project**.
2. Give it a name (e.g. `engdep-catalog`), set a database password (save it somewhere), pick the nearest region, and create it. Wait ~1 minute for it to finish.

### 2. Create the catalog table
1. In your project, open **SQL Editor** → **New query**.
2. Open the file [`supabase/schema.sql`](../supabase/schema.sql) in this repo, copy **all** of it, paste it in, and click **Run**.
   - This creates the `items` table and the rules that let **everyone read** but **only signed-in users write**.

### 3. Create the teacher's login
1. Go to **Authentication → Users → Add user → Create new user**.
2. Enter the Head's **email** and a **password**. Tick **Auto Confirm User** (so no email confirmation is needed).
3. This email + password is what the Head will use to sign in on the website. (You can add more editors later the same way.)

### 4. Copy your two connection values
1. Go to **Project Settings → API**.
2. Copy the **Project URL** and the **anon public** key (the long one labelled `anon` / `public`).
   - ⚠️ The `anon` key is *safe to put in the website*: the database rules (RLS) are what protect your data, not the key. Do **not** use the `service_role` key.

### 5. Paste them into the site config
1. Open **`public/config.json`** in this repo and fill in the two values:
   ```json
   {
     "supabaseUrl": "https://YOUR-PROJECT.supabase.co",
     "supabaseAnonKey": "eyJ...your-anon-key..."
   }
   ```
2. Save / commit it. (You can edit this file directly on GitHub: open the file → pencil icon → paste → **Commit changes**.)

> **First-time data:** the table starts empty. The Head can sign in and add items, or you can bulk-load: open the site, **Export → Full catalog CSV** to get the column format, fill a CSV, then **Import from CSV** while signed in.

---

## B. Turn on the website (GitHub Pages), ~3 minutes

1. In this GitHub repo, go to **Settings → Pages**.
2. Under **Build and deployment → Source**, choose **GitHub Actions**.
3. That's it. Every time you push to `main`, the included workflow ([`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml)) builds and publishes automatically.
4. Your site will be at: **`https://<your-github-username>.github.io/catalogEngDep/`**

(To trigger the first deploy now: make any commit to `main`, or open **Actions → Deploy to GitHub Pages → Run workflow**.)

---

## Daily use

- **Teachers & students:** just open the link. They can browse, search, view shelves, print labels, and **export**, but there are **no edit buttons**, so they can't change anything.
- **The Head:** open the link → **Teacher sign in** (bottom of the sidebar, or "More" on mobile) → enter the email + password from step A.3. Now the Add/Edit/Review tools appear. Changes save instantly and everyone sees them on their next refresh.
- **Sign out** when done (or just close the tab; others still can't edit).

## Backups
Even though the data is safely in the cloud, it's good practice to **Export → Full catalog CSV** occasionally and keep the file. If anything ever goes wrong, a signed-in editor can **Import from CSV** to restore.

---

## Notes & troubleshooting

- **Is it really free?** Yes. Supabase's free tier and GitHub Pages both comfortably cover a 3,000-item catalog for a school department.
- **The `anon` key is public, is that OK?** Yes. It only allows what the database rules permit, which is *read for everyone, write for signed-in users only*. Never paste the `service_role` key into the site.
- **"Could not load the catalog" / empty page:** check that `public/config.json` has the correct URL + anon key, and that you ran `schema.sql`.
- **Can't sign in:** confirm the user exists in **Authentication → Users** and was **Auto Confirmed**. Re-check the password.
- **Add more editors:** Supabase → Authentication → Users → Add user. Anyone with an account can edit.
- **School Google/Microsoft accounts don't matter here**: this uses its own Supabase login, so school sharing restrictions are irrelevant.
- **Before Supabase is connected**, the site runs in a local demo mode (sample data, editable only on your own device). Once `config.json` is filled in, it switches to the live, protected catalog automatically.
