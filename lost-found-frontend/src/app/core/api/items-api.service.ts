import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Item } from '../models/models';
import { ApiFoundItem, ApiSearchFoundItemsRequest, ApiSearchFoundItemsResponse } from './api.types';
import { itemFromApi, toCreateRequest } from './items-api.mapper';

export interface ItemsPage {
  items: Item[];
  totalCount: number;
  page: number;
  pageSize: number;
}

/**
 * Typed client for the items API. Credentials are added by authInterceptor,
 * errors are normalized to ApiError by apiErrorInterceptor.
 *
 * HttpClient returns cold Observables: nothing is sent until someone subscribes.
 */
@Injectable({ providedIn: 'root' })
export class ItemsApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/items`;

  /** US-03: GET /api/items with filters, newest first. */
  search(request: ApiSearchFoundItemsRequest = {}): Observable<ItemsPage> {
    // Only send the filters that are set.
    let params = new HttpParams();
    for (const [key, value] of Object.entries(request)) {
      if (value !== undefined && value !== null && value !== '' && value !== false) {
        params = params.set(key, String(value));
      }
    }

    return this.http
      .get<ApiSearchFoundItemsResponse>(this.baseUrl, { params })
      .pipe(map((res) => ({ ...res, items: res.items.map(itemFromApi) })));
  }

  getById(id: string): Observable<Item> {
    return this.http.get<ApiFoundItem>(`${this.baseUrl}/${id}`).pipe(map(itemFromApi));
  }

  /** By the short number from the URL: /item/0413 -> GET /api/items/413 */
  getByNo(no: string): Observable<Item> {
    return this.http.get<ApiFoundItem>(`${this.baseUrl}/${Number(no)}`).pipe(map(itemFromApi));
  }

  /** US-02: POST /api/items. Resolves to the created item (with its Nº). */
  create(item: Parameters<typeof toCreateRequest>[0]): Observable<Item> {
    return this.http.post<ApiFoundItem>(this.baseUrl, toCreateRequest(item)).pipe(map(itemFromApi));
  }

  /** POST /api/items/{id}/photo (multipart, JPEG/PNG ≤ 5 MB, one photo per item for now). */
  uploadPhoto(id: string, photo: Blob): Observable<{ photoUrl: string }> {
    const form = new FormData();
    form.append('photo', photo, photo.type === 'image/png' ? 'photo.png' : 'photo.jpg');
    return this.http.post<{ photoUrl: string }>(`${this.baseUrl}/${id}/photo`, form);
  }

  markReturned(id: string): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}/${id}/returned`, null);
  }

  /** Raw bytes of a protected URL (photos need the auth header, so <img src> can't load them). */
  blob(url: string): Observable<Blob> {
    return this.http.get(url, { responseType: 'blob' });
  }
}
