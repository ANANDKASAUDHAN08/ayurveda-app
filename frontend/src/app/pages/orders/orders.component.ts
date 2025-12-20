import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { OrderService, Order } from '../../shared/services/order.service';
import { SnackbarService } from '../../shared/services/snackbar.service';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './orders.component.html',
  styleUrl: './orders.component.css'
})
export class OrdersComponent implements OnInit {
  orders: Order[] = [];
  filteredOrders: Order[] = [];
  loading = false;
  selectedFilter: string = 'all';

  filters = [
    { label: 'All Orders', value: 'all' },
    { label: 'Pending', value: 'pending' },
    { label: 'Confirmed', value: 'confirmed' },
    { label: 'Shipped', value: 'shipped' },
    { label: 'Delivered', value: 'delivered' },
    { label: 'Cancelled', value: 'cancelled' }
  ];

  constructor(
    private orderService: OrderService,
    private snackbarService: SnackbarService
  ) { }

  ngOnInit() {
    this.loadOrders();
  }

  loadOrders(status?: string) {
    this.loading = true;
    this.orderService.getUserOrders(status).subscribe({
      next: (response) => {
        this.orders = response.data;
        this.filteredOrders = response.data;
        this.loading = false;
      },
      error: (error) => {
        this.snackbarService.show('Failed to load orders', 'error');
        this.loading = false;
      }
    });
  }

  filterOrders(filter: string) {
    this.selectedFilter = filter;
    if (filter === 'all') {
      this.loadOrders();
    } else {
      this.loadOrders(filter);
    }
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
      year: 'numeric'
    });
  }
}
