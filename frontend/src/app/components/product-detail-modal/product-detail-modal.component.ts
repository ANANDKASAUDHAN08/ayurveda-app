import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SearchResult } from '../../shared/services/search.service';

@Component({
  selector: 'app-product-detail-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-detail-modal.component.html',
  styleUrls: ['./product-detail-modal.component.css']
})
export class ProductDetailModalComponent {
  @Input() product!: SearchResult;
  @Output() close = new EventEmitter<void>();
  @Output() addToCart = new EventEmitter<SearchResult>();

  closeModal() {
    this.close.emit();
  }

  onAddToCart() {
    this.addToCart.emit(this.product);
  }

  getProductIcon(): string {
    return this.product.product_type === 'medicine' ? 'fa-pills' : 'fa-stethoscope';
  }

  getProductTypeLabel(): string {
    return this.product.product_type === 'medicine' ? 'Medicine' : 'Medical Device';
  }
}