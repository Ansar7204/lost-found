import { Category, Item, ItemStatus, PLACES, Place } from '../models/models';
import {
  ApiCreateFoundItemRequest,
  ApiFoundItemStatus,
  ApiGetFoundItemResponse,
  ApiItemCategory,
  ApiSearchFoundItemResponse,
} from './api.types';

// Adapter between the backend's wire format and the frontend model.
//
// The backend and the design don't agree on everything yet (see
// docs/BACKEND_INTEGRATION.md). All of that disagreement is contained here,
// so the rest of the app doesn't care.

const CATEGORY_FROM_API: Record<ApiItemCategory, Category> = {
  [ApiItemCategory.Accessory]: 'Other',
  [ApiItemCategory.Clothing]: 'Clothing',
  [ApiItemCategory.Electronics]: 'Electronics',
  [ApiItemCategory.Documents]: 'Cards & IDs',
  [ApiItemCategory.Keys]: 'Keys',
  [ApiItemCategory.Other]: 'Other',
};

const CATEGORY_TO_API: Record<Category, ApiItemCategory> = {
  Electronics: ApiItemCategory.Electronics,
  'Cards & IDs': ApiItemCategory.Documents,
  Keys: ApiItemCategory.Keys,
  Clothing: ApiItemCategory.Clothing,
  Bottles: ApiItemCategory.Accessory,
  'Books & notes': ApiItemCategory.Other,
  Other: ApiItemCategory.Other,
};

export function categoryFromApi(value: ApiItemCategory): Category {
  return CATEGORY_FROM_API[value] ?? 'Other';
}

export function categoryToApi(value: Category): ApiItemCategory {
  return CATEGORY_TO_API[value];
}

/** The design has no "Claimed" state yet: treat it as still open. */
export function statusFromApi(value: ApiFoundItemStatus): ItemStatus {
  return value === ApiFoundItemStatus.Returned ? 'returned' : 'open';
}

/**
 * The backend stores one free-text `cabinet` ("Library · 2nd floor").
 * The design has a place from a fixed list plus an optional detail.
 */
export function splitCabinet(cabinet: string): { place: Place; placeDetail?: string } {
  const [head, ...rest] = cabinet.split('·').map((s) => s.trim());
  const known = PLACES.find((p) => p.toLowerCase() === head.toLowerCase());
  if (!known) return { place: 'Main building', placeDetail: cabinet.trim() };
  return rest.length ? { place: known, placeDetail: rest.join(' · ') } : { place: known };
}

export function joinCabinet(place: Place, placeDetail?: string): string {
  return placeDetail?.trim() ? `${place} · ${placeDetail.trim()}` : place;
}

/** Backend ids are GUIDs; the UI shows a short "Nº" made from the first 4 hex chars. */
export function shortNo(id: string): string {
  return id.replace(/-/g, '').slice(0, 4).toUpperCase();
}

export function itemFromSearchResult(dto: ApiSearchFoundItemResponse): Item {
  return {
    no: shortNo(dto.id),
    title: dto.name,
    category: categoryFromApi(dto.category),
    ...splitCabinet(dto.cabinet),
    held: 'With finder',
    // The list endpoint doesn't return foundAt yet; createdAt is the closest.
    foundAt: dto.createdAt,
    description: '',
    photos: [],
    finderId: '',
    status: statusFromApi(dto.status),
  };
}

export function itemFromDetails(dto: ApiGetFoundItemResponse): Item {
  return {
    ...itemFromSearchResult(dto),
    description: dto.description,
    finderId: dto.userFoundId,
  };
}

export function toCreateRequest(
  item: Pick<Item, 'title' | 'description' | 'category' | 'place' | 'placeDetail' | 'foundAt'>,
): ApiCreateFoundItemRequest {
  return {
    name: item.title.trim(),
    description: item.description.trim(),
    category: categoryToApi(item.category),
    cabinet: joinCabinet(item.place, item.placeDetail),
    foundAt: new Date(item.foundAt).toISOString(),
  };
}
