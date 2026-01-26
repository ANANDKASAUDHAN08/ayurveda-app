import { Component, Input, Output, EventEmitter, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CusTruncatePipe } from 'src/app/shared/pipes/cus-truncate.pipe';

@Component({
  selector: 'app-medicine-card',
  standalone: true,
  imports: [CommonModule, CusTruncatePipe],
  templateUrl: './medicine-card.component.html',
  styleUrl: './medicine-card.component.css'
})
export class MedicineCardComponent implements OnInit {
  @Input() product: any;
  @Input() isAddingToCart: boolean = false;
  @Input() viewMode: 'grid' | 'list' = 'grid';
  @Input() highlightText: string = '';

  @Output() addToCart = new EventEmitter<any>();
  @Output() viewDetails = new EventEmitter<any>();

  isMobile: boolean = false;

  ngOnInit(): void {
    this.checkScreenSize();
  }

  @HostListener('window:resize')
  onResize() {
    this.checkScreenSize();
  }

  private checkScreenSize() {
    this.isMobile = window.innerWidth < 768; // Tailwind's 'md' breakpoint
  }

  onAddToCart(event: Event) {
    event.stopPropagation();
    this.addToCart.emit(this.product);
  }

  onViewDetails(event: Event) {
    event.stopPropagation();
    this.viewDetails.emit(this.product);
  }

  getTypeIcon(type: string): string {
    switch (type) {
      case 'medicine': return 'fa-pills';
      case 'ayurveda_medicine': return 'fa-leaf';
      case 'device': return 'fa-stethoscope';
      case 'pharmacy': return 'fa-hospital';
      case 'lab_test': return 'fa-flask';
      default: return 'fa-medkit';
    }
  }

  // Helper method to highlight text if needed
  highlight(text: string): string {
    if (!text || !this.highlightText) return text;
    const re = new RegExp(`(${this.highlightText})`, 'gi');
    return text.replace(re, '<mark class="bg-yellow-200 p-0 rounded">$1</mark>');
  }
}
