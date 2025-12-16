import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { CartService, Cart, CartItem } from '../../shared/services/cart.service';
import { Subscription } from 'rxjs';
import { ConfirmationModalComponent } from '../../shared/components/confirmation-modal/confirmation-modal.component';
import { SkeletonLoaderComponent } from '../../shared/components/skeleton-loader/skeleton-loader.component';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ConfirmationModalComponent,
    SkeletonLoaderComponent
  ],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.css'
})
export class CartComponent implements OnInit, OnDestroy {
  cart: Cart | null = null;
  loading = true;
  error: string | null = null;
  private cartSubscription?: Subscription;

  // Loading states for buttons
  updatingItemId: number | null = null;
  removingItemId: number | null = null;
  clearingCart = false;

  // Modal states
  showRemoveModal = false;
  showClearModal = false;
  itemToRemove: CartItem | null = null;

  constructor(
    private cartService: CartService,
    private router: Router
  ) { }

  ngOnInit() {
    // Subscribe to cart$ observable for automatic updates
    this.cartSubscription = this.cartService.cart$.subscribe({
      next: (cart) => {
        this.cart = cart;
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Failed to load cart';
        this.loading = false;
        console.error('Cart subscription error:', error);
      }
    });

    // Initial load
    this.loadCart();
  }

  ngOnDestroy() {
    // Clean up subscription
    if (this.cartSubscription) {
      this.cartSubscription.unsubscribe();
    }
  }

  loadCart() {
    this.loading = true;
    this.cartService.getCart().subscribe({
      next: () => {
        // Cart will update via subscription
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Failed to load cart';
        this.loading = false;
        console.error('Cart error:', error);
      }
    });
  }

  // Open remove confirmation modal
  confirmRemoveItem(item: CartItem) {
    this.itemToRemove = item;
    this.showRemoveModal = true;
    document.body.classList.add('overflow-hidden');
  }

  // Actually remove the item
  removeItem() {
    if (!this.itemToRemove) return;

    this.removingItemId = this.itemToRemove.id;
    this.showRemoveModal = false;
    document.body.classList.remove('overflow-hidden');

    this.cartService.removeItem(this.itemToRemove.id).subscribe({
      next: () => {
        this.removingItemId = null;
        this.itemToRemove = null;
      },
      error: (error) => {
        console.error('Remove error:', error);
        this.removingItemId = null;
        this.itemToRemove = null;
      }
    });
  }

  // Cancel remove
  cancelRemove() {
    this.showRemoveModal = false;
    this.itemToRemove = null;
    document.body.classList.remove('overflow-hidden')
  }

  // Open clear cart modal
  confirmClearCart() {
    this.showClearModal = true;
    document.body.classList.add('overflow-hidden');
  }

  // Actually clear cart
  clearCart() {
    this.clearingCart = true;
    this.showClearModal = false;
    document.body.classList.remove('overflow-hidden');

    this.cartService.clearCart().subscribe({
      next: () => {
        this.clearingCart = false;
      },
      error: (error) => {
        console.error('Clear error:', error);
        this.clearingCart = false;
      }
    });
  }

  // Cancel clear
  cancelClear() {
    this.showClearModal = false;
    document.body.classList.remove('overflow-hidden');
  }

  // Update with loading state
  updateQuantity(item: CartItem, newQuantity: number) {
    if (newQuantity < 1 || newQuantity > 10) return;

    this.updatingItemId = item.id;
    this.cartService.updateQuantity(item.id, newQuantity).subscribe({
      next: () => {
        this.updatingItemId = null;
      },
      error: (error) => {
        console.error('Update error:', error);
        this.updatingItemId = null;
      }
    });
  }

  // Helper to check if button is loading
  isUpdating(itemId: number): boolean {
    return this.updatingItemId === itemId;
  }

  isRemoving(itemId: number): boolean {
    return this.removingItemId === itemId;
  }

  checkout() {
    this.router.navigate(['/checkout']);
  }
}