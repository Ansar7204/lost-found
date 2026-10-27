# Handoff: KBTU Lost & Found — frontend MVP

## Overview
A campus lost-and-found marketplace for KBTU students. People who find something post it; people who lost something browse, filter by category and campus location, message the finder, and save searches that notify them when a new matching item appears.

Goal of this MVP: a **clickable frontend demo for showcasing**, no real backend. All data is mock data persisted in `localStorage`, so posting, saving searches, chatting and "mark as returned" all appear to work.

## About the design files
`Lost & Found.dc.html` is a **design reference built in HTML**, not production code. Open it in a browser (keep `support.js` next to it). It is a canvas showing every screen side by side. Recreate these screens in a real app; don't ship or copy the HTML.

The file contains two directions:
- **Turn 2, "warm workspace" (top of the file, badges `2a` desktop and `2b` mobile). BUILD THIS ONE.**
- Turn 1, "luggage tag" (lower in the file, `1a`/`1b`). Older direction, reference only.

## Recommended stack (no existing codebase)
- Vite + React + TypeScript
- React Router (routes below)
- Plain CSS modules or Tailwind with the tokens below as theme values. No component library; the look is custom.
- State: a small store (Zustand or React context) backed by `localStorage`. Seed it from `mock-data.json`.
- Photos: `<input type="file">` → `URL.createObjectURL` / base64 in localStorage. Until real photos exist, use the striped placeholder (see Tokens).
- Deploy target: Vercel / Netlify / GitHub Pages as a static site.
- Responsive: one app. ≥1024px uses the desktop layouts (D1–D4); <1024px uses the mobile layouts (M1–M7) with a bottom tab bar.

## Fidelity
**High fidelity** for colors, type, spacing and the tag-card shape. Recreate them exactly. Layouts at 1440 (desktop) and 390 (mobile) are the reference widths; between them, let grids reflow (4 → 3 → 2 columns).

## Routes
| Route | Desktop | Mobile |
|---|---|---|
| `/signin` | — (use mobile layout centered) | M1 |
| `/` | D1 Browse | M2 Browse |
| `/item/:no` | D2 Detail (chat in right panel) | M3 Detail |
| `/chats/:id` | D2 panel | M4 Chat |
| `/post` | D3 modal over Browse | M5 full screen |
| `/alerts` | D4 Saved searches + notifications | M6 Alerts |
| `/me` | "My posts" (reuse M7 list in main column) | M7 Profile |

## Design tokens

### Colors (warm charcoal, never cold/blue grey)
| Token | Hex | Use |
|---|---|---|
| bg-deep | `#1B1917` | modal backdrop |
| bg-sunken | `#24221F` | detail page bg, table header, mobile tab bar, preview pane |
| bg | `#2A2825` | app background, top bar, panels |
| surface | `#34312D` | tag cards, badges, hover rows |
| surface-hover | `#3D3934` | card hover |
| surface-active | `#403C37` | selected sidebar item, selected segment |
| border | `#3B3834` | all 1px dividers; other-person chat bubble; chips |
| border-input | `#4A4640` | inputs, search pill |
| border-button | `#58534C` | secondary button border |
| border-strong | `#625D56` | unchecked checkbox, dashed upload tile |
| placeholder-a / b | `#3F3B36` / `#3A3632` | striped photo placeholder |
| text | `#F2EEE7` | primary text; also primary button bg |
| text-2 | `#D6D0C6` | sidebar items, chip text |
| text-3 | `#B0AAA0` | secondary text, inactive nav |
| text-4 | `#857F75` | labels, meta, mono captions |
| text-on-light | `#1F1D1A` | text on primary buttons / own chat bubbles |
| status-new (amber) | `#F2B33D` | "New", "Found · waiting", "Open", new matches |
| status-returned (green) | `#4CC27A` | returned, alerts-on, avatar |
| status-unread (red) | `#EF5B4C` | unread dots, count badges |

Rule: colour appears **only** as status. Everything else is charcoal + off-white. Status is shown as a 6px dot + label inside a `surface` pill (`padding:2px 7px; radius 4px; 11px/600`).

### Typography
- **Archivo** (variable, with width axis) — all UI. Google Fonts: `Archivo:wdth,wght@62..125,100..900`.
- **IBM Plex Mono** 400/500/600 — item numbers (`Nº 0412`), timestamps, uppercase section labels, table headers.

| Role | Size / weight | Extras |
|---|---|---|
| Page title desktop | 30px / 800 | `font-variation-settings:'wdth' 118`, letter-spacing −0.025em, lh 1.05 |
| Page title mobile | 26px / 800 | wdth 118, −0.02em |
| Sign-in hero | 44px / 850 | wdth 122, −0.03em, lh 0.95 |
| Detail title | 24px (desk) / 26px (mob) / 800 | wdth 112, −0.02em |
| Logo wordmark | 15px / 800 | wdth 118 |
| Card title | 14px / 700 | lh 1.25 |
| Body / UI desktop | 13px / 400–600 | |
| Body mobile | 13–14px | |
| Secondary | 12px | text-3 |
| Mono label | 10–11px | text-4, uppercase for section labels |

### Radii
Buttons 5px (desktop) / 8px (mobile). Inputs 5px / 8px. Badges 4px. Chips 15px (pill). Search 16–19px (pill). Modal 10px. Chat bubbles 10–12px with the "tail" corner at 2px. Avatars 50%.

### Spacing
4px base. Common: 6, 8, 10, 12, 14, 16, 18, 20, 24, 28, 32. Desktop content padding 28px 32px. Mobile side padding 16px.

### Shadow
Only the post modal: `0 24px 60px rgba(0,0,0,.5)`.

### Signature element: the tag card
Every listing is a luggage tag:
- `background: surface; clip-path: polygon(16px 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 0 100%, 0 16px)` (top corners notched; 12px on mobile)
- Hole punch: 10px circle (8px mobile), color = page background, absolutely centered at top 8px (6px mobile)
- Padding `24px 10px 12px` (mobile `20px 8px 10px`), gap 10px
- Photo 150px tall (104px mobile), radius 3px. Placeholder: `repeating-linear-gradient(135deg,#3F3B36 0 7px,#3A3632 7px 14px)`
- "New" badge top-left on photo: `bg` pill with amber dot
- Meta row (mono 10px text-4): `Nº 0412` left, `2H AGO` right
- Title 14px/700, then `place · held` 12px text-3
- Hover: background `surface-hover`
The logo mark is the same tag shape (20×24, off-white, dark hole).

## Screens

### D1 Browse (desktop, `/`)
- **Top bar** 48px, border-bottom. Left: logo block with right border (padding 0 18px). Nav (gap 26px, 600): Browse (active = text), Saved searches, My posts, Chats + red count badge. Right: search pill 300×32 "Search found items", primary button "+ Post found item" (30px tall, bg text, color text-on-light, 700), avatar 28px green with initial.
- **Sidebar** 232px, border-right, padding 14px 8px. Mono label `CATEGORY`, then 8 rows (28px, radius 5, hover `#34312D`, active bg `#403C37` 600). Divider. Label `WHERE ON CAMPUS`, 6 checkbox rows with a right-aligned mono count. Checkbox 13px: off = 1px `#625D56` border; on = off-white fill with ✓.
- **Main** padding 28px 32px, gap 18px:
  - Title: `<muted>Found in</muted> {category} · {places}` e.g. "Found in anything · all of campus".
  - Toolbar (border-bottom, pb 14): segmented time filter Today / This week (active) / This month; mono count `8 ITEMS · THIS WEEK`; spacer; save button; "Newest ▾" sort.
  - Save button states: off → "Save search & notify me" (border `#58534C`); on → "✓ Alerts on for this search" (green border + text).
  - Grid: 4 columns, gap 20px, tag cards.
  - Empty: centered "No matches yet" + "Save this search and you'll be notified when one is posted."

### D2 Listing detail (desktop, `/item/:no`)
- Breadcrumb bar 48px: `← Browse / Electronics / AirPods Pro case, white`, right mono `Nº 0412`.
- Left: padding 32px, big photo (flex:1, radius 6) + thumbnail row 80×56 (selected has 1.5px off-white border).
- Right panel 390px, bg `#2A2825`, border-left, stacked sections separated by borders:
  1. Status pill "Found · waiting for owner" (amber), title, description.
  2. Key/value grid (96px label column): Found at / When / Now with.
  3. Finder row: 28px avatar (amber, initials), name, "Returned 4 items before".
  4. Chat thread (flex:1, bottom-aligned). Own bubble: off-white bg, dark text, radius `10 10 2 10`, right. Other: `#3B3834`, radius `10 10 10 2`, left. Max-width 80%.
  5. Composer: input 36px "Write to Daniyar…"; two buttons: "Send" (primary) and "Mark as returned" (secondary with green dot; visible only to the finder).

### D3 Post a found item (desktop modal, `/post`)
- Backdrop `#1B1917`. Modal 860px wide. Header 48px "Post a found item" + ×.
- Two columns: form (flex) | preview 260px (bg `#24221F`).
- Form fields (label 12px text-3, gap 5): photo tiles 84px (dashed + add tile); **What is it** (text); **Category** (select) + **When** (datetime) in 2 columns; **Where you found it** (select of campus places + detail text, e.g. "Library · 2nd floor"); **Description** (textarea) with hint "Leave one detail out so the real owner can prove it's theirs."; **Where is it now** segmented: With me / Security desk / Library desk.
- Focused input: border `#F2EEE7`; otherwise `#4A4640`.
- Preview: a live tag card that updates as the user types, with next `Nº` and "JUST NOW".
- Footer: amber dot + "{n} saved searches match. They'll be notified." (computed live from saved searches), Cancel, "Post item".
- Validation: title and category and place required; Post disabled until valid.

### D4 Saved searches + notifications (desktop, `/alerts`)
- Main: title "Saved searches" + "+ New search". Table (border, radius 6): header row 34px mono uppercase on `#24221F`; columns `NAME 1.2fr | FILTERS 1.6fr | NOTIFY VIA 130px | MATCHES 110px | ON 60px`; rows 52px, hover. Filters rendered as small chips. Matches: amber dot + "1 NEW MATCH" or muted "None yet". ON: toggle 28×16 (on = off-white track, dark knob right).
- Right panel 380px: header 44px "Notifications" + "Mark all read". Rows: 8px column with red unread dot, title + sub, time.

### M1 Sign in
Logo tag 40×50, hero "Lost & / Found / KBTU" (KBTU muted), tagline "Find what you lost on campus, or post what you found." Bottom: label "University email", input showing the `@kbtu.kz` suffix muted, "Continue" primary, caption "We'll email you a 6-digit code." MVP: accept any `@kbtu.kz` email, fake OTP step (any 6 digits).

### M2 Browse
Title "Found items" + bell button 36px with red count. Search pill 38px. Horizontal scroll of category chips (active = off-white bg, dark 700). Row "Notify me about new matches" with "Save" / "✓ Saved". 2-column grid of mobile tag cards. **Bottom tab bar** 78px on `#24221F`: Browse, Alerts, center "+" (40×32 off-white), Chats, Me.

### M3 Detail
Photo 330px with back button (36px circle, `rgba(36,34,31,.85)`) and "1/3" counter. Status pill + Nº, title, description, key/value box (Found at / Now with / Category). Sticky bottom CTA "This is mine · Message finder".

### M4 Chat
Header: back, avatar, name, "AirPods Pro case · Nº 0412". Bubbles as D2 (radius 12). System line with green dot: "Daniyar marked this item as returned". Composer: pill input + 40px round send "↑".

### M5 Post
Header Cancel / "Post found item". Photo tiles 96px, What is it, Category chips (single-select), Where you found it (select), Where is it now (With me / At a desk). Sticky "Post item".

### M6 Alerts
Title, segmented Notifications / "Saved searches · 3", notification list (same as D4 panel).

### M7 Profile
Avatar 48 green, name, email, "Settings". Tabs "Posted by me" / "Got back" (active underline 1.5px). Rows: 52px thumb, mono Nº, title, sub, status pill (amber "Open" / green "Returned").

## Interactions & behavior
- **Filtering** (D1/M2): category single-select (includes "All"); places multi-select; time Today/This week/This month; text search matches title + description. Changing any filter resets the "saved" state of the current view.
- **Save search**: stores `{name, category, places, query, channel}`. Name defaults to the query or category. Toggling again removes it.
- **Matching / notifications**: when an item is posted, check every saved search; for each match, create an unread notification "New match for “{name}”: {title}" and increment that search's new-match count. This is the core demo moment — post as one user, see the alert as another (a user switcher in Settings is fine for the demo).
- **Unread badges**: nav "Chats" count = unread chat threads; bell count = unread notifications. Opening clears them.
- **Chat**: "This is mine · Message finder" opens/creates a thread for that item. Messages append locally. For the demo, optionally auto-reply from the finder after ~1.5s.
- **Mark as returned** (finder only): item status → returned (green), system message in chat, item leaves Browse, moves to "Got back" for the owner.
- **Transitions**: keep them minimal. 120ms background-color on hover; modal fade/scale 150ms ease-out. No other animation.
- **Loading**: skeleton = tag card with striped placeholder and grey bars.
- **Empty states**: copy given in D1; saved searches with no results show "None yet".

## State / data model
```ts
type Item = { no: string; title: string; category: Category; place: string; placeDetail?: string;
  held: 'With finder' | 'Security desk' | 'Library desk' | string; foundAt: string /*ISO*/;
  description: string; photos: string[]; finderId: string; status: 'open' | 'returned'; ownerId?: string };
type SavedSearch = { id: string; userId: string; name: string; category: Category | 'All';
  places: string[]; query?: string; channel: 'PUSH' | 'EMAIL' | 'PUSH + EMAIL'; on: boolean; newMatches: number };
type Notification = { id: string; userId: string; title: string; sub: string; createdAt: string; read: boolean; link: string };
type Thread = { id: string; itemNo: string; participants: string[]; messages: { from: string; text: string; at: string; system?: boolean }[] };
type User = { id: string; name: string; email: string; initials: string; returnedCount: number };
```
Categories: All, Electronics, Cards & IDs, Keys, Clothing, Bottles, Books & notes, Other.
Campus places: Main building, Library, Canteen, Lab block, Sports hall, Dorms.
Seed data: `mock-data.json` (copy from the design).

Later (not MVP): swap localStorage for Supabase/Firebase (auth via KBTU email magic link, realtime chat, push/email for saved-search matches).

## Assets
- Fonts: Archivo, IBM Plex Mono (Google Fonts).
- Icons: the design uses minimal CSS shapes and characters (←, ✓, ×, ▾, ↑, +). Use a thin line icon set (e.g. Lucide at 1.5px stroke) for search, bell, back, send if preferred.
- Photos: none yet; use the striped placeholder with a mono caption (e.g. "airpods case"). Real photos of KBTU buildings could be added later for location filters.

## Files
- `Lost & Found.dc.html` — the design canvas (open in a browser, needs `support.js` beside it). Top section = the direction to build.
- `support.js` — runtime needed only to view the design file.
- `mock-data.json` — seed data taken from the design.

## Suggested first prompt for Claude Code
> Read README.md in this folder and open `Lost & Found.dc.html` for reference. Build the frontend MVP described there as a Vite + React + TypeScript app with React Router and a localStorage-backed store seeded from mock-data.json. Match the Turn 2 "warm workspace" design exactly (tokens, tag card, layouts D1–D4 on desktop, M1–M7 on mobile). Make post → saved-search match → notification work end to end.
