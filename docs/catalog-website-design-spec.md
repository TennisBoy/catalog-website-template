# English Department Cataloging Website: UI/UX Design Specification

**Version:** 1.0 (design spec, no code)
**Audience:** the developer who will build it, and the department staff who will use it
**Target build:** React + Vite + TypeScript single-page app · offline-first (`localStorage`) · CSV import/export · no backend, no accounts · mobile-first

---

## 0. The one-paragraph summary

The English department has ~3,000 books and materials (many in class sets of 25–60 copies) on messy shelves. This tool lets a **non-technical** team (a Department Head, a student assistant doing the cataloging, and teachers who search later) quickly enter every item (title, quantity, category, physical location), organize the shelves to match, print clear shelf labels, clean up missing data, and export a spreadsheet for department records. **Speed of data entry while standing in front of a shelf is the single most important thing.**

---

## 1. Design principles

These drive every decision below. When a trade-off appears, resolve it in this order:

1. **Fast entry beats everything.** A title + quantity + category should be enterable in under 10 seconds, one-handed, on a phone. Steppers and tappable chips, never fiddly dropdowns for common fields.
2. **Practical tool, not a corporate database.** Plain words ("Shelf", "Copies", "Needs review"), no jargon, no dense grids of tiny text.
3. **Mobile-first.** Cataloging happens at the shelf. Phone layout is the primary design; desktop is the comfortable extra.
4. **Color is the bridge between screen and shelf.** Every category owns one accent color, used identically on its badge in the catalog, its header in Shelf View, and its printed label. A teacher learns "Grade 9 = blue" once.
5. **Forgiving.** Nothing is mandatory except a title. Missing data is captured as a gentle to-do on the Review page, never a blocking error.
6. **Minimal clutter.** One primary action per screen, generous whitespace, big tap targets (≥44px).

---

## 2. Design system / tokens

Concrete values so the build is consistent without guessing.

### Color: neutrals
| Token | Hex | Use |
|---|---|---|
| `--bg` | `#F8FAFC` | App background (off-white) |
| `--surface` | `#FFFFFF` | Cards, sheets, table rows |
| `--border` | `#E2E8F0` | Hairlines, dividers, input borders |
| `--text` | `#0F172A` | Primary text (dark slate) |
| `--text-muted` | `#64748B` | Secondary text, captions |
| `--primary` | `#4F46E5` | **Actions only**: buttons, active nav, focus rings, links |
| `--primary-press` | `#4338CA` | Pressed/hover state |
| `--danger` | `#DC2626` | Destructive actions, error text |
| `--warn-bg` | `#FEF3C7` | Review/attention highlights |
| `--success` | `#16A34A` | Saved confirmations |

> **Rule:** `--primary` (indigo) is used **only** for app actions. The colors below are used **only** for categories. They never appear in the same role, so there is no confusion between "this is a button" and "this is a Grade 9 item."

### Color: category accents
Each category gets one color, used on badges, Shelf View headers, and printed labels. **Color is always paired with the text label, never color alone** (accessibility for color-blind users).

| Category | Hex | Swatch name |
|---|---|---|
| Grade 9 | `#2563EB` | Blue |
| Grade 10 | `#0891B2` | Cyan |
| Grade 11 | `#7C3AED` | Violet |
| Grade 12 | `#DB2777` | Pink |
| ESL | `#EA580C` | Orange |
| Dictionaries | `#B45309` | Amber |
| French | `#0D9488` | Teal |
| Theory of Knowledge | `#CA8A04` | Gold |
| Board Games | `#16A34A` | Green |
| Films | `#DC2626` | Red |
| Other / Uncategorized | `#64748B` | Slate (intentionally grey, signals "needs a home") |

Each badge uses the hex at ~12% opacity for its background and full strength for its text/border (a soft "pill"), e.g. Grade 9 = blue text on pale-blue fill.

### Spacing scale (px)
`4 · 8 · 12 · 16 · 24 · 32 · 48`. Default gutter 16, card padding 16, section gap 24.

### Radius
Cards `12` · inputs/buttons `8` · pills/badges `999` (full).

### Typography
Font stack: `Inter, -apple-system, "Segoe UI", Roboto, sans-serif`.
| Role | Size / weight | Line-height |
|---|---|---|
| Page title | 28 / 700 | 1.2 |
| Section heading | 20 / 600 | 1.3 |
| Body | 16 / 400 | 1.5 |
| Body strong | 16 / 600 | 1.5 |
| Caption / meta | 13 / 500 | 1.4 |
| Stat number | 32 / 700 | 1.1 |

Generous line-height (1.5 body) because the screen is read at arm's length near a shelf.

### Elevation
Flat by default. Cards: `0 1px 2px rgba(15,23,42,.06)`. Floating action button & sheets: `0 8px 24px rgba(15,23,42,.16)`.

---

## 3. Data model

The whole app revolves around one entity, `Item`. TypeScript shape for the eventual build:

```ts
type Category =
  | 'Grade 9' | 'Grade 10' | 'Grade 11' | 'Grade 12'
  | 'ESL' | 'Dictionaries' | 'French'
  | 'Theory of Knowledge' | 'Board Games' | 'Films'
  | 'Other / Uncategorized';

type MaterialType =
  | 'Book' | 'Dictionary' | 'ESL Material'
  | 'Board Game' | 'Film' | 'Other';

type Condition = 'New' | 'Good' | 'Worn' | 'Damaged';

type Status =
  | 'Cataloged'        // complete and shelved
  | 'Needs review'     // flagged by a person
  | 'Misplaced'        // not where it should be
  | 'Duplicate possible'; // maybe a dupe of another title

interface ItemLocation {
  section: string;     // e.g. "Grade 9 area"  (usually mirrors category)
  shelf: string;       // e.g. "A1"
}

interface Item {
  id: string;          // uuid
  title: string;       // REQUIRED: the only required field
  quantity: number;    // copies on hand
  category: Category;
  materialType: MaterialType;
  location: ItemLocation;
  author?: string;
  isbn?: string;
  notes?: string;
  condition?: Condition;
  status: Status;      // defaults to 'Cataloged'
  createdAt: string;   // ISO timestamp
  updatedAt: string;   // ISO timestamp
}
```

### Vocabulary (used consistently across all screens)
- **Title** = one distinct `Item` row. The dashboard's "Total titles" = `items.length`.
- **Copies** = physical count. "Total copies" = `sum(item.quantity)`. A class set of 30 = **1 title, 30 copies**.

### Storage
- State = `Item[]` persisted to `localStorage` under one key (e.g. `engdep.catalog.v1`), rewritten on every change. No server.
- **CSV is the backup & sharing format.** Column order for a clean round-trip (import and export use the same header):
  `title, quantity, category, materialType, section, shelf, author, isbn, condition, status, notes, updatedAt`
- Import maps each column back to the `Item` fields; unknown categories/types fall back to `Other / Uncategorized` / `Other` and the row is flagged **Needs review**.

---

## 4. Navigation structure

Seven destinations: **Dashboard · Catalog · Add Item · Shelf View · Labels · Review · Export**.

**Mobile (primary):** fixed bottom tab bar with the 4 most-used destinations + a "More" sheet for the rest. A floating **+** button (FAB) for Add Item floats above the bar on every screen, so entry is always one tap away.

```
 Bottom bar:  [ Home ] [ Catalog ] [ + ] [ Shelves ] [ More ]
                                     ▲ FAB = Add Item
   "More" sheet → Labels · Review · Export · Import CSV · About
```

**Desktop:** persistent left sidebar listing all seven, plus a top bar holding global search and a primary **+ Add Item** button.

```
┌───────────┬──────────────────────────────────────────┐
│ 📚 EngDep │  [ 🔍 Search catalog…            ] [+ Add]│
│           ├──────────────────────────────────────────┤
│ ▸ Dashboard                                           │
│ ▸ Catalog │           ( page content )                │
│ ▸ Add Item│                                           │
│ ▸ Shelves │                                           │
│ ▸ Labels  │                                           │
│ ▸ Review ④│  ← badge shows # of items needing attention│
│ ▸ Export  │                                           │
└───────────┴──────────────────────────────────────────┘
```

The **Review** nav item carries a count badge (number of items needing attention) so cleanup is always visible.

---

## 5. Screens

Each screen below lists its **purpose**, a **wireframe** (mobile and/or desktop), its **components**, and **behaviors**.

### 5.1 Dashboard

**Purpose:** at-a-glance health of the catalog + fast jump to the four things people actually do.

**Mobile wireframe**
```
┌─────────────────────────────┐
│  English Dept Catalog        │
│                              │
│  ┌────────────┐ ┌──────────┐ │
│  │   412      │ │  3,180   │ │   ← Stat cards
│  │  Titles    │ │  Copies  │ │
│  └────────────┘ └──────────┘ │
│  ┌────────────┐ ┌──────────┐ │
│  │    27      │ │    11    │ │
│  │Uncategorized│ │Categories│ │
│  └────────────┘ └──────────┘ │
│                              │
│  Quick actions               │
│  [ ➕ Add item            ]  │
│  [ 🔍 Search catalog      ]  │
│  [ 🏷  Print labels        ]  │
│  [ ⬇  Export catalog      ]  │
│                              │
│  By category                 │
│  ● Grade 9 ........ 48       │
│  ● Grade 10 ....... 51       │
│  ● ESL ............ 33       │
│  ● Dictionaries ... 60   …   │
│                              │
│  Recently added              │
│  • Lord of the Flies  ×32    │
│    Grade 9 · Shelf A1 · 2m   │
│  • Larousse Dict.     ×15    │
│    Dictionaries · D2 · 9m    │
└─────────────────────────────┘
   [Home][Catalog][+][Shelves][More]
```

**Components:** `StatCard` ×4 (Titles, Copies, Uncategorized, Categories), `QuickActionButton` ×4, category breakdown list (`CategoryBadge` + count, each row a link into a filtered Catalog), `RecentItemRow` list (last ~8 by `updatedAt`).

**Behaviors:**
- "Uncategorized" stat is tappable → Catalog pre-filtered to `Other / Uncategorized`. It turns amber if > 0.
- Each "By category" row → Catalog filtered to that category.
- Quick actions route to: Add Item, Catalog (focus search), Labels, Export.
- All numbers derive live from the item array (`titles`, `copies` per §3 vocabulary).

---

### 5.2 Catalog

**Purpose:** find anything fast; the searchable, filterable master list.

**Mobile** = stacked cards. **Desktop** = dense table. Same data, responsive.

**Mobile wireframe**
```
┌─────────────────────────────┐
│ 🔍 Search title/author…   ⌫ │  ← sticky
│ [All ▾][Grade ▾][Type ▾] ⚙  │  ← filter chips
│ ☐ Uncategorized only         │
├─────────────────────────────┤
│ Lord of the Flies      ×32  │
│ ● Grade 9 · Book            │
│ 📍 Shelf A1 · upd 2m        │
├─────────────────────────────┤
│ The Crucible           ×28  │
│ ● Grade 11 · Book           │
│ 📍 Shelf C2 · upd 1h        │
├─────────────────────────────┤
│ Catan                  ×3   │
│ ● Board Games · Board Game  │
│ 📍 Shelf G1 · ⚠ Needs review│
└─────────────────────────────┘
```

**Desktop wireframe**
```
🔍 Search…   [Category ▾][Grade ▾][Type ▾][Location ▾]  ☐ Uncategorized only   412 results
┌────────────────────────┬─────┬──────────────┬────────┬───────────┬───────────┬──────────┐
│ Title                  │ Qty │ Category     │ Shelf  │ Type      │ Notes     │ Updated  │
├────────────────────────┼─────┼──────────────┼────────┼───────────┼───────────┼──────────┤
│ Lord of the Flies      │  32 │ ●Grade 9     │ A1     │ Book      │ class set │ 2m ago   │
│ The Crucible           │  28 │ ●Grade 11    │ C2     │ Book      │ none      │ 1h ago   │
│ Catan          ⚠       │   3 │ ●Board Games │ G1     │ Board Game│ box torn  │ 1d ago   │
└────────────────────────┴─────┴──────────────┴────────┴───────────┴───────────┴──────────┘
   Click any row → Edit · Column headers sort · ⚠ = status needs attention
```

**Components:** `SearchBar` (sticky), `FilterBar` (`FilterChip`/dropdowns: Category, Grade, Material type, Location + `Toggle` "Uncategorized only"), `ItemTable`+`ItemRow` (desktop), `ItemCard` list (mobile), `CategoryBadge`, `StatusPill`, result count, `EmptyState`.

**Behaviors:**
- Search matches title + author (case-insensitive substring), debounced; updates instantly.
- Filters combine (AND). "Grade" filter is a convenience that selects Grade 9–12 categories. Active filters show as removable chips; a "Clear all" appears when any is set.
- "Uncategorized only" toggle = quick path to the items that need a home.
- Row/card tap → Edit Item (§5.3). Desktop column headers sort.
- Empty state ("No items yet. Add your first.") with an Add button when catalog or a filter is empty.

---

### 5.3 Add / Edit Item

**Purpose:** the speed-critical screen. Optimized so a student assistant can blast through a cart of books.

**Mobile wireframe**
```
┌─────────────────────────────┐
│ ✕            Add item        │
│                              │
│ Title                        │
│ [ Lord of the Flies        ]│  ← autofocus
│ ⚠ Similar title exists:      │
│   "Lord of the Flies" (A1)   │  ← inline dup hint
│                              │
│ Quantity                     │
│        [ − ]  32  [ + ]      │  ← big stepper
│                              │
│ Category                     │
│ (●G9)(G10)(G11)(G12)(ESL)    │  ← tappable color chips
│ (Dict)(Fr)(TOK)(Games)(Film) │
│ (Other)                      │
│                              │
│ Material type                │
│ (Book)(Dict)(ESL)(Game)(Film)│
│ (Other)                      │
│                              │
│ Location                     │
│ Section [ Grade 9 area     ] │  ← prefilled from category
│ Shelf   [ A1 ]               │
│                              │
│ ▸ More details (optional)    │  ← collapsed
│   Author · ISBN · Condition  │
│   · Notes · Status           │
│                              │
│ [   Save & add another   ]   │  ← primary, sticky
│ [        Save & close    ]   │
└─────────────────────────────┘
```

**Components:** `TextField` (Title, autofocus), `DuplicateHint`, `QuantityStepper` (with manual numeric tap-to-type), `CategoryChipPicker` (color chips), `MaterialTypeChips`, location `TextField`s, `Collapsible` "More details" wrapping Author/ISBN/`ConditionChips`/Notes/`StatusChips`, two save buttons.

**Behaviors:**
- **Title** autofocuses on open; the keyboard is up immediately.
- **Quantity** defaults to 1; stepper for small numbers, tap the number to type larger counts (class sets).
- **Category** is tappable color chips, not a dropdown: one tap. Selecting a category **auto-fills Section** with the matching area (e.g. "Grade 9" → "Grade 9 area"), editable.
- **Material type** auto-suggests from category (e.g. Dictionaries → Dictionary, Films → Film, Board Games → Board Game) but is overridable.
- **More details** stays collapsed to keep the common path short.
- **"Save & add another"** is the hero button: saves, shows a brief "Saved ✓" toast, resets Title + Quantity, **keeps Category, Material type, and Location sticky** so a shelf of same-category books flies in. **"Save & close"** returns to where you came from.
- **Duplicate hint:** as the title is typed, if a close match exists (normalized/fuzzy), show it inline with its shelf, tap to open that item instead of making a dupe.
- **Edit mode** = same form pre-filled; shows "Save changes" + a "Delete" affordance (with confirm). Nothing is required except Title; blanks become Review to-dos, never blocking errors.

---

### 5.4 Shelf View (physical sorting)

**Purpose:** mirror the real shelves so the digital catalog and the physical room match. Answers "what's on shelf A2 and how many copies?"

**Wireframe**
```
┌─────────────────────────────┐
│ Shelf View      [+ Add shelf]│
│                              │
│ ● GRADE 9               148 ◄│ ← category header (blue), total copies
│  ┌─────────┐ ┌─────────┐     │
│  │ A1      │ │ A2      │     │
│  │ 5 titles│ │ 3 titles│     │  ← ShelfCard
│  │ 96 cps  │ │ 52 cps  │     │
│  └─────────┘ └─────────┘     │
│  ┌─────────┐                 │
│  │ A3   ⚠  │  ← holds a      │
│  │ 2 titles│    misplaced/   │
│  │ 18 cps  │    uncat item   │
│  └─────────┘                 │
│                              │
│ ● GRADE 10              103  │
│  ┌─────────┐ ┌─────────┐     │
│  │ B1      │ │ B2      │     │
│  └─────────┘ └─────────┘     │
│                              │
│ ● DICTIONARIES          240  │
│  …                           │
│                              │
│ ⚠ Unshelved (no location) 14│ ← always-present catch-all
└─────────────────────────────┘
```

**Tap a shelf card → shelf detail:**
```
┌─────────────────────────────┐
│ ‹ Grade 9 · Shelf A1         │
│ 5 titles · 96 copies         │
│ [ 🏷 Print this shelf's label]│
├─────────────────────────────┤
│ Lord of the Flies      ×32  │
│ Of Mice and Men        ×30  │
│ Animal Farm            ×28  │
│ … (tap a title → Edit)       │
└─────────────────────────────┘
```

**Components:** category section header (`CategoryBadge` style, full-width, with summed copies), `ShelfCard` (shelf id, title count, copy count, ⚠ flag), shelf-detail title list, an **Unshelved** catch-all section, "Print this shelf's label" shortcut into §5.5.

**Behaviors:**
- Shelves are grouped under their category; copy totals sum the items assigned to each shelf.
- A ⚠ on a shelf card = it contains an item whose `status` is Misplaced or whose category is Uncategorized → surfaces room cleanup spatially.
- **Unshelved** section lists items with empty shelf/location: the physical to-do.
- Shelf detail → tap title to edit; shortcut to print just that shelf's label.

---

### 5.5 Label Generator

**Purpose:** produce clear, large, printable labels so the physical shelves match the catalog. v1 = simple printable labels; QR codes are noted for v2.

**Wireframe**
```
┌─────────────────────────────┐
│ Label Generator              │
│ Label type:                  │
│ ( Category )( Shelf )        │  ← segmented
│                              │
│ Pick what to print:          │
│ ☑ Grade 9   ☑ Grade 10       │
│ ☑ ESL       ☐ Films  …       │
│ [ Select all ] [ None ]      │
│                              │
│ Size: ( Large )( Medium )    │
│ ☑ Show category color band   │
│                              │
│ Preview                      │
│ ┌─────────────────────────┐ │
│ │█████████  (blue band)   │ │
│ │                         │ │
│ │     GRADE 9             │ │  ← huge
│ │     Shelf A1            │ │
│ │                         │ │
│ └─────────────────────────┘ │
│                              │
│ [   🖨 Print labels        ] │
└─────────────────────────────┘
```

**Label content by type:**
- **Category label:** big category name + its color band. e.g. `GRADE 9`.
- **Shelf label:** category + shelf id. e.g. `GRADE 9` / `Shelf A1`.

**Components:** `SegmentedControl` (label type), multi-select checklist (categories / shelves drawn from existing data), size toggle, color-band toggle, `LabelPreview`, Print button.

**Behaviors:**
- Choices are populated from real catalog data (only shelves that exist).
- A dedicated **print stylesheet** (`@media print`) lays labels out on a standard sheet (e.g. Avery-style grid), hides all app chrome, and prints color bands. High contrast, large type, readable across a room.
- Labels carry the category's accent color band so a printed shelf label matches its on-screen badge.
- **v2 (future):** optional QR code on each label linking to that shelf's filtered Catalog view.

---

### 5.6 Review / Cleanup

**Purpose:** the single place to fix everything incomplete. Turns "messy data" into a short, tappable to-do list. This is why Add Item never blocks on missing fields.

**Wireframe**
```
┌─────────────────────────────┐
│ Review & Cleanup             │
│ 41 items need attention      │
│                              │
│ ▸ Uncategorized (27)         │
│   • The Giver          ×25   │
│     [ Assign category ]      │
│   • Maus               ×12   │
│     [ Assign category ]      │
│                              │
│ ▸ Possible duplicates (4)    │
│   • "Hamlet" (B1) ⇄          │
│     "hamlet" (B3)            │
│     [ Merge ] [ Keep both ]  │
│                              │
│ ▸ Missing quantity (3)       │
│   • Macbeth, qty?            │
│     [ Set quantity ]         │
│                              │
│ ▸ No shelf / location (14)   │
│   • Frankenstein             │
│     [ Assign shelf ]         │
│                              │
│ ▸ Marked "Needs review" (6)  │
│   • Catan: "box torn"        │
│     [ Open ]                 │
└─────────────────────────────┘
```

**Components:** count header, collapsible `ReviewGroup` ×5, each with `ReviewRow` carrying an inline one-tap fix action.

**The five groups (each derived live):**
1. **Uncategorized**: `category === 'Other / Uncategorized'`. Inline → category chip picker.
2. **Possible duplicates**: titles that normalize to the same string (case/whitespace/punctuation-insensitive) on different items. Actions: Merge (sum quantities, keep one) or Keep both (clears the flag).
3. **Missing quantity**: `quantity` is 0 or unset. Inline → quantity stepper.
4. **No shelf / location**: empty `shelf`. Inline → shelf assignment.
5. **Needs review**: `status === 'Needs review'`. Opens the item.

**Behaviors:**
- The nav badge count = total rows here. Fixing a row removes it and decrements the badge immediately.
- Inline actions resolve in place without leaving the page where possible (chip picker, stepper, shelf field as popovers).
- Empty state when all clear: "Everything's tidy 🎉".

---

### 5.7 Export

**Purpose:** get the catalog out for department records; the workflow's final step.

**Wireframe**
```
┌─────────────────────────────┐
│ Export                       │
│                              │
│ [ ⬇ Full catalog (CSV)     ] │
│   412 titles · 3,180 copies  │
│                              │
│ Export one category          │
│ [ Category ▾ ] [ ⬇ Export ]  │
│                              │
│ [ ⬇ Shelf / location list   ]│
│   Every shelf + its titles   │
│                              │
│ [ 🖨 Printable inventory     ]│
│   Summary for binder/records │
│                              │
│ ── Backup ──────────────     │
│ [ ⬇ Export backup (CSV)     ]│
│ [ ⬆ Import from CSV         ]│
└─────────────────────────────┘
```

**Components:** four export buttons + an import button, each with a one-line description and live counts.

**The four exports:**
1. **Full catalog CSV**: all items, columns per §3.
2. **Category-specific CSV**: pick a category, export only those.
3. **Shelf / location list**: grouped by category → shelf → titles + copy totals (the physical map).
4. **Printable inventory summary**: a clean, print-stylesheet page with totals, per-category counts, and copy totals, for the department binder.

**Behaviors:**
- CSV generated client-side (Blob download), filename stamped with the date, e.g. `engdep-catalog-2026-06-12.csv`.
- **Import** reads a CSV with the §3 header, adds/merges items, and routes any unmapped rows to **Needs review**. This + Full export = the offline backup/restore story (since data lives in one browser).

---

## 6. Component inventory

Maps directly to React components for the build.

| Component | Purpose | Key props |
|---|---|---|
| `StatCard` | Dashboard metric tile | `label`, `value`, `tone?`, `onClick?` |
| `CategoryBadge` | Color-coded category pill | `category` |
| `StatusPill` | Status indicator (⚠ for non-Cataloged) | `status` |
| `SearchBar` | Sticky debounced search | `value`, `onChange`, `placeholder` |
| `FilterBar` / `FilterChip` | Catalog filters + active-chip display | `filters`, `onChange`, `onClear` |
| `Toggle` | "Uncategorized only" etc. | `checked`, `onChange`, `label` |
| `ItemRow` | One catalog row (desktop table) | `item`, `onOpen` |
| `ItemCard` | One catalog card (mobile) | `item`, `onOpen` |
| `QuantityStepper` | −/+ stepper with tap-to-type | `value`, `onChange` |
| `CategoryChipPicker` | Tappable category color chips | `value`, `onChange` |
| `MaterialTypeChips` | Tappable material-type chips | `value`, `onChange` |
| `Collapsible` | "More details" section | `title`, `defaultOpen?` |
| `DuplicateHint` | Inline similar-title warning | `match`, `onOpen` |
| `ShelfCard` | Shelf summary in Shelf View | `shelf`, `titleCount`, `copyCount`, `flagged?` |
| `LabelPreview` | Live printable-label preview | `type`, `category`, `shelf?`, `size` |
| `ReviewGroup` / `ReviewRow` | Cleanup list + inline fix | `title`, `items`, `fixAction` |
| `QuickActionButton` | Dashboard big action | `icon`, `label`, `to` |
| `StatusToast` | "Saved ✓" feedback | `message`, `tone` |
| `EmptyState` | Friendly empty placeholder | `message`, `action?` |
| `FAB` | Floating Add-Item button (mobile) | `to` |
| `BottomNav` / `Sidebar` | Navigation | `items`, `badges` |

---

## 7. User flow

The department's suggested workflow, mapped onto the screens. The fast inner loop (steps 3–4) is the one that must feel effortless.

```
1. Set up categories        → Categories are fixed (the 11). Decide which shelves
   in the physical room        belong to each (Grade 9 = A1–A3, etc.).

2. Label the shelves        → Labels screen → print Category + Shelf labels →
                               stick them on the physical shelves.

3. Enter titles + quantity  ┐  At the shelf, phone in hand:
   (THE FAST LOOP)          │  FAB → Title → Quantity stepper → tap Category chip
                            │  → Shelf auto-filled → "Save & add another" →
4. Assign category + shelf  ┘  category/shelf stay sticky → next book. Repeat.

5. Clean up                 → Review page: assign the Uncategorized, fix missing
                               quantities/shelves, resolve duplicates. Badge → 0.

6. Export                   → Export → Full catalog CSV (+ printable summary) for
                               the department's records. Re-import anytime as backup.
```

**Persona notes**
- **Student assistant** lives in steps 3–4 (Add Item, "Save & add another"). Everything is optimized for them.
- **Department Head** owns steps 1–2 and 5–6 (setup, cleanup, export), and uses the Dashboard to gauge progress.
- **Other teachers** mostly use **Catalog** search: "do we have a class set of *The Crucible*, and where?"

---

## 8. Future enhancements (v2: design hooks, NOT v1 scope)

Designed so they slot into the existing UI without a redesign:

| Future feature | Where it lives | Hook already in v1 |
|---|---|---|
| **Photo → OCR titles** | Add Item: a "📷 Scan a stack" button opens the camera; extracted titles become a review queue of pre-filled Add forms. | The fast Add form + "Save & add another" loop. |
| **Category suggestion** | Add Item: a suggested category chip pre-highlights based on title/grade/notes; one tap to accept. | `CategoryChipPicker` already chip-based. |
| **Fuzzy duplicate detection** | Strengthen the Review "Possible duplicates" group + the inline `DuplicateHint`. | Both already exist with simple normalization. |
| **Auto cleanup report** | Review page: a "Generate report" button summarizing all gaps + suggested fixes. | Review already groups every gap type. |
| **QR-code labels** | Labels: a "Add QR code" toggle; code links to that shelf's filtered Catalog. | `LabelPreview` already composes label content. |

Each is additive; v1 ships fully usable without any of them.

---

## 9. Accessibility & quality bar

- **Color never stands alone**: every category color is paired with its text label.
- Tap targets ≥ 44px; inputs ≥ 16px font (prevents mobile zoom-on-focus).
- Full keyboard support on desktop; visible `--primary` focus ring.
- Works **offline** (no network dependency); data survives refresh via `localStorage`.
- Print stylesheets for Labels and the inventory summary hide all app chrome.

---

*End of spec. This document is the contract for a v1 build: React + Vite + TypeScript, offline localStorage + CSV, mobile-first, the seven screens above.*
