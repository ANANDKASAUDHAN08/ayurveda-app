import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface MedicineMatch {
  id: number;
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  quantity_needed: number;
  matched_product?: {
    id: number;
    name: string;
    price: number;
    stock: number;
    available: boolean;
    image: string;
    similarity: number;
    match_type: string;
  };
  suggestions?: Array<{
    id: number;
    name: string;
    price: number;
    stock: number;
    similarity: number;
  }>;
}

export interface OrderSummary {
  total_medicines: number;
  matched: number;
  unmatched: number;
  total_amount: number;
  discount_applicable: boolean;
  discount_code: string;
  discount_amount: number;
  final_amount: number;
}

export interface PrescriptionOrderResponse {
  prescription: {
    id: number;
    patient_name: string;
    issue_date: string;
    expiry_date: string;
    status: string;
  };
  medicines: MedicineMatch[];
  summary: OrderSummary;
}

@Injectable({
  providedIn: 'root'
})
export class PrescriptionOrderService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  /**
   * Get prescription medicines with product matches for ordering
   */
  getMedicinesForOrder(prescriptionId: number): Observable<PrescriptionOrderResponse> {
    return this.http.get<PrescriptionOrderResponse>(
      `${this.apiUrl}/prescriptions/${prescriptionId}/medicines-for-order`
    );
  }

  /**
   * Add prescription medicines to cart
   */
  addPrescriptionToCart(prescriptionId: number, items: Array<{
    medicine_id: number;
    product_id: number;
    quantity: number;
  }>, applyDiscount: boolean = true): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/prescriptions/${prescriptionId}/add-to-cart`,
      {
        items,
        apply_discount: applyDiscount
      }
    );
  }
}
