// DTOs of the ASP.NET Core backend (github.com/tamirlanm/lost-found),
// copied 1:1 from the C# records. ASP.NET serializes to camelCase JSON and
// enums as numbers (no JsonStringEnumConverter configured yet).
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
}

/** C# `FoundItemStatus` enum. */
export enum ApiFoundItemStatus {
  Open = 0,
  Claimed = 1,
  Returned = 2,
}

/** GET /api/items?category&status&cabinet&page&pageSize */
export interface ApiSearchFoundItemsRequest {
  category?: ApiItemCategory;
  status?: ApiFoundItemStatus;
  cabinet?: string;
  /** 1-based. */
  page?: number;
  /** 1..100, default 20. */
  pageSize?: number;
}

export interface ApiSearchFoundItemResponse {
  id: string;
  name: string;
  category: ApiItemCategory;
  cabinet: string;
  status: ApiFoundItemStatus;
  createdAt: string;
}

export interface ApiSearchFoundItemsResponse {
  items: ApiSearchFoundItemResponse[];
  totalCount: number;
  page: number;
  pageSize: number;
}

/** GET /api/items/{id} */
export interface ApiGetFoundItemResponse {
  id: string;
  userFoundId: string;
  name: string;
  description: string;
  cabinet: string;
  category: ApiItemCategory;
  status: ApiFoundItemStatus;
  createdAt: string;
}

/** POST /api/items. Limits mirror the C# [StringLength] attributes. */
export interface ApiCreateFoundItemRequest {
  /** max 150 */
  name: string;
  /** max 1024 */
  description: string;
  category: ApiItemCategory;
  /** max 100 */
  cabinet: string;
  /** ISO date; the server rejects dates in the future. */
  foundAt: string;
}

/** 201 Created body. */
export interface ApiCreateFoundItemResponse {
  id: string;
  createdAt: string;
}

/** GET /api/me */
export interface ApiMeResponse {
  userId: string;
}

/** ASP.NET's standard error body (RFC 7807), e.g. from ValidationProblem(). */
export interface ApiProblemDetails {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  errors?: Record<string, string[]>;
}
