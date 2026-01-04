import { environment } from '@env/environment';

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { SnackbarService } from './snackbar.service';

const API_URL = environment.apiUrl;

export interface CartItem {
    id: string; // Cart Item ID (DB ID)
    product_id: string | number;
    product_type: 'medicine' | 'device' | 'lab_test' | 'ayurveda_medicine';
    name: string;
    description?: string;
    image?: string;
    price: number;
    quantity: number;
    total_price?: number;
    prescription_required?: boolean;
}

export interface Cart {
    items: CartItem[];
    totalItems: number;
    subtotal: number;
    delivery: number;
    tax: number;
    total: number;
}

@Injectable({
    providedIn: 'root'
})
export class CartService {
    private apiUrl = `${API_URL}/cart`;

    // Initial empty state
    private emptyCart: Cart = {
        items: [],
        totalItems: 0,
        subtotal: 0,
        delivery: 0,
        tax: 0,
        total: 0
    };

    private cart$ = new BehaviorSubject<Cart>(this.emptyCart);

    // Derived observable for cart count
    public cartCount$ = this.cart$.pipe(
        map(cart => cart ? cart.totalItems : 0)
    );

    constructor(
        private http: HttpClient,
        private authService: AuthService,
        private snackbar: SnackbarService
    ) {
        // Sync cart on load if logged in
        // Using authStatus$ which emits true/false
        this.authService.authStatus$.subscribe(isLoggedIn => {
            if (isLoggedIn) {
                this.refreshCart();
            } else {
                this.cart$.next(this.emptyCart);
            }
        });
    }

    // Get cart as Observable
    getCart(): Observable<Cart> {
        return this.cart$.asObservable();
    }

    // Refresh cart from server
    refreshCart(): void {
        this.http.get<{ success: boolean; data: any }>(this.apiUrl)
            .pipe(
                catchError(err => {
                    console.error('Error fetching cart', err);
                    return of({ success: false, data: null });
                })
            )
            .subscribe(response => {
                if (response.success && response.data) {
                    this.cart$.next(response.data);
                }
            });
    }

    // Add item to cart
    addItem(item: any): void {
        if (!this.authService.isLoggedIn()) {
            this.snackbar.show('Please log in to add items to cart', 'error');
            return;
        }

        const payload = {
            product_id: item.id || item.product_id,
            product_type: item.type || item.product_type,
            quantity: item.quantity || 1
        };

        this.http.post(this.apiUrl + '/add', payload).subscribe({
            next: () => {
                this.snackbar.show('Item added to cart', 'success');
                this.refreshCart();
            },
            error: (err) => {
                this.snackbar.show(err.error?.message || 'Failed to add item', 'error');
            }
        });
    }

    // Remove item from cart
    removeItem(cartItemId: string): void {
        this.http.delete(`${this.apiUrl}/item/${cartItemId}`).subscribe({
            next: () => {
                this.refreshCart();
                this.snackbar.show('Item removed', 'info');
            },
            error: (err) => console.error('Error removing item', err)
        });
    }

    // Update item quantity
    updateQuantity(cartItemId: string, quantity: number): void {
        if (quantity < 1) {
            this.removeItem(cartItemId);
            return;
        }

        this.http.put(`${this.apiUrl}/item/${cartItemId}`, { quantity }).subscribe({
            next: () => this.refreshCart(),
            error: (err) => this.snackbar.show(err.error?.message || 'Error updating cart', 'error')
        });
    }

    // Clear entire cart
    clearCart(): void {
        this.http.delete(`${this.apiUrl}/clear`).subscribe({
            next: () => {
                this.cart$.next(this.emptyCart);
            },
            error: (err) => console.error('Error clearing cart', err)
        });
    }

    // Helper: Check if item is in cart (local check against current state)
    // Note: DB Cart items use 'product_id' ref, while local items might use 'id'. 
    // This helper checks against the currently loaded cart state.
    isInCart(productId: string | number): boolean {
        const cart = this.cart$.value;
        if (!cart || !cart.items) return false;

        return cart.items.some(item =>
            // Check both ID and Product ID as they might differ in DB vs API
            item.product_id == productId || item.id == String(productId)
        );
    }

    // Helper: Get full image URL
    getFullImageUrl(imagePath?: string): string {
        if (!imagePath || imagePath === '') {
            return 'assets/images/placeholder-medicine.png';
        }
        if (imagePath.startsWith('http')) {
            return imagePath;
        }
        // Remove leading slash if exists
        const path = imagePath.startsWith('/') ? imagePath.substring(1) : imagePath;
        return `${environment.uploadUrl}/${path}`;
    }
}
