import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';

const API_URL = 'http://localhost:3000/api';

export interface Order {
    id: number;
    order_number: string;
    total_amount: number;
    tax: number;
    delivery_fee: number;
    status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
    payment_status: 'pending' | 'paid' | 'failed';
    payment_method: string;
    delivery_address: string;
    delivery_city: string;
    delivery_state: string;
    delivery_pincode: string;
    delivery_phone: string;
    notes?: string;
    created_at: string;
    updated_at: string;
    delivered_at?: string;
    total_items?: number;
    items?: OrderItem[];
    status_history?: StatusHistory[];
}

export interface OrderItem {
    id: number;
    product_id: number;
    product_type: string;
    product_name: string;
    quantity: number;
    price: number;
    total_price: number;
}

export interface StatusHistory {
    status: string;
    message: string;
    created_at: string;
}

export interface PlaceOrderRequest {
    delivery_address: string;
    delivery_city: string;
    delivery_state: string;
    delivery_pincode: string;
    delivery_phone: string;
    payment_method?: string;
    notes?: string;
}

@Injectable({
    providedIn: 'root'
})
export class OrderService {
    private apiUrl = `${API_URL}/orders`;

    // Observable for current orders list
    private ordersSubject = new BehaviorSubject<Order[]>([]);
    public orders$ = this.ordersSubject.asObservable();

    constructor(private http: HttpClient) { }

    /**
     * Place order (checkout)
     */
    placeOrder(orderData: PlaceOrderRequest): Observable<{ success: boolean; message: string; data: any }> {
        return this.http.post<{ success: boolean; message: string; data: any }>(
            this.apiUrl,
            orderData
        );
    }

    /**
     * Get user's orders
     */
    getUserOrders(status?: string): Observable<{ success: boolean; data: Order[] }> {
        const url = status ? `${this.apiUrl}?status=${status}` : this.apiUrl;
        return this.http.get<{ success: boolean; data: Order[] }>(url).pipe(
            tap(response => {
                if (response.success) {
                    this.ordersSubject.next(response.data);
                }
            })
        );
    }

    /**
     * Get single order details
     */
    getOrderDetails(orderId: number): Observable<{ success: boolean; data: Order }> {
        return this.http.get<{ success: boolean; data: Order }>(
            `${this.apiUrl}/${orderId}`
        );
    }

    /**
     * Cancel order
     */
    cancelOrder(orderId: number): Observable<{ success: boolean; message: string }> {
        return this.http.put<{ success: boolean; message: string }>(
            `${this.apiUrl}/${orderId}/cancel`,
            {}
        ).pipe(
            tap(() => {
                // Refresh orders list
                this.getUserOrders().subscribe();
            })
        );
    }

    /**
     * Update order status (admin)
     */
    updateOrderStatus(orderId: number, status: string, message?: string): Observable<{ success: boolean; message: string }> {
        return this.http.put<{ success: boolean; message: string }>(
            `${this.apiUrl}/${orderId}/status`,
            { status, message }
        );
    }

    /**
     * Get status badge color
     */
    getStatusColor(status: string): string {
        const colors: { [key: string]: string } = {
            'pending': 'bg-yellow-100 text-yellow-800',
            'confirmed': 'bg-blue-100 text-blue-800',
            'processing': 'bg-purple-100 text-purple-800',
            'shipped': 'bg-indigo-100 text-indigo-800',
            'delivered': 'bg-green-100 text-green-800',
            'cancelled': 'bg-red-100 text-red-800'
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    }

    /**
     * Get status icon
     */
    getStatusIcon(status: string): string {
        const icons: { [key: string]: string } = {
            'pending': 'fa-clock',
            'confirmed': 'fa-check-circle',
            'processing': 'fa-cog',
            'shipped': 'fa-shipping-fast',
            'delivered': 'fa-check-double',
            'cancelled': 'fa-times-circle'
        };
        return icons[status] || 'fa-info-circle';
    }

    /**
     * Get real-time tracking info
     */
    getOrderTracking(orderId: number): Observable<{ success: boolean; data: any }> {
        return this.http.get<{ success: boolean; data: any }>(
            `${this.apiUrl}/${orderId}/tracking`
        );
    }

    /**
     * Simulate tracking update
     */
    simulateTracking(orderId: number, lat: number, lng: number): Observable<any> {
        return this.http.post(`${this.apiUrl}/${orderId}/tracking/simulate`, { lat, lng });
    }
}
