import { Injectable } from '@angular/core';
import { BehaviorSubject, fromEvent, merge, of } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
    providedIn: 'root'
})
export class OfflineService {
    private onlineStatus$ = new BehaviorSubject<boolean>(navigator.onLine);

    constructor() {
        // Listen to online/offline events
        merge(
            of(navigator.onLine),
            fromEvent(window, 'online').pipe(map(() => true)),
            fromEvent(window, 'offline').pipe(map(() => false))
        ).subscribe(this.onlineStatus$);
    }

    /**
     * Observable that emits current online/offline status
     */
    isOnline() {
        return this.onlineStatus$.asObservable();
    }

    /**
     * Synchronous check for online status
     */
    checkOnline(): boolean {
        return navigator.onLine;
    }

    /**
     * Get current status value
     */
    get currentStatus(): boolean {
        return this.onlineStatus$.value;
    }

    /**
     * Cache data in localStorage
     */
    cacheData(key: string, data: any): void {
        try {
            const timestamp = new Date().getTime();
            const cachedData = {
                data,
                timestamp,
                version: '1.0'
            };
            localStorage.setItem(`cache_${key}`, JSON.stringify(cachedData));
        } catch (error) {
            console.error('Error caching data:', error);
        }
    }

    /**
     * Get cached data from localStorage
     */
    getCachedData(key: string, maxAge: number = 86400000): any | null {
        try {
            const cached = localStorage.getItem(`cache_${key}`);
            if (!cached) return null;

            const cachedData = JSON.parse(cached);
            const now = new Date().getTime();
            const age = now - cachedData.timestamp;

            // Check if cache is still valid
            if (age > maxAge) {
                localStorage.removeItem(`cache_${key}`);
                return null;
            }

            return cachedData.data;
        } catch (error) {
            console.error('Error getting cached data:', error);
            return null;
        }
    }

    /**
     * Clear specific cache
     */
    clearCache(key: string): void {
        localStorage.removeItem(`cache_${key}`);
    }

    /**
     * Clear all cached data
     */
    clearAllCache(): void {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
            if (key.startsWith('cache_')) {
                localStorage.removeItem(key);
            }
        });
    }

    /**
     * Get cache size info
     */
    getCacheInfo(): { count: number; keys: string[] } {
        const keys = Object.keys(localStorage).filter(k => k.startsWith('cache_'));
        return {
            count: keys.length,
            keys: keys.map(k => k.replace('cache_', ''))
        };
    }
}

