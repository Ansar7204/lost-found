import { Injectable } from '@angular/core';

/**
 * Thin wrapper around localStorage.
 *
 * Why wrap it? Components never touch browser globals directly: this makes
 * code testable (swap it in TestBed) and survives private mode / quota errors,
 * where localStorage throws.
 */
@Injectable({ providedIn: 'root' })
export class StorageService {
  read<T>(key: string): T | null {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  }

  write<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn(`Could not persist "${key}"`, error);
    }
  }

  remove(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  }
}
