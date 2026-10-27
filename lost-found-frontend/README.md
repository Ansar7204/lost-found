# Lost & Found · KBTU (Angular frontend)

A campus lost-and-found for KBTU students. People who find something post it; people who lost
something browse, filter by category and place, message the finder, and save searches that
notify them when a matching item is posted.

This is the **frontend MVP**: Angular 22 + TypeScript + SCSS, built from the design handoff in
[`docs/design/`](docs/design/README.md) ("warm workspace" direction). Since Sprint 1, sign-in,
posting and browsing items run on the ASP.NET Core API in this repo (`../src/LostAndFound.Api`);
chats, saved searches and notifications are still kept in `localStorage` until their APIs land.

> Learning Angular with this project? Start with **[docs/LEARNING.md](docs/LEARNING.md)**.
> Connecting the real backend? See **[docs/BACKEND_INTEGRATION.md](docs/BACKEND_INTEGRATION.md)**.

## Quick start

Requires **Node.js 22.22.3+ or 24+** (see `.nvmrc`).

```bash
# from the repo root: databases + API (see docs/BACKEND_INTEGRATION.md)
docker compose up -d
dotnet run --project src/LostAndFound.Api --launch-profile http   # http://localhost:5043

# here
npm install
npm start            # http://localhost:4200, /api is proxied to :5043
```

| Command           | What it does                             |
| ----------------- | ---------------------------------------- |
| `npm start`       | Dev server with live reload              |
| `npm run build`   | Production build into `dist/lost-found/` |
| `npm test`        | Unit tests (Vitest) in watch mode        |
| `npm run test:ci` | Unit tests once, like CI does            |
| `npm run format`  | Format all code with Prettier            |

## Demo script (≈3 minutes)

1. **Sign in** as Aruzhan: click **Aruzhan** under "Demo accounts" (or type any `@kbtu.kz` login).
   Locally this is the development sign-in; production uses "Sign in with Microsoft".
2. **Browse**: pick a category, tick places, switch Today / This week / This month, type in the
   search bar. The URL changes with every filter, so you can refresh or share the link.
3. **Save a search**: "Save search & notify me" turns green: "✓ Alerts on for this search".
4. **The key moment: post → match → alert.** Open a **second tab**, go to
   `http://localhost:4200/signin`, and sign in as **Daniyar**. Post a found item
   (e.g. "AirPods Max", Electronics, Library). The footer already says
   "1 saved search match. They'll be notified." Post it, then switch back to Aruzhan's tab:
   the **Saved searches** badge went up by itself and the alert is at the top.
5. **Chat**: as Aruzhan, open the item and write to the finder. The finder answers
   (auto-reply in the demo).
6. **Mark as returned**: as Daniyar, press "Mark as returned". The item leaves Browse and appears
   under Aruzhan's **Me → Got back**.
7. Resize the window below 1024px (or open DevTools device mode) to see the **mobile layout** with
   the bottom tab bar.

**Me → Settings** switches user in the same tab (dev sign-in only) and can clear local chats and
alerts. Items live in Postgres; restart from scratch with `docker compose down -v`.

## Tech stack

- **Angular 22**: standalone components, signals, zoneless change detection, new control flow
  (`@if`, `@for`), `input()` / `output()` / `model()`, functional guards and interceptors,
  lazy-loaded routes, typed reactive forms
- **TypeScript 6** in strict mode
- **SCSS**: design tokens as CSS custom properties, shared mixins, component-scoped styles
- **Vitest** for unit tests, **Prettier** for formatting, **GitHub Actions** CI
- No UI library: the look is custom, as the design asks

## Project structure

```
src/
├── styles/                 Design tokens (_tokens.scss) and SCSS mixins (_mixins.scss)
├── styles.scss             Global styles: base, buttons, inputs, status pills
├── environments/           Build-time config (API base URL)
└── app/
    ├── app.config.ts       App-wide providers (router, HttpClient, title strategy)
    ├── app.routes.ts       All routes, lazy-loaded
    ├── core/               Singletons with no UI
    │   ├── models/         Domain types used by the UI (Item, SavedSearch, ...)
    │   ├── data/           DbStore (the single source of truth), seed data, storage
    │   ├── state/          Feature stores: ItemsStore, AlertsStore, ChatStore
    │   ├── auth/           AuthService (MSAL / dev sign-in), auth interceptor, route guards
    │   ├── api/            Real backend: DTOs, mapper, HTTP client, error interceptor
    │   └── util/           Pure helpers (matching, images, viewport)
    ├── shared/             Reusable presentational pieces
    │   ├── ui/             TagCard, Avatar, Photo, Segmented, Toggle, ChatThread, Logo
    │   └── pipes/          timeAgo, when
    ├── layout/             Shell: desktop top bar + mobile tab bar
    └── features/           One folder per page
        ├── auth/           Sign in (M1)
        ├── browse/         Browse (D1 / M2)
        ├── post/           Post a found item (D3 / M5)
        ├── item-detail/    Listing detail + chat panel (D2 / M3)
        ├── chats/          Chat list and conversation (M4)
        ├── alerts/         Saved searches + notifications (D4 / M6)
        └── profile/        My posts / Got back / Settings (M7)
```

## Routes

| Route        | Screen                               |
| ------------ | ------------------------------------ |
| `/signin`    | Sign in                              |
| `/`          | Browse (filters in the query string) |
| `/post`      | Post modal on top of Browse          |
| `/item/:no`  | Item detail (`/item/0412`)           |
| `/chats`     | All conversations                    |
| `/chats/:id` | One conversation                     |
| `/alerts`    | Saved searches and notifications     |
| `/me`        | My posts, Got back, Settings         |

## Status

| Area                              | State                                                   |
| --------------------------------- | ------------------------------------------------------- |
| Sign in with KBTU account (US-01) | API: Entra ID (MSAL) in production, dev sign-in locally |
| Post a found item (US-02)         | API, server validation shown on the form                |
| Browse by category (US-03)        | API, loading / empty / error states                     |
| Mark as returned                  | API (`PATCH`); owner's "Got back" waits for US-07/10    |
| Photo upload                      | First photo uploaded to the API (up to 3 in US-11)      |
| Chat, saved searches, alerts      | Still local (`localStorage`), Sprints 2–3               |
