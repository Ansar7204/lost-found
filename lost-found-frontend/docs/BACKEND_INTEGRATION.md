# Backend integration

The backend is the ASP.NET Core Web API in this repo (`src/LostAndFound.Api`: .NET 10,
EF Core + PostgreSQL for items, MongoDB for chat, Microsoft Entra ID auth).

**Status after Sprint 1 (US-01, US-02, US-03):** sign-in, posting and browsing run on the real
API. Chats, saved searches and notifications still run on the local `DbStore` (Sprints 2–3).

## Run everything locally

```bash
docker compose up -d                                              # Postgres :5433, Mongo :27018
dotnet run --project src/LostAndFound.Api --launch-profile http   # http://localhost:5043
cd lost-found-frontend && npm start                               # http://localhost:4200
```

- In Development the API applies EF migrations on start (`Database:MigrateOnStartup`, default
  `true`), so there is no separate `dotnet ef database update` step.
- `ng serve` proxies `/api/*` to `http://localhost:5043` (`proxy.conf.json`), so no CORS setup.
- `src/LostAndFound.Api/LostAndFound.Api.http` has ready-made requests for every Sprint 1 endpoint.

## Sign-in (US-01)

Two modes. The frontend (`environment*.ts → auth.mode`) and the API (`Auth:Mode`) must match.

| Mode                   | Frontend | API (`appsettings.*.json`)                        | How it works                                                                                                                             |
| ---------------------- | -------- | ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Dev (default locally)  | `'dev'`  | `"Auth": { "Mode": "Dev" }`                       | Type any `@kbtu.kz` login; requests carry `X-Dev-User: <email>`. **Development only** — the API refuses to start in this mode elsewhere. |
| Microsoft (production) | `'msal'` | `"Auth": { "Mode": "Entra" }` (or no `Auth:Mode`) | "Sign in with Microsoft" (MSAL redirect); requests carry `Authorization: Bearer <token>` with the `access_as_user` scope.                |

In both modes the API only accepts accounts whose email ends with `Auth:AllowedEmailDomain`
(`kbtu.kz`); others get `403`, and the sign-in page says so. In production set it through the
environment: `Auth__AllowedEmailDomain=kbtu.kz` (plus `AzureAd__TenantId`, `AzureAd__ClientId`,
`ConnectionStrings__Postgres`, `MongoDb__*`), since `appsettings.json` is not in git.

The user always comes from `GET /api/me` (`{ userId, name, email }`), so the frontend and the
backend agree on ids. After sign-in the user lands on the page they first asked for
(`authGuard` → `/signin?next=…` → MSAL `state` / router).

### Entra ID checklist for the `msal` mode

The app registration `51c93c36-…` (tenant `57081b5e-…`) is used for both the API and the SPA:

1. Azure portal → App registrations → the app → **Authentication** → add platform
   **Single-page application** with redirect URIs `http://localhost:4200` and the production URL.
2. **Expose an API** → Application ID URI `api://51c93c36-83bc-464e-8229-2d739b278dc7`, scope
   `access_as_user` (the API already requires it).
3. **API permissions** → add _My APIs → access_as_user_ and grant consent.
4. To let KBTU students in, the registration must accept their accounts: either it lives in the
   KBTU tenant, or it is multi-tenant ("Accounts in any organizational directory") — then set
   `tenantId: 'organizations'` in `environment.ts` and `AzureAd:TenantId` = `organizations` in the API.

## API (Sprint 1)

All endpoints need auth (see above). Enums go over the wire as **numbers**.

| Method  | Path                       | Body / query                                                                      | Response                                                                           |
| ------- | -------------------------- | --------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `GET`   | `/api/me`                  |                                                                                   | `{ userId, name, email }`; `403` if not KBTU                                       |
| `GET`   | `/api/items`               | `?category&status&cabinet&mine&page=1&pageSize=20` (max 100), newest first        | `{ items: FoundItemDto[], totalCount, page, pageSize }`                            |
| `GET`   | `/api/items/{id:guid}`     |                                                                                   | `FoundItemDto`                                                                     |
| `GET`   | `/api/items/{number:int}`  | the short Nº from the URL, `/api/items/413`                                       | `FoundItemDto`                                                                     |
| `POST`  | `/api/items`               | `{ name ≤150, description? ≤1024, category, cabinet ≤100, heldAt? ≤50, foundAt }` | `201 FoundItemDto`; `400` ValidationProblem (`FoundAt` in the future, empty name…) |
| `POST`  | `/api/items/{id}/photo`    | multipart `photo` (JPEG/PNG ≤ 5 MB, one per item)                                 | `{ photoUrl }`                                                                     |
| `GET`   | `/api/items/{id}/photo`    |                                                                                   | image (needs auth → `<app-photo>` fetches it as a blob)                            |
| `PATCH` | `/api/items/{id}/returned` |                                                                                   | `204`; `403` if you're not the finder                                              |
| `GET`   | `/health`                  |                                                                                   | health check                                                                       |

`FoundItemDto`: `{ id, number, userFoundId, finderName, name, description, category, cabinet,
heldAt, status, foundAt, createdAt, photoUrl }`.

- `ItemCategory`: 0 Accessory (legacy → "Other"), 1 Clothing, 2 Electronics, 3 Documents
  ("Cards & IDs"), 4 Keys, 5 Other, 6 Bottles, 7 BooksAndNotes ("Books & notes")
- `FoundItemStatus`: 0 Open, 1 Claimed (shown as open), 2 Returned

Migration `20261027120000_Sprint1ItemFields` adds `Number` (identity, unique), `FinderName`,
`HeldAt` and widens `Name` to 150.

## Frontend pieces

- `core/api/api.types.ts` — DTOs 1:1 with the C# records
- `core/api/items-api.mapper.ts` — DTO ⇄ model (`number 413` → `no '0413'`, `cabinet` ⇄ place + detail)
- `core/api/items-api.service.ts` — typed `HttpClient` calls
- `core/auth/auth.service.ts`, `msal-client.ts`, `auth.interceptor.ts` — sign-in, credentials on
  every `/api` request, `401` → back to sign-in
- `core/state/items.store.ts` — Browse list, my posts, detail cache; `post()` / `markReturned()`
  are async and throw `ApiError` (field errors are shown on the Post form)

## Still open (next sprints)

| Topic                             | Now                                                                      | Plan                                                          |
| --------------------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------- |
| Search (US-04)                    | text / places / time filtered in the browser on the first 100 open items | `q`, `places[]`, `foundAfter`, paging on the server           |
| Chat (US-06)                      | local `DbStore`                                                          | `/api/conversations` (MongoDB) exists, wire `ChatStore` to it |
| Returned to whom (US-07/10)       | `PATCH` doesn't record the owner; "Got back" is empty                    | take the owner from the conversation                          |
| Saved searches, alerts (US-08/09) | local `DbStore`                                                          | new endpoints                                                 |
| Photos (US-11)                    | 1 photo per item                                                         | up to 3                                                       |
| Production CORS / domain          | same domain assumed                                                      | add a CORS policy if the SPA moves to another origin          |
