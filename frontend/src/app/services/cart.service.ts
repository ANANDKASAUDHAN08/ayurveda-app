import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { AuthService } from './auth.service';

// Environment configuration
const API_URL = 'http://localhost:3000/api';
export interface CartItem {
    id: number;
    product_id: number;
    product_type: string;
    product_name: string;
    quantity: number;
    price: number;
    total_price: number;
    image?: string;
    description?: string;
}
export interface Cart {
    items: CartItem[];
    total_items: number;
    subtotal: number;
    tax: number;
    total: number;
}
export interface AddToCartRequest {
    product_id: number;
    product_type: string;
    quantity?: number;
    price?: number; // Optional price (for testing without product tables)
}
@Injectable({
    providedIn: 'root'
})
export class CartService {
    private apiUrl = `${API_URL}/cart`;

    private cartSubject = new BehaviorSubject<Cart | null>(null);
    private cartCountSubject = new BehaviorSubject<number>(0);
    public cart$ = this.cartSubject.asObservable();
    public cartCount$ = this.cartCountSubject.asObservable();

    constructor(private http: HttpClient, private authService: AuthService) {
        // Don't auto-load cart - components should call loadCart() when needed

        // Subscribe to auth state changes (handles login/logout via authService)
        this.authService.authStatus$.subscribe(isLoggedIn => {
            if (isLoggedIn) {
                this.loadCart();
            } else {
                this.clearCartState();
            }
        });

        // Handle manual localStorage clearing or cross-tab logout
        if (typeof window !== 'undefined') {
            window.addEventListener('storage', (event) => {
                if (event.key === 'auth_token') {
                    if (!event.newValue) {
                        // Token removed - clear cart
                        this.clearCartState();
                    } else {
                        // Token added - load cart
                        this.loadCart();
                    }
                }
            });

            setInterval(() => {
                const hasToken = !!localStorage.getItem('auth_token');
                const hasCart = (this.cartCountSubject.value || 0) > 0;

                // If no token but cart has items, clear it
                if (!hasToken && hasCart) {
                    this.clearCartState();
                }
            }, 2000);
        }
    }

    loadCart(): void {
        // Check if user has a token
        const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
        if (!token) {
            // User not logged in
            this.clearCartState();
            return;
        }

        this.http.get<{ success: boolean; data: Cart }>(`${this.apiUrl}`)
            .subscribe({
                next: (response) => {
                    if (response.success) {
                        this.cartSubject.next(response.data);
                        this.cartCountSubject.next(response.data.total_items);
                    }
                },
                error: (error) => {
                    console.error('Error loading cart:', error);
                    // Silently fail - user might not be logged in
                    this.clearCartState();
                }
            });
    }

    private clearCartState(): void {
        this.cartSubject.next({
            items: [],
            total_items: 0,
            subtotal: 0,
            tax: 0,
            total: 0
        });
        this.cartCountSubject.next(0);
    }

    getCart(): Observable<{ success: boolean; data: Cart }> {
        return this.http.get<{ success: boolean; data: Cart }>(`${this.apiUrl}`)
            .pipe(
                tap(response => {
                    if (response.success) {
                        this.cartSubject.next(response.data);
                        this.cartCountSubject.next(response.data.total_items);
                    }
                })
            );
    }

    addToCart(item: AddToCartRequest): Observable<{ success: boolean; message: string }> {
        return this.http.post<{ success: boolean; message: string }>(
            `${this.apiUrl}/add`,
            item
        ).pipe(
            tap(() => this.loadCart()) // Reload cart after adding
        );
    }

    updateQuantity(itemId: number, quantity: number): Observable<{ success: boolean; message: string }> {
        return this.http.put<{ success: boolean; message: string }>(
            `${this.apiUrl}/item/${itemId}`,
            { quantity }
        ).pipe(
            tap(() => this.loadCart())
        );
    }

    removeItem(itemId: number): Observable<{ success: boolean; message: string }> {
        return this.http.delete<{ success: boolean; message: string }>(
            `${this.apiUrl}/item/${itemId}`
        ).pipe(
            tap(() => this.loadCart())
        );
    }

    clearCart(): Observable<{ success: boolean; message: string }> {
        return this.http.delete<{ success: boolean; message: string }>(
            `${this.apiUrl}/clear`
        ).pipe(
            tap(() => {
                // Set empty cart structure instead of null
                this.cartSubject.next({
                    items: [],
                    total_items: 0,
                    subtotal: 0,
                    tax: 0,
                    total: 0
                });
                this.cartCountSubject.next(0);
            })
        );
    }

    getCartCount(): Observable<{ success: boolean; data: { count: number } }> {
        return this.http.get<{ success: boolean; data: { count: number } }>(
            `${this.apiUrl}/count`
        ).pipe(
            tap(response => {
                if (response.success) {
                    this.cartCountSubject.next(response.data.count);
                }
            })
        );
    }
}