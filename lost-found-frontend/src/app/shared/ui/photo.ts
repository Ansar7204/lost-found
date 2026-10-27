import { Component, DestroyRef, effect, inject, input, signal } from '@angular/core';
import { ItemsApiService } from '../../core/api/items-api.service';
import { environment } from '../../../environments/environment';

/**
 * An item photo, or the striped placeholder with a mono caption when there is none.
 *
 * Photos served by our API need the auth header, which a plain <img src> can't send.
 * Those are fetched through HttpClient (so the interceptor adds credentials) and
 * shown from an object URL. Data URLs (the Post preview) are used as they are.
 */
@Component({
  selector: 'app-photo',
  template: `
    @if (url(); as url) {
      <img [src]="url" [alt]="alt()" />
    } @else {
      <span class="caption">{{ caption() }}</span>
    }
  `,
  styles: `
    @use 'mixins' as *;

    :host {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      border-radius: 3px;
      @include striped-placeholder;
    }
    img {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .caption {
      @include mono(11px);
      padding: 0 8px;
      text-align: center;
    }
  `,
})
export class Photo {
  readonly src = input<string | undefined>();
  readonly caption = input<string | undefined>('');
  readonly alt = input('');

  private readonly api = inject(ItemsApiService);
  protected readonly url = signal<string | undefined>(undefined);
  private objectUrl?: string;

  constructor() {
    effect((onCleanup) => {
      const src = this.src();
      this.release();
      if (!src || !src.startsWith(`${environment.apiBaseUrl}/`)) {
        this.url.set(src);
        return;
      }
      this.url.set(undefined);
      const sub = this.api.blob(src).subscribe({
        next: (blob) => {
          this.objectUrl = URL.createObjectURL(blob);
          this.url.set(this.objectUrl);
        },
        error: () => this.url.set(undefined), // keep the placeholder
      });
      onCleanup(() => sub.unsubscribe());
    });
    inject(DestroyRef).onDestroy(() => this.release());
  }

  private release(): void {
    if (this.objectUrl) URL.revokeObjectURL(this.objectUrl);
    this.objectUrl = undefined;
  }
}
