import { environment } from '@env/environment';

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

declare var Razorpay: any;

@Injectable({
    providedIn: 'root'
})
export class PaymentService {
    private apiUrl = environment.apiUrl + '/payment';
    private keyId = 'rzp_test_RykYCc88sGOjqy'; // Public Test Key

    constructor(private http: HttpClient) { }

    createOrder(amount: number): Observable<any> {
        return this.http.post(`${this.apiUrl}/order`, { amount });
    }

    verifyPayment(response: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/verify`, response);
    }

    initializeRazorpay(options: any) {
        return new Razorpay(options);
    }

    loadRazorpayScript(): Promise<void> {
        return new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.onload = () => {
                resolve();
            };
            document.body.appendChild(script);
        });
    }

    getKeyId(): string {
        return this.keyId;
    }
}
