import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, Renderer2 } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SearchResult } from '../../shared/services/search.service';

@Component({
  selector: 'app-product-detail-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-detail-modal.component.html',
  styleUrls: ['./product-detail-modal.component.css']
})
export class ProductDetailModalComponent implements OnInit, OnDestroy {
  @Input() product!: SearchResult;
  @Output() close = new EventEmitter<void>();
  @Output() addToCart = new EventEmitter<SearchResult>();

  constructor(private renderer: Renderer2) { }

  ngOnInit() {
    // Prevent background scrolling more robustly
    const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
    this.renderer.setStyle(document.body, 'overflow', 'hidden');
    if (scrollBarWidth > 0) {
      this.renderer.setStyle(document.body, 'padding-right', `${scrollBarWidth}px`);
    }
  }

  ngOnDestroy() {
    // Restore background scrolling and padding
    this.renderer.removeStyle(document.body, 'overflow');
    this.renderer.removeStyle(document.body, 'padding-right');
  }

  activeTab: 'overview' | 'safety' | 'interactions' | 'substitutes' = 'overview';

  tabs: { id: 'overview' | 'safety' | 'interactions' | 'substitutes', label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'safety', label: 'Safety' },
    { id: 'interactions', label: 'Interactions' },
    { id: 'substitutes', label: 'Substitutes' }
  ];

  setTab(tab: any) {
    this.activeTab = tab;
  }

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

  getParsedSubstitutes(): any[] {
    if (!this.product.substitutes) return [];
    if (Array.isArray(this.product.substitutes)) return this.product.substitutes;
    try {
      if (typeof this.product.substitutes === 'string') {
        const parsed = JSON.parse(this.product.substitutes);
        return Array.isArray(parsed) ? parsed.map((s: any) => typeof s === 'string' ? { name: s, manufacturer: 'Generic' } : s) : [];
      }
    } catch (e) { }
    return [];
  }

  getParsedInteractions(): { drug: string[], brand: string[], effect: string[] } | null {
    if (!this.product.drug_interactions) return null;
    try {
      let data: any = this.product.drug_interactions;
      if (typeof data === 'string') {
        data = JSON.parse(data);
      }
      if (data && Array.isArray(data.drug) && data.drug.length > 0) {
        return data;
      }
    } catch (e) { }
    return null;
  }

  getParsedSideEffects(): string[] {
    if (!this.product.side_effects_list) return [];
    try {
      let data = this.product.side_effects_list;
      if (typeof data === 'string') {
        // Check if it's JSON
        if (data.trim().startsWith('[') || data.trim().startsWith('{')) {
          const parsed = JSON.parse(data);
          return Array.isArray(parsed) ? parsed : [];
        }
        // Fallback: split by newline or comma if it's a list
        return data.split(/[,\n]/).map(s => s.trim()).filter(s => s.length > 0);
      }
    } catch (e) { }
    return this.product.side_effects_list ? [this.product.side_effects_list] : [];
  }

  getReviewWidth(type: 'excellent' | 'average' | 'poor'): string {
    if (!this.product.review_percent) return '0%';
    const percent = (this.product.review_percent as any)[type] || 0;
    return percent + '%';
  }
}