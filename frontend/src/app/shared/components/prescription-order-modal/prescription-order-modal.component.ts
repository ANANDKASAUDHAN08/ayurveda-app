import { Component, Input, Output, EventEmitter, OnInit, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PrescriptionOrderService, MedicineMatch, OrderSummary } from '../../services/prescription-order.service';
import { SnackbarService } from '../../services/snackbar.service';

@Component({
  selector: 'app-prescription-order-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './prescription-order-modal.component.html',
  styleUrl: './prescription-order-modal.component.css'
})
export class PrescriptionOrderModalComponent implements OnInit, OnChanges {
  @Input() prescriptionId!: number;
  @Input() show: boolean = false;
  @Output() close = new EventEmitter<void>();

  loading = false;
  medicines: MedicineMatch[] = [];
  summary: OrderSummary | null = null;
  prescriptionInfo: any = null;

  // Track selected products for unmatched medicines
  selectedProducts: { [medicineId: number]: number } = {};

  constructor(
    private prescriptionOrderService: PrescriptionOrderService,
    private snackbarService: SnackbarService,
    private router: Router
  ) { }

  ngOnInit() {
    // Don't load automatically - wait for modal to be shown
  }

  ngOnChanges(changes: any) {
    // Only load when modal is shown and we have a valid prescription ID
    if (changes['show'] && this.show && this.prescriptionId > 0) {
      this.loadMedicinesForOrder();
    }
  }

  loadMedicinesForOrder() {
    this.loading = true;
    this.prescriptionOrderService.getMedicinesForOrder(this.prescriptionId).subscribe({
      next: (response) => {
        this.medicines = response.medicines;
        this.summary = response.summary;
        this.prescriptionInfo = response.prescription;

        // Initialize quantities with calculated values
        this.medicines.forEach(medicine => {
          if (!medicine.matched_product) {
            this.selectedProducts[medicine.id] = 0;
          }
        });

        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading medicines:', error);
        this.snackbarService.error(error.error?.error || 'Failed to load prescription medicines');
        this.loading = false;
        this.closeModal();
      }
    });
  }

  updateQuantity(medicine: MedicineMatch, change: number) {
    const newQuantity = medicine.quantity_needed + change;
    if (newQuantity > 0 && medicine.matched_product) {
      medicine.quantity_needed = newQuantity;
      this.recalculateTotal();
    }
  }

  selectProduct(medicineId: number, productId: number) {
    this.selectedProducts[medicineId] = productId;
  }

  recalculateTotal() {
    let total = 0;

    this.medicines.forEach(medicine => {
      if (medicine.matched_product && medicine.matched_product.available) {
        total += medicine.matched_product.price * medicine.quantity_needed;
      }
    });

    if (this.summary) {
      this.summary.total_amount = parseFloat(total.toFixed(2));

      // Recalculate discount
      if (this.summary.discount_applicable) {
        this.summary.discount_amount = parseFloat((total * 0.1).toFixed(2)); // 10%
        if (this.summary.discount_amount > 500) {
          this.summary.discount_amount = 500; // Max discount
        }
      }

      this.summary.final_amount = parseFloat((total - this.summary.discount_amount).toFixed(2));
    }
  }

  addToCart() {
    // Prepare items for cart
    const items = [];

    for (const medicine of this.medicines) {
      let productId = 0;

      if (medicine.matched_product && medicine.matched_product.available) {
        productId = medicine.matched_product.id;
      } else if (this.selectedProducts[medicine.id]) {
        productId = this.selectedProducts[medicine.id];
      }

      if (productId > 0) {
        items.push({
          medicine_id: medicine.id,
          product_id: productId,
          quantity: medicine.quantity_needed
        });
      }
    }

    if (items.length === 0) {
      this.snackbarService.error('Please select products for all medicines');
      return;
    }

    this.loading = true;
    this.prescriptionOrderService.addPrescriptionToCart(
      this.prescriptionId,
      items,
      true // apply discount
    ).subscribe({
      next: (response) => {
        this.snackbarService.success(`${items.length} medicine(s) added to cart! Saved ₹${response.discount_amount}`);
        this.loading = false;
        this.closeModal();

        // Navigate to cart
        this.router.navigate(['/cart']);
      },
      error: (error) => {
        console.error('Error adding to cart:', error);
        this.snackbarService.error(error.error?.error || 'Failed to add medicines to cart');
        this.loading = false;
      }
    });
  }

  closeModal() {
    this.close.emit();
  }

  getMatchBadgeClass(matchType: string): string {
    switch (matchType) {
      case 'exact':
        return 'bg-green-100 text-green-800';
      case 'high':
        return 'bg-blue-100 text-blue-800';
      case 'good':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getMatchBadgeText(matchType: string, similarity: number): string {
    switch (matchType) {
      case 'exact':
        return 'Exact Match';
      case 'high':
        return `${(similarity * 100).toFixed(0)}% Match`;
      case 'good':
        return `${(similarity * 100).toFixed(0)}% Match`;
      default:
        return 'No Match';
    }
  }
}
