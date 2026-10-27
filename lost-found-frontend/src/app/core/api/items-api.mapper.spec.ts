import { ApiFoundItemStatus, ApiItemCategory } from './api.types';
import { itemFromDetails, shortNo, splitCabinet, toCreateRequest } from './items-api.mapper';

describe('items-api.mapper', () => {
  it('maps a backend item to the frontend model', () => {
    const item = itemFromDetails({
      id: '3f2a9c1e-0000-4000-8000-000000000000',
      userFoundId: 'user-guid',
      name: 'Student ID',
      description: 'Blue lanyard',
      cabinet: 'Main building · Room 304',
      category: ApiItemCategory.Documents,
      status: ApiFoundItemStatus.Claimed,
      createdAt: '2026-09-30T10:00:00Z',
    });

    expect(item).toMatchObject({
      no: '3F2A',
      title: 'Student ID',
      category: 'Cards & IDs',
      place: 'Main building',
      placeDetail: 'Room 304',
      status: 'open', // Claimed has no UI state yet
      finderId: 'user-guid',
    });
  });

  it('builds a create request the API accepts', () => {
    const request = toCreateRequest({
      title: '  Keys  ',
      description: 'Red lanyard ',
      category: 'Keys',
      place: 'Dorms',
      placeDetail: 'Block B',
      foundAt: '2026-09-30T10:00:00.000Z',
    });

    expect(request).toEqual({
      name: 'Keys',
      description: 'Red lanyard',
      category: ApiItemCategory.Keys,
      cabinet: 'Dorms · Block B',
      foundAt: '2026-09-30T10:00:00.000Z',
    });
  });

  it('keeps unknown cabinets as a detail', () => {
    expect(splitCabinet('Room 304')).toEqual({ place: 'Main building', placeDetail: 'Room 304' });
    expect(splitCabinet('library')).toEqual({ place: 'Library' });
  });

  it('makes a short Nº from a GUID', () => {
    expect(shortNo('ab12cd34-0000')).toBe('AB12');
  });
});
