import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface CartItem {
    id: string;
    name: string;
    type: 'medicine' | 'device' | 'wellness' | 'other';
    medicineType?: 'ayurveda' | 'homeopathy' | 'allopathy';
    price: number;
    quantity: number;
    image?: string;
    prescription_required?: boolean;
}

export interface Cart {
    items: CartItem[];
    totalItems: number;
    subtotal: number;
    delivery: number;
    total: number;
}

@Injectable({
    providedIn: 'root'
})
export class CartService {
    private readonly STORAGE_KEY = 'shopping_cart';
    private cart$ = new BehaviorSubject<Cart>(this.getStoredCart());
    private cartCountSubject = new BehaviorSubject<number>(0);
    // public cart$ = this.cartSubject.asObservable();
    public cartCount$ = this.cartCountSubject.asObservable();

    constructor() {
        // Initialize from localStorage
        const stored = this.getStoredCart();
        if (stored) {
            this.cart$.next(stored);
        }
    }

    /**
     * Get cart as Observable
     */
    getCart(): Observable<Cart> {
        return this.cart$.asObservable();
    }

    /**
     * Get current cart value (synchronous)
     */
    getCartValue(): Cart {
        return this.cart$.value;
    }

    /**
     * Get total item count
     */
    getItemCount(): number {
        return this.cart$.value.totalItems;
    }

    /**
     * Add item to cart
     */
    addItem(item: CartItem): void {
        const currentCart = this.cart$.value;
        const existingItemIndex = currentCart.items.findIndex(i => i.id === item.id);

        if (existingItemIndex > -1) {
            // Increase quantity if item already exists
            currentCart.items[existingItemIndex].quantity += item.quantity;
        } else {
            // Add new item
            currentCart.items.push(item);
        }

        this.updateCart(currentCart);
    }

    /**
     * Remove item from cart
     */
    removeItem(itemId: string): void {
        const currentCart = this.cart$.value;
        currentCart.items = currentCart.items.filter(item => item.id !== itemId);
        this.updateCart(currentCart);
    }

    /**
     * Update item quantity
     */
    updateQuantity(itemId: string, quantity: number): void {
        const currentCart = this.cart$.value;
        const item = currentCart.items.find(i => i.id === itemId);

        if (item) {
            if (quantity <= 0) {
                this.removeItem(itemId);
            } else {
                item.quantity = quantity;
                this.updateCart(currentCart);
            }
        }
    }

    /**
     * Clear entire cart
     */
    clearCart(): void {
        const emptyCart: Cart = {
            items: [],
            totalItems: 0,
            subtotal: 0,
            delivery: 0,
            total: 0
        };
        this.updateCart(emptyCart);
    }

    /**
     * Update cart and recalculate totals
     */
    private updateCart(cart: Cart): void {
        // Recalculate totals
        cart.totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
        cart.subtotal = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        // Calculate delivery (free over 999)
        cart.delivery = cart.subtotal >= 999 ? 0 : 50;
        cart.total = cart.subtotal + cart.delivery;

        // Update state
        this.cart$.next(cart);

        // Persist to localStorage
        this.saveCart(cart);
    }

    /**
     * Check if item is in cart
     */
    isInCart(itemId: string): boolean {
        return this.cart$.value.items.some(item => item.id === itemId);
    }

    /**
     * Get item quantity in cart
     */
    getItemQuantity(itemId: string): number {
        const item = this.cart$.value.items.find(i => i.id === itemId);
        return item ? item.quantity : 0;
    }

    /**
     * Check if cart needs prescription
     */
    needsPrescription(): boolean {
        return this.cart$.value.items.some(item => item.prescription_required);
    }

    /**
     * Save cart to localStorage
     */
    private saveCart(cart: Cart): void {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(cart));
        } catch (error) {
            console.error('Error saving cart:', error);
        }
    }

    /**
     * Get cart from localStorage
     */
    private getStoredCart(): Cart {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            if (stored) {
                return JSON.parse(stored);
            }
        } catch (error) {
            console.error('Error reading stored cart:', error);
        }

        // Return empty cart
        return {
            items: [],
            totalItems: 0,
            subtotal: 0,
            delivery: 0,
            total: 0
        };
    }
}