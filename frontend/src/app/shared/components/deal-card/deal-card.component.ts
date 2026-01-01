import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { CartService } from 'src/app/shared/services/cart.service';
import { SnackbarService } from 'src/app/shared/services/snackbar.service';
import { AuthService } from 'src/app/shared/services/auth.service';
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
  expiresAt?: Date; // Countdown timer end date
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

  // Countdown timer
  countdown = {
    hours: 0,
    minutes: 0,
    seconds: 0
  };
  private countdownInterval?: any;

  constructor(
    private router: Router,
    private cartService: CartService,
    private snackbarService: SnackbarService,
    private authService: AuthService
  ) { }


  ngOnInit() {
    // Subscribe to cart to get current quantity
    this.cartSubscription = this.cartService.getCart().subscribe(cart => {
      if (cart && cart.items) {
        const cartItem = cart.items.find(item =>
          item.id === String(this.deal.productId || 1) &&
          item.type === (this.deal.productType || 'medicine')
        );
        this.cartQuantity = cartItem ? cartItem.quantity : 0;
      } else {
        this.cartQuantity = 0;
      }
    });

    // Initialize countdown timer if expiresAt is provided
    if (this.deal.expiresAt) {
      this.updateCountdown();
      this.countdownInterval = setInterval(() => this.updateCountdown(), 1000);
    }
  }

  ngOnDestroy() {
    this.cartSubscription?.unsubscribe();
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }

  private updateCountdown() {
    if (!this.deal.expiresAt) return;

    const now = new Date().getTime();
    const expiresAt = new Date(this.deal.expiresAt).getTime();
    const distance = expiresAt - now;

    if (distance < 0) {
      this.countdown = { hours: 0, minutes: 0, seconds: 0 };
      if (this.countdownInterval) {
        clearInterval(this.countdownInterval);
      }
      return;
    }

    this.countdown = {
      hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
      minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
      seconds: Math.floor((distance % (1000 * 60)) / 1000)
    };
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

    this.cartService.addItem({
      id: String(this.deal.productId || 1),
      name: this.deal.title,
      type: (this.deal.productType || 'medicine') as 'medicine' | 'device' | 'wellness' | 'other',
      price: this.deal.price,
      quantity: 1,
      image: this.deal.image
    });

    setTimeout(() => {
      this.isAdding = false;
      this.snackbarService.show(`✓ ${this.deal.title} added to cart!`, 'success');
    }, 500);
  }

  // Increase quantity
  increaseQuantity(event: Event) {
    event.stopPropagation();
    if (this.cartQuantity >= 10) return;

    this.isUpdating = true;
    this.cartService.addItem({
      id: String(this.deal.productId || 1),
      name: this.deal.title,
      type: (this.deal.productType || 'medicine') as 'medicine' | 'device' | 'wellness' | 'other',
      price: this.deal.price,
      quantity: 1,
      image: this.deal.image
    });

    setTimeout(() => {
      this.isUpdating = false;
    }, 300);
  }

  // Decrease quantity
  decreaseQuantity(event: Event) {
    event.stopPropagation();
    if (this.cartQuantity <= 0) return;

    this.isUpdating = true;

    // Get current cart to find item ID
    const subscription = this.cartService.getCart().subscribe(cart => {
      if (cart && cart.items) {
        const cartItem = cart.items.find(item =>
          item.id === String(this.deal.productId || 1) &&
          item.type === (this.deal.productType || 'medicine')
        );

        if (cartItem) {
          if (this.cartQuantity === 1) {
            // Remove from cart
            this.cartService.removeItem(cartItem.id);
          } else {
            // Decrease quantity
            this.cartService.updateQuantity(cartItem.id, this.cartQuantity - 1);
          }
        }
      }

      setTimeout(() => {
        this.isUpdating = false;
      }, 300);
    });

    // Unsubscribe after getting data
    subscription.unsubscribe();
  }
}