import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { CartService } from 'src/app/services/cart.service';
import { SnackbarService } from 'src/app/services/snackbar.service';
import { AuthService } from 'src/app/services/auth.service';
import { Subscription } from 'rxjs';

export interface DealCardData {
  productId?: number; // Optional for now, will use dummy data
  productType?: string; // 'medicine' | 'device'
  image: string;
  title: string;
  description: string;
  price: number;
  mrp: number;
  discount: number; // percentage
  badge?: string; // 'Hot Deal', 'Limited'
  route: string;
}

@Component({
  selector: 'app-deal-card',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './deal-card.component.html',
  styleUrl: './deal-card.component.css'
})
export class DealCardComponent implements OnInit, OnDestroy {
  @Input() deal!: DealCardData;

  isAdding = false;
  isUpdating = false;
  cartQuantity = 0; // Track quantity in cart
  private cartSubscription?: Subscription;

  constructor(
    private router: Router,
    private cartService: CartService,
    private snackbarService: SnackbarService,
    private authService: AuthService
  ) { }


  ngOnInit() {
    // Subscribe to cart to get current quantity
    this.cartSubscription = this.cartService.cart$.subscribe(cart => {
      if (cart && cart.items) {
        const cartItem = cart.items.find(item =>
          item.product_id === (this.deal.productId || 1) &&
          item.product_type === (this.deal.productType || 'medicine')
        );
        this.cartQuantity = cartItem ? cartItem.quantity : 0;
      } else {
        this.cartQuantity = 0;
      }
    });
  }

  ngOnDestroy() {
    this.cartSubscription?.unsubscribe();
  }

  get savings(): number {
    return this.deal.mrp - this.deal.price;
  }

  navigate() {
    this.router.navigate([this.deal.route]);
  }

  addToCart(event: Event) {
    event.stopPropagation();

    if (!this.authService.isLoggedIn()) {
      this.snackbarService.warning('Please login to add to cart');
      return;
    }

    this.isAdding = true;

    this.cartService.addToCart({
      product_id: this.deal.productId || 1, // Use real product ID or fallback
      product_type: this.deal.productType || 'medicine', // Use real type or fallback
      quantity: 1,
      price: this.deal.price // Send the price from deal data
    }).subscribe({
      next: (response) => {
        setTimeout(() => {
          this.isAdding = false;
        }, 500);
        // Show success snackbar
        this.snackbarService.show(`✓ ${this.deal.title} added to cart!`, 'success');
      },
      error: (error) => {
        setTimeout(() => {
          this.isAdding = false;
        }, 500);
        // Show error snackbar
        this.snackbarService.show('Failed to add item to cart. Please try again.', 'error');
      }
    });
  }

  // Increase quantity
  increaseQuantity(event: Event) {
    event.stopPropagation();
    if (this.cartQuantity >= 10) return;

    this.isUpdating = true;
    this.cartService.addToCart({
      product_id: this.deal.productId || 1,
      product_type: this.deal.productType || 'medicine',
      quantity: 1,
      price: this.deal.price
    }).subscribe({
      next: () => {
        this.isUpdating = false;
      },
      error: (error) => {
        console.error('Error updating cart:', error);
        this.isUpdating = false;
      }
    });
  }

  // Decrease quantity
  decreaseQuantity(event: Event) {
    event.stopPropagation();
    if (this.cartQuantity <= 0) return;

    this.isUpdating = true;

    // Find cart item ID
    this.cartService.cart$.subscribe(cart => {
      if (cart && cart.items) {
        const cartItem = cart.items.find(item =>
          item.product_id === (this.deal.productId || 1) &&
          item.product_type === (this.deal.productType || 'medicine')
        );

        if (cartItem) {
          if (this.cartQuantity === 1) {
            // Remove from cart
            this.cartService.removeItem(cartItem.id).subscribe({
              next: () => {
                this.isUpdating = false;
              },
              error: (error) => {
                console.error('Error removing from cart:', error);
                this.isUpdating = false;
              }
            });
          } else {
            // Decrease quantity
            this.cartService.updateQuantity(cartItem.id, this.cartQuantity - 1).subscribe({
              next: () => {
                this.isUpdating = false;
              },
              error: (error) => {
                console.error('Error updating cart:', error);
                this.isUpdating = false;
              }
            });
          }
        }
      }
    }).unsubscribe(); // Unsubscribe immediately after getting data
  }
}