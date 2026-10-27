import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Logo } from '../shared/ui/logo';

@Component({
  selector: 'app-not-found',
  imports: [RouterLink, Logo],
  template: `
    <app-logo [size]="40" />
    <h1>Nothing here</h1>
    <p>This page got lost. Unlike your stuff, nobody will find it.</p>
    <a class="btn btn--primary" routerLink="/">Back to Browse</a>
  `,
  styles: `
    @use 'mixins' as *;

    :host {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 16px;
      min-height: 100dvh;
      padding: 16px;
      text-align: center;
    }
    h1 {
      @include headline(30px);
    }
    p {
      color: var(--text-3);
    }
  `,
})
export class NotFound {}
