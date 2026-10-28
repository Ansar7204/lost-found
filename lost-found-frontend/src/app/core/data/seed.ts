import { Db } from '../models/models';

// Local data that is NOT on the API yet: saved searches, notifications, chats,
// and a directory of names seen in chats. Items come from the API (Sprint 1),
// so the demo items of the design handoff (docs/design/mock-data.json) are gone.
//
// Version 2: user ids are now the real ids from GET /api/me, so old local data
// (version 1, fake ids "u1", "u2") is discarded on first load.

export const DB_VERSION = 2;

export function buildSeed(): Db {
  return {
    version: DB_VERSION,
    users: [],
    items: [],
    savedSearches: [],
    notifications: [],
    threads: [],
  };
}
