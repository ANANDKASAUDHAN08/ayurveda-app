import { environment } from '@env/environment';

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';

const API_URL = environment.apiUrl;

export interface SearchResult {
    id: number;
    name: string;
    description: string;
    price?: number;
    category?: string;
    stock?: number;
    stock_quantity?: number;
    product_type: 'medicine' | 'device' | 'doctor' | 'hospital' | 'pharmacy';
}

export interface SearchResponse {
    success: boolean;
    data: {
        results: SearchResult[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    };
}

export interface Suggestion {
    name: string;
    price: number;
    category: string;
    type: string;
}

export interface SearchFilters {
    q?: string;
    category?: string;
    type?: 'medicine' | 'device' | '';
    minPrice?: number;
    maxPrice?: number;
    sortBy?: string;
    page?: number;
    limit?: number;
}

@Injectable({
    providedIn: 'root'
})
export class SearchService {
    private apiUrl = `${API_URL}/search`;

    // Current search state
    private searchResultsSubject = new BehaviorSubject<SearchResult[]>([]);
    public searchResults$ = this.searchResultsSubject.asObservable();

    // ADD THIS - Cache for autocomplete suggestions
    private suggestionCache = new Map<string, Suggestion[]>();
    private readonly CACHE_DURATION = 300000; // 5 minutes in milliseconds

    private searchHistoryKey = 'search_history';
    private maxHistoryItems = 10;

    constructor(private http: HttpClient) { }

    searchProducts(filters: SearchFilters): Observable<SearchResponse> {
        let params = new HttpParams();

        if (filters.q) params = params.set('q', filters.q);
        if (filters.category) params = params.set('category', filters.category);
        if (filters.type) params = params.set('type', filters.type);
        if (filters.minPrice) params = params.set('minPrice', filters.minPrice.toString());
        if (filters.maxPrice) params = params.set('maxPrice', filters.maxPrice.toString());
        if (filters.sortBy) params = params.set('sortBy', filters.sortBy);
        if (filters.page) params = params.set('page', filters.page.toString());
        if (filters.limit) params = params.set('limit', filters.limit.toString());

        return this.http.get<SearchResponse>(`${this.apiUrl}/products`, { params }).pipe(
            tap(response => {
                if (response.success) {
                    this.searchResultsSubject.next(response.data.results);
                    if (filters.q) {
                        this.addToSearchHistory(filters.q);
                    }
                }
            })
        );
    }

    getSuggestions(query: string): Observable<{ success: boolean; data: Suggestion[] }> {
        const cacheKey = query.toLowerCase().trim();

        // Check cache first
        const cached = this.suggestionCache.get(cacheKey);
        if (cached) {
            return of({ success: true, data: cached });
        }

        // Make API call
        const params = new HttpParams().set('q', query);
        return this.http.get<{ success: boolean; data: Suggestion[] }>(
            `${this.apiUrl}/suggestions`,
            { params }
        ).pipe(
            tap(response => {
                if (response.success && response.data.length > 0) {
                    // Cache the result
                    this.suggestionCache.set(cacheKey, response.data);

                    // Auto-clear cache after 5 minutes
                    setTimeout(() => {
                        this.suggestionCache.delete(cacheKey);
                    }, this.CACHE_DURATION);
                }
            })
        );
    }

    getPopularSearches(): Observable<{ success: boolean; data: string[] }> {
        return this.http.get<{ success: boolean; data: string[] }>(
            `${this.apiUrl}/popular`
        );
    }

    trackSearch(query: string, resultsCount: number): Observable<any> {
        return this.http.post(`${this.apiUrl}/track`, {
            query,
            resultsCount
        });
    }

    getSearchHistory(): string[] {
        if (typeof window === 'undefined') return [];
        const history = localStorage.getItem(this.searchHistoryKey);
        return history ? JSON.parse(history) : [];
    }

    addToSearchHistory(query: string): void {
        if (typeof window === 'undefined') return;

        let history = this.getSearchHistory();

        // Remove if already exists
        history = history.filter(item => item !== query);

        // Add to beginning
        history.unshift(query);

        // Limit to max items
        history = history.slice(0, this.maxHistoryItems);

        localStorage.setItem(this.searchHistoryKey, JSON.stringify(history));
    }

    clearSearchHistory(): void {
        if (typeof window === 'undefined') return;
        localStorage.removeItem(this.searchHistoryKey);
    }

    getCategories(): string[] {
        return [
            'Pain Relief',
            'Diabetes',
            'Vitamins & Supplements',
            'First Aid',
            'Personal Care',
            'Baby Care',
            'Ayurvedic',
            'Diagnostics',
            'Medical Devices'
        ];
    }
}
