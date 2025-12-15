import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CartService, Cart } from '../../services/cart.service';
import { OrderService } from '../../services/order.service';
import { SnackbarService } from '../../services/snackbar.service';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.css'
})
export class CheckoutComponent implements OnInit {
  checkoutForm!: FormGroup;
  cart: Cart | null = null;
  loading = false;
  submitting = false;

  constructor(
    private fb: FormBuilder,
    private cartService: CartService,
    private orderService: OrderService,
    private snackbarService: SnackbarService,
    private router: Router
  ) { }

  ngOnInit() {
    // Load cart
    this.loading = true;
    this.cartService.cart$.subscribe(cart => {
      this.cart = cart;
      this.loading = false;

      // Redirect if cart is empty
      if (!cart || cart.items.length === 0) {
        this.snackbarService.show('Your cart is empty', 'error');
        this.router.navigate(['/cart']);
      }
    });

    this.cartService.getCart().subscribe();

    // Initialize form
    this.checkoutForm = this.fb.group({
      delivery_address: ['', [Validators.required, Validators.minLength(10)]],
      delivery_city: ['', Validators.required],
      delivery_state: ['', Validators.required],
      delivery_pincode: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
      delivery_phone: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      payment_method: ['COD', Validators.required],
      notes: ['']
    });
  }

  get subtotal(): number {
    if (!this.cart || !this.cart.items) return 0;
    return this.cart.items.reduce((sum, item) => sum + parseFloat(String(item.total_price)), 0);
  }

  get tax(): number {
    return this.subtotal * 0.09;
  }

  get deliveryFee(): number {
    return this.subtotal >= 500 ? 0 : 50;
  }

  get total(): number {
    return this.subtotal + this.tax + this.deliveryFee;
  }

  placeOrder() {
    if (this.checkoutForm.invalid) {
      Object.keys(this.checkoutForm.controls).forEach(key => {
        this.checkoutForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.submitting = true;

    this.orderService.placeOrder(this.checkoutForm.value).subscribe({
      next: (response) => {
        this.submitting = false;
        this.snackbarService.show('✓ Order placed successfully!', 'success');

        // Navigate to order details
        this.router.navigate([`/orders/${response.data.order_id}`]);
      },
      error: (error) => {
        this.submitting = false;
        this.snackbarService.show(
          error.error?.message || 'Failed to place order',
          'error'
        );
      }
    });
  }

  getFieldError(fieldName: string): string {
    const control = this.checkoutForm.get(fieldName);
    if (control?.hasError('required')) return 'This field is required';
    if (control?.hasError('minlength')) return 'Address too short';
    if (control?.hasError('pattern')) {
      if (fieldName === 'delivery_pincode') return 'Invalid pincode (6 digits)';
      if (fieldName === 'delivery_phone') return 'Invalid phone (10 digits)';
    }
    return '';
  }
}
