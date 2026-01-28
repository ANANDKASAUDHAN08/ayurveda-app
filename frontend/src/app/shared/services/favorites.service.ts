import { environment } from '@env/environment';

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, map, tap, of } from 'rxjs';
import { AuthService } from './auth.service';
import { SnackbarService } from './snackbar.service';
export type FavoriteType = 'article' | 'doctor' | 'hospital' | 'pharmacy' | 'medicine' | 'health_package';

export interface FavoriteItem {
    itemId: string | number;
    itemType: FavoriteType;
}

@Injectable({
    providedIn: 'root'
})
export class FavoritesService {
    private apiUrl = `${environment.apiUrl}/favorites`;
    private favoritesSubject = new BehaviorSubject<FavoriteItem[]>([]);
    public favorites$ = this.favoritesSubject.asObservable();

    constructor(
        private http: HttpClient,
        private authService: AuthService,
        private snackbar: SnackbarService
    ) {
        // Load favorites when user logs in
        this.authService.authStatus$.subscribe(isLoggedIn => {
            if (isLoggedIn) {
                this.loadFavorites();
            } else {
                this.favoritesSubject.next([]);
            }
        });
    }

    private loadFavorites() {
        this.http.get<{ favorites: FavoriteItem[] }>(this.apiUrl).subscribe({
            next: (res) => this.favoritesSubject.next(res.favorites),
            error: (err) => console.error('Error loading favorites', err)
        });
    }

    toggleFavorite(itemId: string | number, itemType: FavoriteType): Observable<boolean> {
        if (!this.authService.isLoggedIn()) {
            this.snackbar.show('Please login to save to favorites', 'error');
            return of(false);
        }

        const idStr = itemId.toString();
        return this.http.post<{ isFavorite: boolean }>(`${this.apiUrl}/toggle`, { itemId: idStr, itemType }).pipe(
            tap(res => {
                const current = this.favoritesSubject.value;
                if (res.isFavorite) {
                    this.favoritesSubject.next([...current, { itemId: idStr, itemType }]);
                    this.snackbar.show(`Added to favorites`, 'success');
                } else {
                    this.favoritesSubject.next(current.filter(f => !(f.itemId === idStr && f.itemType === itemType)));
                    this.snackbar.show(`Removed from favorites`, 'info');
                }
            }),
            map(res => res.isFavorite)
        );
    }

    isFavorite(itemId: string | number, itemType: FavoriteType): boolean {
        const idStr = itemId.toString();
        return this.favoritesSubject.value.some(f => f.itemId === idStr && f.itemType === itemType);
    }

    getFavoritesByType(itemType: FavoriteType): FavoriteItem[] {
        return this.favoritesSubject.value.filter(f => f.itemType === itemType);
    }
}
