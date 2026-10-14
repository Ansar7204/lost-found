# Backend integration

The backend is an ASP.NET Core Web API: [tamirlanm/lost-found](https://github.com/tamirlanm/lost-found)
(.NET, EF Core + PostgreSQL, Microsoft Entra ID auth). It's still being built. This page
records what it offers today, where it and the design disagree, and how to connect the frontend.

## What the API has today

All endpoints require a Microsoft Entra ID (Azure AD) bearer token with the `access_as_user`
scope. Dev URL: `http://localhost:5043`.

| Method  | Path                         | Body / query                                                 | Response                                               |
| ------- | ---------------------------- | ------------------------------------------------------------ | ------------------------------------------------------ |
| `GET`   | `/api/me`                    |                                                              | `{ userId }`                                           |
| `GET`   | `/api/items`                 | `?category&status&cabinet&page=1&pageSize=20` (max 100)      | `{ items[], totalCount, page, pageSize }`              |
| `GET`   | `/api/items/{id}`            |                                                              | `{ id, userFoundId, name, description, cabinet, category, status, createdAt }` |
| `POST`  | `/api/items`                 | `{ name ≤150, description ≤1024, category, cabinet ≤100, foundAt }` | `201 { id, createdAt }`; `400` if `foundAt` is in the future |
| `PATCH` | `/api/items/{id}/returned`   |                                                              | `204`; `403` if you're not the finder                  |
| `GET`   | `/health`                    |                                                              | health check                                           |

Enums go over the wire as **numbers**:

- `ItemCategory`: 0 Accessory, 1 Clothing, 2 Electronics, 3 Documents, 4 Keys, 5 Other
- `FoundItemStatus`: 0 Open, 1 Claimed, 2 Returned

The TypeScript versions of all of this are in `src/app/core/api/api.types.ts`.

## Already done on the frontend

- `api.types.ts`: DTOs copied 1:1 from the C# records
- `items-api.mapper.ts`: DTO ⇄ frontend model, with the mismatches below handled in one place
- `items-api.service.ts`: typed `HttpClient` calls for every endpoint
- `api-error.interceptor.ts`: turns HTTP failures, including ASP.NET `ValidationProblem`
  bodies, into an `ApiError` with field messages
- `proxy.conf.json`: `ng serve` forwards `/api/*` to `http://localhost:5043`, so no CORS setup
  is needed in development
- Tests for the mapper and service (`*.spec.ts`), run without a backend

## Questions to settle with the backend

These are differences between the design handoff and the API. Worth one short call.

| #   | Topic              | Design wants                                                   | API has                                   | Suggestion                                                                                           |
| --- | ------------------ | -------------------------------------------------------------- | ----------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| 1   | Categories         | Electronics, Cards & IDs, Keys, Clothing, Bottles, Books & notes, Other | Accessory, Clothing, Electronics, Documents, Keys, Other | Agree on one list. Mapper currently sends Bottles→Accessory, Books & notes→Other            |
| 2   | Enum format        | readable values                                                | numbers                                   | Add `JsonStringEnumConverter` in `Program.cs` so JSON says `"Keys"`, not `4`                           |
| 3   | Location           | place from a list + detail ("Library · 2nd floor") **and** where it's held now | one `cabinet` string        | Split into `place`, `placeDetail`, `heldAt`. Until then the mapper joins place + detail into `cabinet` |
| 4   | Item number        | short `Nº 0412`                                                | GUID                                      | Add a sequential `number` column, or keep GUIDs and show the first 4 chars (current mapper)           |
| 5   | Detail fields      | `foundAt`, photos, finder name                                 | `GetById` has no `foundAt` / `photoKey`; no user names | Return `foundAt`, `photoUrl`, `finder: { id, name }`                                          |
| 6   | List fields        | photo, `foundAt` for "2H AGO"                                  | list returns `createdAt` only             | Add `foundAt` and `photoUrl` to `SearchFoundItemResponse`                                            |
| 7   | Search             | text search, several places, time range, sort                  | category, status, exact cabinet           | Add `q`, `places[]`, `foundAfter`, `sort`                                                            |
| 8   | Photos             | upload up to 3                                                 | `PhotoKey` column, no upload endpoint     | `POST /api/items/{id}/photos` (multipart) → blob storage                                             |
| 9   | Claimed state      | open / returned only                                           | Open / Claimed / Returned                 | Decide what "Claimed" means in the UI (e.g. "Owner found · meeting")                                 |
| 10  | Returned to whom   | owner moves to "Got back"                                      | `MarkReturned` doesn't record the owner   | Take `{ ownerUserId }` in the PATCH body                                                              |
| 11  | Saved searches, notifications, chat | core of the design                           | not in the API yet                        | New endpoints; chat could use SignalR                                                                 |
| 12  | Sign-in            | `@kbtu.kz` email + 6-digit code                                | Entra ID tokens                           | If KBTU accounts are in Entra ID, use MSAL and drop the OTP screen                                     |
| 13  | CORS / HTTPS       |                                                                | no CORS policy; `UseHttpsRedirection`     | Dev: proxy (done). Prod: serve from the same domain or add a CORS policy for the frontend origin      |

## How to connect (step by step)

### 1. Run the backend

```bash
git clone https://github.com/tamirlanm/lost-found && cd lost-found
docker compose up -d                  # PostgreSQL on 127.0.0.1:5433
# add ConnectionStrings:Postgres and the AzureAd section to appsettings.Development.json
dotnet ef database update --project src/LostAndFound.Api
dotnet run --project src/LostAndFound.Api --launch-profile http   # http://localhost:5043
```

Then `npm start` here: requests to `/api/...` are proxied to it.

### 2. Sign-in with Microsoft Entra ID (MSAL)

The API rejects requests without a token. The standard Angular way:

```bash
npm install @azure/msal-browser @azure/msal-angular
```

- Register a **single-page application** in Entra ID with redirect URI `http://localhost:4200`.
- In `app.config.ts`, provide MSAL (`MsalService`, `MsalGuard`, `MsalInterceptor`) with the
  tenant and client id, and a protected resource map:
  `['/api/', ['api://<backend-client-id>/access_as_user']]`.
- The `MsalInterceptor` then attaches `Authorization: Bearer ...` to every `/api` request,
  the same way `apiErrorInterceptor` already sits in the HTTP pipeline.
- Replace the body of `AuthService` with MSAL calls; keep its public signals
  (`currentUser`, `isSignedIn`) so no component has to change.
- Replace `authGuard` with `MsalGuard` (or keep ours and make it check MSAL).

### 3. Switch items to the API

Only `ItemsStore` needs to change; components keep calling the same methods.
A sketch using `rxResource` (loading and error states for free):

```ts
@Injectable({ providedIn: 'root' })
export class ItemsStore {
  private readonly api = inject(ItemsApiService);
  private readonly refresh = signal(0);

  private readonly page = rxResource({
    params: () => ({ n: this.refresh() }),
    stream: () => this.api.search({ status: ApiFoundItemStatus.Open, pageSize: 100 }),
  });

  readonly items = computed(() => this.page.value()?.items ?? []);
  readonly isLoading = this.page.isLoading;
  readonly error = this.page.error;

  async post(draft: ItemDraft): Promise<string> {
    const { id } = await firstValueFrom(this.api.create(draft));
    this.refresh.update((n) => n + 1);
    return id;
  }
}
```

Things that change because the calls become asynchronous:

- `post()` and `markReturned()` return Promises: `await` them in the component and show a
  busy state on the button.
- Show `ApiError.fieldErrors` next to the matching form fields (the keys are the C# property
  names, e.g. `FoundAt`).
- Routes use GUIDs: `/item/:id` instead of `/item/:no`.
- Saved searches, notifications and chat keep running on the local `DbStore` until the API
  has endpoints for them. The stores are separate for exactly this reason.

### 4. Generate types instead of copying them (optional)

The API exposes OpenAPI at `/openapi/v1.json` in development. Tools like `openapi-typescript`
can generate `api.types.ts` from it, so the frontend fails to compile when the contract
changes, instead of failing at runtime.
