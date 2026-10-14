import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Item } from '../models/models';
import {
  ApiCreateFoundItemResponse,
  ApiGetFoundItemResponse,
  ApiMeResponse,
  ApiSearchFoundItemsRequest,
  ApiSearchFoundItemsResponse,
} from './api.types';
import { itemFromDetails, itemFromSearchResult, toCreateRequest } from './items-api.mapper';

export interface ItemsPage {
  items: Item[];
  totalCount: number;
  page: number;
  pageSize: number;
}

/**
 * Typed client for the real backend (tamirlanm/lost-found).
 *
 * NOT wired into the UI yet: the demo runs on the local DbStore because the
 * API needs Microsoft Entra ID tokens and has no endpoints for saved
 * searches, chat or notifications yet. docs/BACKEND_INTEGRATION.md explains
 * how to switch the ItemsStore over to this service.
 *
 * Pattern to notice: HttpClient returns cold Observables; nothing is sent
 * until someone subscribes (or converts them with toSignal / rxResource).
 */
@Injectable({ providedIn: 'root' })
export class ItemsApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/items`;

  search(request: ApiSearchFoundItemsRequest = {}): Observable<ItemsPage> {
    // HttpParams skips nothing by itself, so only add what is set.
    let params = new HttpParams();
    for (const [key, value] of Object.entries(request)) {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    }

    return this.http
      .get<ApiSearchFoundItemsResponse>(this.baseUrl, { params })
      .pipe(map((res) => ({ ...res, items: res.items.map(itemFromSearchResult) })));
  }

  getById(id: string): Observable<Item> {
    return this.http
      .get<ApiGetFoundItemResponse>(`${this.baseUrl}/${id}`)
      .pipe(map(itemFromDetails));
  }

  create(item: Parameters<typeof toCreateRequest>[0]): Observable<ApiCreateFoundItemResponse> {
    return this.http.post<ApiCreateFoundItemResponse>(this.baseUrl, toCreateRequest(item));
  }

  markReturned(id: string): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}/${id}/returned`, null);
  }

  me(): Observable<ApiMeResponse> {
    return this.http.get<ApiMeResponse>(`${environment.apiBaseUrl}/me`);
  }
}
