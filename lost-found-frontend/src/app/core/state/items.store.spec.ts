import { TestBed } from '@angular/core/testing';
import { AuthService } from '../auth/auth.service';
import { DbStore } from '../data/db.store';
import { AlertsStore } from './alerts.store';
import { ChatStore } from './chat.store';
import { ItemsStore } from './items.store';

// Integration-style test: real stores, real seed data, fresh localStorage.
// It checks the core demo moment: post -> saved search match -> notification.

describe('ItemsStore', () => {
  let items: ItemsStore;
  let auth: AuthService;

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    TestBed.configureTestingModule({});
    items = TestBed.inject(ItemsStore);
    auth = TestBed.inject(AuthService);
    TestBed.inject(DbStore).reset();
  });

  it('notifies matching saved searches of other users when an item is posted', () => {
    auth.switchUser('u2'); // Daniyar posts...
    const posted = items.post({
      title: 'AirPods Max',
      category: 'Electronics',
      place: 'Library',
      held: 'With finder',
      foundAt: new Date().toISOString(),
      description: '',
      photos: [],
    });
    expect(posted.no).toBe('0413');
    expect(posted.finderId).toBe('u2');

    auth.switchUser('u1'); // ...Aruzhan's "My AirPods" search is notified.
    const alerts = TestBed.inject(AlertsStore);
    expect(alerts.notifications()[0].title).toBe('New match for “My AirPods”: AirPods Max');
    expect(alerts.searches().find((s) => s.name === 'My AirPods')?.newMatches).toBe(2);
  });

  it('counts matching searches for the live footer', () => {
    auth.switchUser('u2');
    const draft = { title: 'Red keys', description: '', category: 'Keys', place: 'Dorms' } as const;
    expect(items.countMatchingSearches(draft)).toBe(1); // "Dorm keys"
  });

  it('only lets the finder mark an item returned, and tells the owner', () => {
    auth.switchUser('u1');
    items.markReturned('0412'); // Aruzhan is not the finder: ignored
    expect(items.byNo('0412')?.status).toBe('open');

    auth.switchUser('u2');
    items.markReturned('0412');
    expect(items.byNo('0412')).toMatchObject({ status: 'returned', ownerId: 'u1' });

    const thread = TestBed.inject(ChatStore).byId('t1');
    expect(thread?.messages.at(-1)?.system).toBe(true);

    auth.switchUser('u1');
    expect(items.gotBack().map((i) => i.no)).toContain('0412');
  });
});
