import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { SearchService, SearchResult } from '../../shared/services/search.service';
import { CartService } from '../../shared/services/cart.service';
import { SnackbarService } from '../../shared/services/snackbar.service';
import { ProductDetailModalComponent } from '../product-detail-modal/product-detail-modal.component';
import { MedicineTypeService, MedicineType, FilterMode } from '../../shared/services/medicine-type.service';
import { ContextBannerComponent } from '../../shared/components/context-banner/context-banner.component';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MobileLocationBarComponent } from '../../shared/components/mobile-location-bar/mobile-location-bar.component';

@Component({
  selector: 'app-medicines',
  standalone: true,
  imports: [CommonModule, FormsModule, ProductDetailModalComponent, ContextBannerComponent, MobileLocationBarComponent],
  templateUrl: './medicines.component.html',
  styleUrls: ['./medicines.component.css']
})
export class MedicinesComponent implements OnInit {
  medicines: SearchResult[] = [];
  allMedicines: SearchResult[] = []; // Store all medicines for client-side filtering
  loading = false;
  addingToCart: { [key: string]: boolean } = {};
  selectedProduct: SearchResult | null = null;

  // Expose Math for template
  Math = Math;

  // Pagination
  currentPage = 1;
  itemsPerPage = 20;
  totalMedicines = 0;

  // Filters
  searchQuery = '';
  selectedCategory = '';
  categories: string[] = [];
  sortBy = 'name_asc';

  sortOptions = [
    { value: 'name_asc', label: 'Name (A-Z)' },
    { value: 'name_desc', label: 'Name (Z-A)' },
    { value: 'price_asc', label: 'Price (Low to High)' },
    { value: 'price_desc', label: 'Price (High to Low)' }
  ];

  // Medicine type context
  currentMedicineType: MedicineType | 'all' = 'all';
  private destroy$ = new Subject<void>();

  constructor(
    private searchService: SearchService,
    private cartService: CartService,
    private snackbarService: SnackbarService,
    private route: ActivatedRoute,
    private router: Router,
    private medicineTypeService: MedicineTypeService
  ) { }

  ngOnInit() {
    this.loadCategories();

    // Track medicine type changes and reapply filtering
    this.medicineTypeService.getCurrentType().pipe(takeUntil(this.destroy$)).subscribe(type => {
      this.currentMedicineType = type;
      this.applyMedicineTypeFilter(); // Refilter when type changes
    });

    // Check for query params
    this.route.queryParams.subscribe(params => {
      this.searchQuery = params['q'] || '';
      this.selectedCategory = params['category'] || '';
      this.sortBy = params['sortBy'] || 'name_asc';
      this.loadMedicines();
    });
  }

  loadCategories() {
    this.categories = this.searchService.getCategories();
  }

  loadMedicines() {
    this.loading = true;

    this.searchService.searchProducts({
      q: this.searchQuery,
      type: 'medicine',
      category: this.selectedCategory,
      sortBy: this.sortBy,
      page: this.currentPage,
      limit: this.itemsPerPage
    }).subscribe({
      next: (response) => {
        if (response.success) {
          this.allMedicines = response.data.results;
          this.applyMedicineTypeFilter(); // Apply client-side medicine type filtering
          this.totalMedicines = this.medicines.length; // Update with filtered count
        }
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.snackbarService.show('Failed to load medicines', 'error');
      }
    });
  }

  // Client-side filtering by medicine type based on keywords
  applyMedicineTypeFilter() {
    if (this.currentMedicineType === 'all') {
      this.medicines = [...this.allMedicines];
      return;
    }

    // Keywords to identify medicine types
    const ayurvedaKeywords = ['ayur', 'herbal', 'natural', 'churna', 'ashwagandha', 'triphala', 'brahmi', 'tulsi', 'neem', 'amla', 'guduchi', 'shatavari'];
    const homeopathyKeywords = ['homeo', 'dilution', 'arnica', 'belladonna', 'bryonia', 'chamomilla', 'pulsatilla', 'nux vomica', 'rhus tox'];
    const allopathyKeywords = ['tablet', 'capsule', 'syrup', 'injection', 'antibiotic', 'paracetamol', 'ibuprofen', 'aspirin', 'mg', 'ml'];

    this.medicines = this.allMedicines.filter(medicine => {
      const searchText = `${medicine.name} ${medicine.description || ''} ${medicine.category || ''}`.toLowerCase();

      switch (this.currentMedicineType) {
        case 'ayurveda':
          return ayurvedaKeywords.some(keyword => searchText.includes(keyword));
        case 'homeopathy':
          return homeopathyKeywords.some(keyword => searchText.includes(keyword));
        case 'allopathy':
          return allopathyKeywords.some(keyword => searchText.includes(keyword));
        default:
          return true;
      }
    });
  }

  get paginatedMedicines() {
    return this.medicines;
  }

  get totalPages() {
    return Math.ceil(this.totalMedicines / this.itemsPerPage);
  }

  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  addToCart(medicine: SearchResult) {
    const key = `medicine-${medicine.id}`;
    this.addingToCart[key] = true;

    this.cartService.addItem({
      id: String(medicine.id),
      name: medicine.name,
      type: 'medicine',
      price: medicine.price || 0,
      quantity: 1,
      image: ''
    });

    setTimeout(() => {
      this.addingToCart[key] = false;
      this.snackbarService.show(`${medicine.name} added to cart!`, 'success');
    }, 300);
  }

  openDetails(medicine: SearchResult) {
    this.selectedProduct = medicine;
  }

  closeDetails() {
    this.selectedProduct = null;
  }

  addToCartFromModal(medicine: SearchResult) {
    this.addToCart(medicine);
    this.closeDetails();
  }

  applyFilters() {
    this.currentPage = 1; // Reset to first page when filters change
    this.router.navigate([], {
      queryParams: {
        q: this.searchQuery || null,
        category: this.selectedCategory || null,
        sortBy: this.sortBy,
        page: 1
      },
      queryParamsHandling: 'merge'
    });
  }

  clearFilters() {
    this.searchQuery = '';
    this.selectedCategory = '';
    this.sortBy = 'name_asc';
    this.currentPage = 1;
    this.loadMedicines();
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadMedicines();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  nextPage() {
    this.goToPage(this.currentPage + 1);
  }

  previousPage() {
    this.goToPage(this.currentPage - 1);
  }

  // Context banner actions
  onToggleFilter() {
    // Filter mode toggle not implemented in service
    this.applyMedicineTypeFilter();
  }

  onClearFilter() {
    // Set to default type
    this.currentMedicineType = 'all';
    this.applyMedicineTypeFilter();
  }

  onSwitchType(type: MedicineType) {
    this.medicineTypeService.setMedicineType(type);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}