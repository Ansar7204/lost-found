import { Category, Item, ItemStatus, PLACES, Place } from '../models/models';
import {
  ApiCreateFoundItemRequest,
  ApiFoundItem,
  ApiFoundItemStatus,
  ApiItemCategory,
} from './api.types';

// Adapter between the backend's wire format and the frontend model.
// All remaining disagreement between API and design is contained here.

const CATEGORY_FROM_API: Record<ApiItemCategory, Category> = {
  [ApiItemCategory.Accessory]: 'Other', // legacy value, no UI category
  [ApiItemCategory.Clothing]: 'Clothing',
  [ApiItemCategory.Electronics]: 'Electronics',
  [ApiItemCategory.Documents]: 'Cards & IDs',
  [ApiItemCategory.Keys]: 'Keys',
  [ApiItemCategory.Other]: 'Other',
  [ApiItemCategory.Bottles]: 'Bottles',
  [ApiItemCategory.BooksAndNotes]: 'Books & notes',
};

const CATEGORY_TO_API: Record<Category, ApiItemCategory> = {
  Electronics: ApiItemCategory.Electronics,
  'Cards & IDs': ApiItemCategory.Documents,
  Keys: ApiItemCategory.Keys,
  Clothing: ApiItemCategory.Clothing,
  Bottles: ApiItemCategory.Bottles,
  'Books & notes': ApiItemCategory.BooksAndNotes,
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

/** 413 -> "0413" */
export function formatNo(number: number): string {
  return String(number).padStart(4, '0');
}

export function itemFromApi(dto: ApiFoundItem): Item {
  return {
    id: dto.id,
    no: formatNo(dto.number),
    title: dto.name,
    category: categoryFromApi(dto.category),
    ...splitCabinet(dto.cabinet),
    held: dto.heldAt || 'With finder',
    foundAt: dto.foundAt,
    createdAt: dto.createdAt,
    description: dto.description,
    photos: dto.photoUrl ? [dto.photoUrl] : [],
    photoCaption: dto.name.toLowerCase().slice(0, 24),
    finderId: dto.userFoundId,
    finderName: dto.finderName || undefined,
    status: statusFromApi(dto.status),
  };
}

export function toCreateRequest(
  item: Pick<
    Item,
    'title' | 'description' | 'category' | 'place' | 'placeDetail' | 'foundAt' | 'held'
  >,
): ApiCreateFoundItemRequest {
  return {
    name: item.title.trim(),
    description: item.description.trim(),
    category: categoryToApi(item.category),
    cabinet: joinCabinet(item.place, item.placeDetail),
    heldAt: item.held,
    foundAt: new Date(item.foundAt).toISOString(),
  };
}

/** ASP.NET field name (C# property) -> Post form control name. */
export const FORM_FIELD_FROM_API: Record<
  string,
  'title' | 'description' | 'category' | 'place' | 'foundAt' | 'held'
> = {
  name: 'title',
  description: 'description',
  category: 'category',
  cabinet: 'place',
  foundat: 'foundAt',
  heldat: 'held',
};
