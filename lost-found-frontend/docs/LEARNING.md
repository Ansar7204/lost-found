# Learning guide: rebuild this app yourself

This project is two things: a working demo to show today, and a map for learning Angular the way
teams at companies write it. This guide covers:

1. [How to read this codebase](#1-how-to-read-this-codebase), in what order
2. [Concept map](#2-concept-map): every Angular idea used, and the file where you can see it
3. [How companies work](#3-how-companies-work): habits that matter as much as the code
4. [Rebuild roadmap](#4-rebuild-roadmap): 10 milestones to build it again from an empty folder
5. [Next challenges](#5-next-challenges) once you're done
6. [Resources](#6-resources)

Tip: don't copy-paste from this repo while rebuilding. Read a file, close it, write your
version, then compare. That's where the learning happens.

---

## 1. How to read this codebase

Read in this order. Each step builds on the one before.

| #   | File(s)                                                                                          | What you learn                                             |
| --- | ------------------------------------------------------------------------------------------------ | ---------------------------------------------------------- |
| 1   | `src/main.ts`, `src/app/app.config.ts`, `src/app/app.ts`                                         | How an Angular app starts                                  |
| 2   | `src/app/app.routes.ts`                                                                          | Which URL shows which page                                 |
| 3   | `src/app/core/models/models.ts`                                                                  | The data the whole app is about                            |
| 4   | `src/app/core/util/matching.ts` + its `.spec.ts`                                                 | Plain TypeScript logic, and how it's tested                |
| 5   | `src/app/core/data/db.store.ts`                                                                  | Signals, state, persistence                                |
| 6   | `src/app/core/state/items.store.ts`                                                              | A feature store: reading and changing data                 |
| 7   | `src/app/shared/ui/tag-card.ts`                                                                  | A small presentational component with inputs               |
| 8   | `src/app/features/browse/`                                                                       | A full page: URL state, computed data, template, SCSS      |
| 9   | `src/app/features/post/`                                                                         | Forms, validation, file upload, a modal as a child route   |
| 10  | `src/app/core/api/`                                                                              | How the frontend will talk to the real backend             |
| 11  | `src/styles/`, `src/styles.scss`                                                                 | How the styling is organised                               |

---

## 2. Concept map

### Components

A component = a TypeScript class + a template (HTML) + styles (SCSS). Since Angular 19,
components are **standalone** by default: no `NgModule`, each component lists what it uses in
`imports`.

| Concept                                    | Where to look                                                  |
| ------------------------------------------ | -------------------------------------------------------------- |
| Component with separate `.html` / `.scss`  | `features/browse/browse.ts`                                    |
| Inline template + styles (small ones)      | `shared/ui/avatar.ts`, `shared/ui/toggle.ts`                   |
| `input()` / `input.required()`             | `shared/ui/tag-card.ts`                                        |
| `output()` (events to the parent)          | `shared/ui/chat-thread.ts` (`send`, `action`)                  |
| `model()` (two-way binding `[(value)]`)    | `shared/ui/segmented.ts`, used in `features/alerts/alerts.html`|
| `host` bindings (class/style on the tag)   | `shared/ui/avatar.ts`, `layout/shell.ts`                       |
| `viewChild()` + `afterRenderEffect()`      | `shared/ui/chat-thread.ts` (auto-scroll to newest message)     |
| Generic component `Segmented<T>`           | `shared/ui/segmented.ts`                                       |

**Smart vs presentational components.** `TagCard`, `Avatar`, `ChatThread` get data through
inputs and report through outputs; they never inject a store. Pages in `features/` are the
"smart" ones: they inject stores and pass data down. This split is how most teams organise
components, because presentational ones are easy to reuse and test.

**File naming.** Angular's current style guide drops the `.component` suffix: `tag-card.ts`
with class `TagCard`, not `tag-card.component.ts` / `TagCardComponent`. Older codebases (and
most tutorials) still use the suffix. Both are fine; be consistent.

### Templates

| Concept                                          | Where to look                                         |
| ------------------------------------------------ | ----------------------------------------------------- |
| `@if` / `@else if` / `@else`                     | `features/item-detail/item-detail.html`               |
| `@if (x(); as x)` to name a value                | `features/item-detail/item-detail.html` (top)         |
| `@for (...; track ...)` + `@empty`               | `features/browse/browse.html`, `features/chats/chat-list.ts` |
| Property binding `[x]`, event binding `(x)`      | everywhere                                            |
| Template reference `#box` → `box.value`          | `layout/shell.html` (search input)                    |
| Pipes `{{ x \| timeAgo }}`                       | `shared/pipes/time.pipes.ts`, used in `tag-card.ts`   |
| `routerLink`, `routerLinkActive`                 | `layout/shell.html`                                   |

The `@if` / `@for` syntax replaced `*ngIf` / `*ngFor` in Angular 17. You'll still see the old one
in older projects.

### Signals: the core of modern Angular

A **signal** is a value that tells Angular when it changes.

```ts
const count = signal(0);         // writable
count.set(1); count.update(n => n + 1);
const double = computed(() => count() * 2);   // derived, read-only, cached
effect(() => console.log(count()));            // side effect, re-runs on change
```

| Concept                                   | Where to look                                                          |
| ----------------------------------------- | ---------------------------------------------------------------------- |
| `signal()` as the single source of truth  | `core/data/db.store.ts`                                                |
| `.asReadonly()` so only the store writes  | `core/data/db.store.ts`                                                |
| `computed()` for derived data             | `core/state/items.store.ts`, `features/browse/browse.ts`               |
| `effect()` + `untracked()`                | `features/item-detail/item-detail.ts` (mark chat read)                 |
| Observable → signal with `toSignal()`     | `features/post/post-item.ts` (form value), `layout/shell.ts` (router)  |

**Rule of thumb:** prefer `computed()`. Reach for `effect()` only to sync with the outside world
(storage, DOM, analytics). If you catch yourself setting a signal inside an effect, it
probably should have been a `computed()`.

**Immutable updates.** `DbStore.update()` always returns a *new* object
(`{ ...db, items: [...] }`) instead of mutating. Signals compare by reference, so mutating an
array in place would not notify anyone. This is the same rule as React state, NgRx and Redux.

### Change detection: zoneless + OnPush

Angular 22 apps run **without zone.js** and components are **OnPush by default**: Angular
re-renders a component only when a signal it reads changes, an input changes, or an event
fires in its template. That's why every piece of state in this app is a signal. If you store
state in a plain class field and change it from a `setTimeout`, the screen will not update.
Try it once to see it happen.

### Dependency injection (DI) and services

| Concept                                              | Where to look                                   |
| ---------------------------------------------------- | ----------------------------------------------- |
| `@Injectable({ providedIn: 'root' })` singleton      | every file in `core/state/`                     |
| `inject()` instead of constructor parameters         | everywhere                                      |
| Wrapping browser APIs in a service                   | `core/data/storage.service.ts`, `core/util/media.ts` |
| Replacing a built-in service (`TitleStrategy`)       | `core/page-title.strategy.ts`, `app.config.ts`  |
| Cleanup with `DestroyRef`                            | `core/data/db.store.ts`, `core/state/chat.store.ts` |

**Why stores?** Components never touch `DbStore` or `localStorage` directly; they call
`ItemsStore.post()` or `ChatStore.send()`. When the real backend arrives, only the stores
change, not the 10 components using them. This is the **facade** pattern.

### Routing

| Concept                                                 | Where to look                                  |
| ------------------------------------------------------- | ---------------------------------------------- |
| Lazy loading with `loadComponent`                       | `app.routes.ts` (check the build output: one chunk per page) |
| Child routes + nested `<router-outlet>`                 | `/post` is a child of Browse → the modal floats over it |
| Route params and query params as `input()`              | `withComponentInputBinding()` in `app.config.ts`; `no` in `item-detail.ts`, `cat`/`q` in `browse.ts` |
| Functional guards (`CanActivateFn`)                     | `core/auth/auth.guard.ts`                      |
| Redirect with a return URL (`?next=`)                   | `auth.guard.ts` → `features/auth/sign-in.ts`   |
| Route `data` read by a layout                           | `fullscreenOnMobile` in `app.routes.ts`, read in `layout/shell.ts` |
| Page titles                                             | `title:` in routes + `core/page-title.strategy.ts` |
| Wildcard `**` → 404 page                                | `app.routes.ts`, `features/not-found.ts`       |

**URL as state.** Browse keeps its filters in the query string
(`/?cat=Keys&places=Dorms&q=red`). Filtered views can be bookmarked and shared, Back works,
and refresh keeps them. The component never stores filters itself: it reads inputs and
navigates. Many junior codebases get this wrong.

### Forms

| Concept                                          | Where to look                                   |
| ------------------------------------------------ | ----------------------------------------------- |
| Typed reactive forms (`NonNullableFormBuilder`)  | `features/post/post-item.ts`, `features/auth/sign-in.ts` |
| Built-in validators                              | `Validators.required`, `maxLength`, `pattern`   |
| Custom validator function                        | `notInFuture` in `features/post/post-item.ts`   |
| Showing errors after touch/submit                | `showError()` in `post-item.ts`                 |
| Same limits as the backend                       | `LIMITS` mirrors C# `[StringLength]`            |
| Two controls bound to one value                  | Category `<select>` (desktop) + chips (mobile)  |
| Template-driven `ngModel` (the simpler kind)     | `shared/ui/chat-thread.ts`                      |

Angular 22 also ships **Signal Forms** (`@angular/forms/signals`), a newer API built on signals.
Most existing company code uses reactive forms, so learn those first, then try rewriting the
sign-in form with Signal Forms as an exercise.

### HTTP

| Concept                                         | Where to look                                   |
| ----------------------------------------------- | ----------------------------------------------- |
| `provideHttpClient(withFetch(), withInterceptors())` | `app.config.ts`                            |
| Typed `HttpClient` calls returning Observables  | `core/api/items-api.service.ts`                 |
| `HttpParams` for query strings                  | `search()` in the same file                     |
| Functional interceptor for errors               | `core/api/api-error.interceptor.ts`             |
| DTOs separate from UI models + a mapper         | `core/api/api.types.ts`, `core/api/items-api.mapper.ts` |
| Faking the server in tests                      | `core/api/items-api.service.spec.ts`            |
| Dev proxy to avoid CORS                         | `proxy.conf.json`                               |

### SCSS architecture

| Concept                                                | Where to look                               |
| ------------------------------------------------------ | ------------------------------------------- |
| Design tokens as CSS custom properties                 | `src/styles/_tokens.scss`                   |
| Mixins (`@use 'mixins' as *`)                          | `src/styles/_mixins.scss`                   |
| Include path so `@use 'mixins'` works anywhere         | `stylePreprocessorOptions` in `angular.json`|
| One breakpoint, two mixins (`mobile`, `desktop`)       | `_mixins.scss`, used in every page          |
| Global utility classes (`.btn`, `.input`, `.pill`)     | `src/styles.scss`                           |
| Component-scoped styles, `:host`, `:host(.x)`          | `shared/ui/avatar.ts`, `shared/ui/tag-card.scss` |
| `clip-path` for the notched tag shape                  | `tag-shape` mixin                           |
| CSS variables as component "props" (`--hole`, `--size`)| `tag-card.scss`, `avatar.ts`                |

Why CSS variables for tokens instead of SCSS `$variables`? SCSS variables disappear at build
time. CSS variables exist at runtime, so a light theme would only redefine `:root`.

### Accessibility (a11y)

Things that are easy to miss and that companies check:

- Real `<button>` for actions and `<a>` for navigation, never a clickable `<div>`
- Every input has a `<label>` (visible or `.visually-hidden`)
- Custom checkbox keeps the real `<input type="checkbox">` for keyboard and screen readers
  (`browse.scss` `.check`)
- `role="switch"` + `aria-checked` on the toggle, `role="radio"` on segments, `aria-modal` on the dialog
- `:focus-visible` outline in `styles.scss`; Escape closes the modal

### Testing

`npm test` runs **Vitest** (Angular's default runner since v21). Look at:

- `core/util/matching.spec.ts`: pure functions, the easiest and most valuable tests
- `shared/pipes/time.pipes.spec.ts`: `it.each` table tests
- `core/api/items-api.mapper.spec.ts`: mapping DTOs
- `core/api/items-api.service.spec.ts`: HTTP with `HttpTestingController`
- `core/state/items.store.spec.ts`: stores working together through `TestBed`

The **testing pyramid**: many fast unit tests at the bottom, fewer integration tests, very
few slow end-to-end (browser) tests on top. A good next step is adding Playwright e2e tests
for the demo script in the README.

---

## 3. How companies work

The code is half of it. These habits are what reviewers and team leads notice.

**Structure**
- *Feature folders* (`features/browse/`), not type folders (`components/`, `services/`).
  When you delete a feature, you delete one folder.
- `core/` = app-wide singletons, `shared/` = reusable UI, `features/` = pages.
- Keep backend shapes (DTOs) at the edge and map them to your own models.

**Code quality**
- TypeScript `strict` on; no `any` (`$any()` in templates counts too).
- Prettier formats everything so reviews talk about logic, not spaces. Many teams add ESLint
  too: `ng add @angular-eslint/schematics`.
- Name things for what they mean (`openItems`, `countMatchingSearches`), not how they work.
- Comments explain *why*, not *what*.

**Git and reviews**
- Small branches, one topic each: `feature/saved-search-toggle`, `fix/chat-scroll`.
- Clear commit messages. Many teams use *Conventional Commits*:
  `feat(browse): filter by place`, `fix(chat): keep newest message in view`.
- Every change goes through a pull request with a description and screenshots for UI.
  Someone else reviews it before merge.
- CI (`.github/workflows/ci.yml`) runs format check, tests and build on every PR. Red CI =
  no merge.

**Working with the backend team**
- Agree on the API contract first (OpenAPI / Swagger). The ASP.NET backend already calls
  `AddOpenApi()`; its spec at `/openapi/v1.json` can generate TypeScript types.
- Build against a mock until the API exists (exactly what this repo does).
- Keep a list of contract questions (see `docs/BACKEND_INTEGRATION.md`) and settle them
  together, not in code comments.

**Product habits**
- Every list has an empty state, every action shows its result, every form says what's wrong.
- Check the mobile layout and keyboard navigation before calling it done.
- Watch bundle size: `ng build` prints it, and `angular.json` has budgets that fail the build
  if a page gets too big.

---

## 4. Rebuild roadmap

Build it again in a **new folder** (keep this repo open as a reference). Each milestone ends
with something that runs. Commit after each one.

### Milestone 0: setup (1 h)
- Install Node 24, run `npx @angular/cli@latest new lost-found --style=scss --ssr=false`.
- Run it, open the files, delete the welcome page.
- Add Prettier's `format` script and the Google Fonts `<link>` in `index.html`.
- **Done when:** `npm start` shows "Hello" on a charcoal background.

### Milestone 1: design tokens and global styles (2 h)
- Create `src/styles/_tokens.scss` from the tables in `docs/design/README.md`.
- Create `_mixins.scss` with `mobile`, `desktop`, `mono`, `tag-shape`.
- Add `stylePreprocessorOptions.includePaths` to `angular.json`.
- Write `.btn`, `.btn--primary`, `.input`, `.pill` in `styles.scss`.
- **Done when:** a test page shows a primary button, an input and an amber pill that look like
  the design.

### Milestone 2: models and seed data (1-2 h)
- Write `models.ts` (start with just `Item` and `CATEGORIES`).
- Write a `seed.ts` with 8 items.
- Write `matchesFilter()` and its first unit test.
- **Concepts:** union types, `as const`, `(typeof X)[number]`, pure functions, Vitest.
- **Done when:** `npm test` is green.

### Milestone 3: the tag card (2 h)
- `ng generate component shared/ui/tag-card`.
- `item = input.required<Item>()`, render it, style it with `tag-shape`.
- Render a grid of seed items in `App` with `@for`.
- **Concepts:** components, inputs, `@for` + `track`, `:host`, component SCSS.
- **Done when:** the grid looks like screen D1 (without the sidebar).

### Milestone 4: store with signals (2-3 h)
- `DbStore` with `signal<Db>`, `update()`, save to `localStorage`.
- `ItemsStore` with `items` and `openItems` as `computed()`.
- Components inject `ItemsStore`, never `DbStore`.
- **Concepts:** services, DI, `inject()`, `signal`, `computed`, immutable updates.
- **Done when:** changing `localStorage` by hand and reloading changes the grid.

### Milestone 5: routing and layout (2-3 h)
- Routes: `/` Browse, `/item/:no` detail, `**` not found. Use `loadComponent`.
- `Shell` with the top bar and `<router-outlet>`.
- `withComponentInputBinding()` so `/item/:no` arrives as `no = input.required<string>()`.
- **Concepts:** router, lazy loading, route params, `routerLink`, `routerLinkActive`.
- **Done when:** clicking a card opens its detail page, Back returns.

### Milestone 6: filters in the URL (3 h)
- Sidebar with categories and place checkboxes; time range segmented control.
- Every click only calls `router.navigate([], { queryParams, queryParamsHandling: 'merge' })`.
- Read `cat`, `places`, `q` as inputs; compute `visibleItems` from them.
- **Concepts:** query params, `computed` chains, generic component with `model()`.
- **Done when:** filtering, refreshing and pressing Back all behave.

### Milestone 7: post form (3-4 h)
- `/post` as a **child route** of Browse; the component is a fixed overlay.
- Typed reactive form with `required`, `maxLength`, and your own `notInFuture` validator.
- Live preview: `toSignal(form.valueChanges)` → `computed` → `<app-tag-card>`.
- **Concepts:** reactive forms, custom validators, RxJS → signals, file input.
- **Done when:** posting adds a card to Browse and invalid input shows messages.

### Milestone 8: auth, saved searches, notifications (3-4 h)
- `AuthService` with a `currentUser` signal; `authGuard` redirects to `/signin?next=...`.
- `AlertsStore`: save/remove a search, list notifications, unread count badge.
- In `ItemsStore.post()`, create notifications for matching searches (reuse `matchesFilter`!).
- **Concepts:** guards, cross-store logic, one atomic `update()`.
- **Done when:** the README's demo step 4 works (two tabs need the `storage` event listener).

### Milestone 9: chat and mark as returned (3 h)
- `ChatStore`: threads, `send`, `markRead`, unread count.
- Presentational `ChatThread` with `output()` events, used in two places.
- "Mark as returned" only for the finder; move the item to the owner's "Got back".
- **Concepts:** reuse, outputs, `effect` + `untracked`, `afterRenderEffect`.

### Milestone 10: mobile, polish, tests (open-ended)
- Bottom tab bar, M1-M7 layouts with the `mobile` mixin.
- Empty states, focus styles, labels, Escape to close.
- Tests for each store; a GitHub Actions workflow.
- **Done when:** a friend can use it on their phone without asking you anything.

---

## 5. Next challenges

Pick these up after the rebuild, roughly easiest first.

1. Add **ESLint** (`ng add @angular-eslint/schematics`) and fix what it reports.
2. **Pagination** on Browse ("Load more"), matching the backend's `page` / `pageSize`.
3. Rewrite the sign-in form with **Signal Forms**.
4. **Skeleton loading** cards (the design describes them) while data "loads".
5. **i18n**: Russian and Kazakh translations (`ng add @angular/localize`). The backend's
   validation messages are already in Russian.
6. **Playwright e2e test** of the demo script.
7. **Connect the real backend** for items (see `BACKEND_INTEGRATION.md`), using
   `httpResource()` or `rxResource()` for loading/error states.
8. **Microsoft Entra ID sign-in** with MSAL Angular.
9. **PWA** (`ng add @angular/pwa`) so it installs on phones.
10. **Real-time chat** with SignalR (the natural choice next to ASP.NET Core).

---

## 6. Resources

- Official docs and tutorials: https://angular.dev (start with "Tutorials" and "Essentials")
- Signals guide: https://angular.dev/guide/signals
- Style guide: https://angular.dev/style-guide
- Forms: https://angular.dev/guide/forms/reactive-forms
- Testing: https://angular.dev/guide/testing
- TypeScript handbook: https://www.typescriptlang.org/docs/handbook/
- Sass basics: https://sass-lang.com/guide/
- Accessibility: https://web.dev/learn/accessibility
- Conventional Commits: https://www.conventionalcommits.org

## Glossary

| Term           | Meaning                                                                     |
| -------------- | --------------------------------------------------------------------------- |
| Component      | Class + template + styles; one piece of UI                                  |
| Signal         | Reactive value; reading it in a template subscribes the view to it          |
| Computed       | Signal derived from other signals, recalculated only when they change       |
| Effect         | Code that runs when signals it reads change; for side effects only          |
| DI             | Dependency injection: Angular creates services and hands them to you        |
| Store / facade | Service that owns state and exposes read-only signals + methods to change it|
| Guard          | Function deciding if a route can open                                       |
| Interceptor    | Function every HTTP request passes through                                  |
| DTO            | Data Transfer Object: the exact JSON shape the backend sends                |
| Mapper         | Function converting DTOs to the app's own models and back                   |
| OnPush         | Change detection that re-renders only on input/signal/event changes         |
| Zoneless       | Angular without zone.js; signals tell it when to update                     |
