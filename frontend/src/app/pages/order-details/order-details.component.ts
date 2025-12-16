import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { OrderService, Order } from '../../shared/services/order.service';
import { SnackbarService } from '../../shared/services/snackbar.service';

@Component({
  selector: 'app-order-details',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './order-details.component.html',
  styleUrl: './order-details.component.css'
})
export class OrderDetailsComponent implements OnInit {
  order: Order | null = null;
  loading = false;
  cancelling = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private orderService: OrderService,
    private snackbarService: SnackbarService
  ) { }

  ngOnInit() {
    const orderId = this.route.snapshot.paramMap.get('id');
    if (orderId) {
      this.loadOrderDetails(Number(orderId));
    }
  }

  loadOrderDetails(orderId: number) {
    this.loading = true;
    this.orderService.getOrderDetails(orderId).subscribe({
      next: (response) => {
        this.order = response.data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading order:', error);
        this.loading = false;
        this.snackbarService.show('Failed to load order details', 'error');
        this.router.navigate(['/orders']);
      }
    });
  }

  cancelOrder() {
    if (!this.order) return;

    if (!confirm('Are you sure you want to cancel this order?')) {
      return;
    }

    this.cancelling = true;
    this.orderService.cancelOrder(this.order.id).subscribe({
      next: () => {
        this.cancelling = false;
        this.snackbarService.show('Order cancelled successfully', 'success');
        // Reload order details
        this.loadOrderDetails(this.order!.id);
      },
      error: (error) => {
        this.cancelling = false;
        this.snackbarService.show(
          error.error?.message || 'Failed to cancel order',
          'error'
        );
      }
    });
  }

  canCancelOrder(): boolean {
    if (!this.order) return false;
    return !['shipped', 'delivered', 'cancelled'].includes(this.order.status);
  }

  getStatusColor(status: string): string {
    return this.orderService.getStatusColor(status);
  }

  getStatusIcon(status: string): string {
    return this.orderService.getStatusIcon(status);
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getStatusStep(status: string): number {
    const steps: { [key: string]: number } = {
      'pending': 1,
      'confirmed': 2,
      'processing': 3,
      'shipped': 4,
      'delivered': 5,
      'cancelled': 0
    };
    return steps[status] || 0;
  }
}
