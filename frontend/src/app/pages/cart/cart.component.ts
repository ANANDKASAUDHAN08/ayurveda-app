import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { CartService, Cart, CartItem } from '../../shared/services/cart.service';
import { Subscription } from 'rxjs';
import { ConfirmationModalComponent } from '../../shared/components/confirmation-modal/confirmation-modal.component';
import { SkeletonLoaderComponent } from '../../shared/components/skeleton-loader/skeleton-loader.component';
import { SnackbarService } from 'src/app/shared/services/snackbar.service';

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
  updatingItemId: string | null = null;
  removingItemId: string | null = null;
  clearingCart = false;

  // Modal states
  showRemoveModal = false;
  showClearModal = false;
  itemToRemove: CartItem | null = null;

  constructor(
    private cartService: CartService,
    private router: Router,
    private snackbar: SnackbarService
  ) { }

  ngOnInit() {
    this.loading = true;
    const startTime = Date.now();

    // Subscribe to cart observable for automatic updates
    this.cartSubscription = this.cartService.getCart().subscribe({
      next: (cart) => {
        this.cart = cart;

        // Minimum loading time of 500ms to prevent flickering
        const elapsed = Date.now() - startTime;
        const minLoadingTime = 500;
        const remainingTime = Math.max(0, minLoadingTime - elapsed);

        setTimeout(() => {
          this.loading = false;
        }, remainingTime);
      },
      error: (error) => {
        this.error = 'Failed to load cart';
        this.loading = false;
        this.snackbar.show('Failed to load cart', 'error');
      }
    });

    // Initial load/refresh from server
    this.cartService.refreshCart();
  }

  ngOnDestroy() {
    // Clean up subscription
    if (this.cartSubscription) {
      this.cartSubscription.unsubscribe();
    }
  }

  loadCart() {
    this.loading = true;
    this.cartService.refreshCart();
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

    this.cartService.removeItem(this.itemToRemove.id);
    this.removingItemId = null;
    this.itemToRemove = null;
    this.snackbar.show('Item removed from cart', 'success');
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

    this.cartService.clearCart();
    setTimeout(() => {
      this.clearingCart = false;
      this.snackbar.show('Cart cleared successfully', 'success');
    }, 300);
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
    this.cartService.updateQuantity(item.id, newQuantity);
    setTimeout(() => {
      this.updatingItemId = null;
    }, 300);
  }

  // Helper to check if button is loading
  isUpdating(itemId: string): boolean {
    return this.updatingItemId === itemId;
  }

  isRemoving(itemId: string): boolean {
    return this.removingItemId === itemId;
  }

  getImageUrl(imagePath?: string): string {
    return this.cartService.getFullImageUrl(imagePath);
  }

  checkout() {
    this.router.navigate(['/checkout']);
  }
}