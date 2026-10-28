import { apiItem } from '../../../testing/api-fakes';
import { ApiFoundItemStatus, ApiItemCategory } from './api.types';
import { formatNo, itemFromApi, splitCabinet, toCreateRequest } from './items-api.mapper';

describe('items-api.mapper', () => {
  it('maps a backend item to the frontend model', () => {
    const item = itemFromApi(
      apiItem({
        id: '3f2a9c1e-0000-4000-8000-000000000000',
        number: 412,
        userFoundId: 'user-guid',
        finderName: 'Daniyar K.',
        name: 'Student ID',
        description: 'Blue lanyard',
        cabinet: 'Main building · Room 304',
        heldAt: 'Security desk',
        category: ApiItemCategory.Documents,
        status: ApiFoundItemStatus.Claimed,
        photoUrl: '/api/items/3f2a/photo',
      }),
    );

    expect(item).toMatchObject({
      id: '3f2a9c1e-0000-4000-8000-000000000000',
      no: '0412',
      title: 'Student ID',
      category: 'Cards & IDs',
      place: 'Main building',
      placeDetail: 'Room 304',
      held: 'Security desk',
      status: 'open', // Claimed has no UI state yet
      finderId: 'user-guid',
      finderName: 'Daniyar K.',
      photos: ['/api/items/3f2a/photo'],
    });
  });

  it('builds a create request the API accepts', () => {
    const request = toCreateRequest({
      title: '  Keys  ',
      description: 'Red lanyard ',
      category: 'Books & notes',
      place: 'Dorms',
      placeDetail: 'Block B',
      held: 'Library desk',
      foundAt: '2026-09-30T10:00:00.000Z',
    });

    expect(request).toEqual({
      name: 'Keys',
      description: 'Red lanyard',
      category: ApiItemCategory.BooksAndNotes,
      cabinet: 'Dorms · Block B',
      heldAt: 'Library desk',
      foundAt: '2026-09-30T10:00:00.000Z',
    });
  });

  it('keeps unknown cabinets as a detail', () => {
    expect(splitCabinet('Room 304')).toEqual({ place: 'Main building', placeDetail: 'Room 304' });
    expect(splitCabinet('library')).toEqual({ place: 'Library' });
  });

  it('formats the short Nº', () => {
    expect(formatNo(7)).toBe('0007');
    expect(formatNo(12345)).toBe('12345');
  });
});
