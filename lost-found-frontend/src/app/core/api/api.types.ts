// DTOs of the ASP.NET Core backend (src/LostAndFound.Api), copied 1:1 from the C# records.
// ASP.NET serializes to camelCase JSON and enums as numbers.
//
// Rule: these types describe the wire format ONLY. Components never see them;
// items-api.mapper.ts turns them into the frontend models.

/** C# `ItemCategory` enum. The numeric values are what goes over the wire. */
export enum ApiItemCategory {
  Accessory = 0,
  Clothing = 1,
  Electronics = 2,
  Documents = 3,
  Keys = 4,
  Other = 5,
  Bottles = 6,
  BooksAndNotes = 7,
}

/** C# `FoundItemStatus` enum. */
export enum ApiFoundItemStatus {
  Open = 0,
  Claimed = 1,
  Returned = 2,
}

/** C# `FoundItemDto`: one item, the same shape from list, details and create. */
export interface ApiFoundItem {
  id: string;
  /** Sequential, shown as "Nº 0413". */
  number: number;
  userFoundId: string;
  finderName: string;
  name: string;
  description: string;
  category: ApiItemCategory;
  /** "Library · 2nd floor" */
  cabinet: string;
  /** "With finder" | "Security desk" | "Library desk" */
  heldAt: string;
  status: ApiFoundItemStatus;
  foundAt: string;
  createdAt: string;
  /** "/api/items/{id}/photo" (needs auth) or null. */
  photoUrl: string | null;
}

/** GET /api/items?category&status&cabinet&mine&page&pageSize */
export interface ApiSearchFoundItemsRequest {
  category?: ApiItemCategory;
  status?: ApiFoundItemStatus;
  cabinet?: string;
  /** Only the current user's posts. */
  mine?: boolean;
  /** 1-based. */
  page?: number;
  /** 1..100, default 20. */
  pageSize?: number;
}

export interface ApiSearchFoundItemsResponse {
  items: ApiFoundItem[];
  totalCount: number;
  page: number;
  pageSize: number;
}

/** POST /api/items. Limits mirror the C# [StringLength] attributes. */
export interface ApiCreateFoundItemRequest {
  /** required, max 150 */
  name: string;
  /** optional, max 1024 */
  description: string;
  category: ApiItemCategory;
  /** required, max 100 */
  cabinet: string;
  /** max 50 */
  heldAt: string;
  /** ISO date; the server rejects dates in the future (400, errors.FoundAt). */
  foundAt: string;
}

/** GET /api/me */
export interface ApiMeResponse {
  userId: string;
  name: string;
  email: string;
}

/** ASP.NET's standard error body (RFC 7807), e.g. from ValidationProblem(). */
export interface ApiProblemDetails {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  errors?: Record<string, string[]>;
}
