import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/auth/auth.guard';
import { Shell } from './layout/shell';

/**
 * Every page is lazy-loaded (`loadComponent`): its code is downloaded only
 * when you first visit it, which keeps the initial bundle small.
 *
 * `title` sets the browser tab title (see PageTitleStrategy).
 * `data.fullscreenOnMobile` hides the mobile tab bar (read by Shell).
 */
export const routes: Routes = [
  {
    path: 'signin',
    title: 'Sign in',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/sign-in').then((m) => m.SignIn),
  },
  {
    path: '',
    component: Shell,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        title: 'Browse',
        loadComponent: () => import('./features/browse/browse').then((m) => m.Browse),
        // /post renders as a modal on top of Browse (D3), so it's a child route.
        children: [
          {
            path: 'post',
            title: 'Post a found item',
            loadComponent: () => import('./features/post/post-item').then((m) => m.PostItem),
          },
        ],
      },
      {
        path: 'item/:no',
        title: 'Item',
        data: { fullscreenOnMobile: true },
        loadComponent: () => import('./features/item-detail/item-detail').then((m) => m.ItemDetail),
      },
      {
        path: 'chats',
        title: 'Chats',
        loadComponent: () => import('./features/chats/chat-list').then((m) => m.ChatList),
      },
      {
        path: 'chats/:id',
        title: 'Chat',
        data: { fullscreenOnMobile: true },
        loadComponent: () => import('./features/chats/chat-page').then((m) => m.ChatPage),
      },
      {
        path: 'alerts',
        title: 'Saved searches',
        loadComponent: () => import('./features/alerts/alerts').then((m) => m.Alerts),
      },
      {
        path: 'me',
        title: 'My posts',
        loadComponent: () => import('./features/profile/profile').then((m) => m.Profile),
      },
    ],
  },
  {
    path: '**',
    title: 'Not found',
    loadComponent: () => import('./features/not-found').then((m) => m.NotFound),
  },
];
