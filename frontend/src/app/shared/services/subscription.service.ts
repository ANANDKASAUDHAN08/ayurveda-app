import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';

export interface Plan {
    name: string;
    price: number;
    yearlyPrice?: number;
    currency: string;
    billing: string;
    features: string[];
    popular?: boolean;
    savingsYearly?: number;
}

export interface Subscription {
    tier: string;
    status: string;
    endDate: string;
    details?: any;
}

export interface Invoice {
    id: number;
    invoice_number: string;
    amount: number;
    currency: string;
    status: string;
    created_at: string;
    tier: string;
    billing_cycle: string;
}

@Injectable({
    providedIn: 'root'
})
export class SubscriptionService {
    private apiUrl = `${environment.apiUrl}/subscription`;

    constructor(private http: HttpClient) { }

    getPlans(): Observable<{ success: boolean; plans: { [key: string]: Plan } }> {
        return this.http.get<{ success: boolean; plans: { [key: string]: Plan } }>(`${this.apiUrl}/pricing`);
    }

    getCurrentSubscription(): Observable<{ success: boolean; subscription: Subscription; usage: any }> {
        return this.http.get<{ success: boolean; subscription: Subscription; usage: any }>(`${this.apiUrl}/current`);
    }

    createSubscription(tier: string, billingCycle: 'monthly' | 'yearly'): Observable<any> {
        return this.http.post(`${this.apiUrl}/create`, { tier, billingCycle });
    }

    confirmSubscription(paymentData: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/confirm`, paymentData);
    }

    cancelSubscription(): Observable<any> {
        return this.http.post(`${this.apiUrl}/cancel`, {});
    }

    getInvoices(): Observable<{ success: boolean; invoices: Invoice[] }> {
        return this.http.get<{ success: boolean; invoices: Invoice[] }>(`${this.apiUrl}/invoices`);
    }

    downloadInvoice(id: number): Observable<Blob> {
        return this.http.get(`${this.apiUrl}/invoices/${id}/download`, {
            responseType: 'blob'
        });
    }
}
