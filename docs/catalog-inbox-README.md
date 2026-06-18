# Cataloging drop-off (`catalog-inbox/`)

Drop book photos here, then ask Claude to "catalog the inbox".

- Make a subfolder named after the **category** (e.g. `Grade 11`, `Dictionaries`,
  `Films`, `Theory of Knowledge`). Aliases like `grade11`, `g11`, `TOK`, `DVD` work.
- Put one image per book inside it. **Each image = one title.**
- The image can be the **cover** OR a **photo of the ISBN / barcode** (use the ISBN
  photo when the cover has too little text).
- The number of copies is NOT read from the photo. It's left at 0 and the item is
  marked "Needs review" for you to fill in later.

After processing, photos are moved to `catalog-inbox/_done/…` and a log is written to
`catalog-inbox/_runs/<date>.md`. This folder is git-ignored, so photos are never committed.

**Heads up (local-demo mode):** cataloging rewrites `public/catalog.json`, so when you
reload the site it re-seeds from that file and any unsaved in-browser edits (quantities,
locations, statuses) will be lost. If you've made changes in the browser since your last
Export, do an Export first before asking Claude to catalog the inbox.
