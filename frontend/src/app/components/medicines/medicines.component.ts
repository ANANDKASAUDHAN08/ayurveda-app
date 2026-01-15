import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SearchResult } from '../../shared/services/search.service';
import { SnackbarService } from '../../shared/services/snackbar.service';
import { ProductDetailModalComponent } from '../product-detail-modal/product-detail-modal.component';

import { HttpClient, HttpParams } from '@angular/common/http';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { MobileLocationBarComponent } from '../../shared/components/mobile-location-bar/mobile-location-bar.component';

@Component({
  selector: 'app-medicines',
  standalone: true,
  imports: [CommonModule, FormsModule, ProductDetailModalComponent, MobileLocationBarComponent],
  templateUrl: './medicines.component.html',
  styleUrls: ['./medicines.component.css']
})
export class MedicinesComponent implements OnInit, OnDestroy {
  medicines: SearchResult[] = [];
  allMedicines: SearchResult[] = [];
  loading = false;
  selectedProduct: SearchResult | null = null;
  Math = Math;

  // Pagination
  currentPage = 1;
  itemsPerPage = 20;
  totalMedicines = 0;
  totalPages = 0;
  private apiUrl = environment.apiUrl;

  // Filters
  searchQuery = '';
  selectedCategory = '';
  selectedManufacturer = '';
  categories: string[] = [];
  manufacturers: string[] = [];
  sortBy = 'name_asc';
  minPrice: number | null = null;
  maxPrice: number | null = null;

  // Suggestions
  suggestions: any[] = [];
  showSuggestions = false;

  sortOptions = [
    { value: 'name_asc', label: 'Name (A-Z)' },
    { value: 'name_desc', label: 'Name (Z-A)' },
    { value: 'price_asc', label: 'Price (Low to High)' },
    { value: 'price_desc', label: 'Price (High to Low)' }
  ];

  // UI State
  showCategoryDropdown = false;
  isSearching = false;
  showMobileFilters = false;
  activeDropdown: 'sort' | 'price' | 'manufacturer' | null = null;

  // Medicine type context - Local state only
  currentMedicineType: 'all' | 'allopathy' | 'ayurveda' | 'homeopathy' = 'all';
  medicineTypes: ('all' | 'allopathy' | 'ayurveda' | 'homeopathy')[] = ['all', 'allopathy', 'ayurveda', 'homeopathy'];
  private destroy$ = new Subject<void>();

  constructor(
    private snackbarService: SnackbarService,
    private http: HttpClient,
  ) { }

  @HostListener('document:click')
  onDocumentClick() {
    this.activeDropdown = null;
    this.showCategoryDropdown = false;
    this.showSuggestions = false;
  }

  ngOnInit() {
    this.loadCategories();
    this.loadManufacturers();
    this.currentMedicineType = 'all';
    this.loadMedicines();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadCategories() {
    this.http.get<{ success: boolean; data: string[] }>(`${this.apiUrl}/medicines/categories`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.categories = res.data;
          }
        },
        error: (err) => console.error('Error loading categories:', err)
      });
  }

  loadManufacturers() {
    this.http.get<{ success: boolean; data: string[] }>(`${this.apiUrl}/medicines/manufacturers`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.manufacturers = res.data;
          }
        },
        error: (err) => console.error('Error loading manufacturers:', err)
      });
  }

  loadMedicines() {
    this.loading = true;
    this.isSearching = true;

    let params = new HttpParams()
      .set('page', this.currentPage.toString())
      .set('limit', this.itemsPerPage.toString())
      .set('sortBy', this.sortBy);

    if (this.currentMedicineType && this.currentMedicineType !== 'all') {
      params = params.set('medicineSystem', this.currentMedicineType);
    }
    if (this.selectedCategory) {
      params = params.set('category', this.selectedCategory);
    }
    if (this.selectedManufacturer) {
      params = params.set('manufacturer', this.selectedManufacturer);
    }
    if (this.searchQuery) {
      params = params.set('q', this.searchQuery);
    }
    if (this.minPrice !== null) {
      params = params.set('minPrice', this.minPrice.toString());
    }
    if (this.maxPrice !== null) {
      params = params.set('maxPrice', this.maxPrice.toString());
    }

    this.http.get<{ success: boolean; data: any }>(`${this.apiUrl}/medicines`, { params })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.medicines = res.data.results;
            this.totalMedicines = res.data.pagination.total;
            this.totalPages = res.data.pagination.totalPages;
          }
          this.loading = false;
          this.isSearching = false;
        },
        error: (err) => {
          console.error('Error loading medicines:', err);
          this.loading = false;
          this.isSearching = false;
          this.snackbarService.show('Failed to load medicines', 'error');
        }
      });
  }

  selectMedicineType(type: 'all' | 'allopathy' | 'ayurveda' | 'homeopathy') {
    this.currentMedicineType = type;
    this.currentPage = 1;
    this.loadMedicines();
  }

  onSearchInput() {
    if (this.searchQuery.length >= 2) {
      this.showSuggestions = true;
      this.http.get<{ success: boolean; data: any[] }>(`${this.apiUrl}/medicines/suggestions`, {
        params: new HttpParams().set('q', this.searchQuery)
      })
        .pipe(takeUntil(this.destroy$))
        .subscribe(res => {
          if (res.success) {
            this.suggestions = res.data;
          }
        });
    } else {
      this.showSuggestions = false;
      this.suggestions = [];
    }
  }

  selectSuggestion(suggestion: any) {
    this.searchQuery = suggestion.name;
    this.showSuggestions = false;
    this.onSearch(); // Explicitly trigger search when a suggestion is selected
  }

  hideSuggestionsWithDelay() {
    setTimeout(() => {
      this.showSuggestions = false;
    }, 200);
  }

  onSearch() {
    this.showSuggestions = false;
    this.currentPage = 1;
    this.loadMedicines();
  }

  applyFilters() {
    this.currentPage = 1;
    this.loadMedicines();
  }

  selectCategory(category: string) {
    this.selectedCategory = this.selectedCategory === category ? '' : category;
    this.currentPage = 1;
    this.loadMedicines();
  }

  selectManufacturer(manufacturer: string) {
    this.selectedManufacturer = this.selectedManufacturer === manufacturer ? '' : manufacturer;
    this.currentPage = 1;
    this.loadMedicines();
  }

  clearFilters() {
    this.searchQuery = '';
    this.selectedCategory = '';
    this.selectedManufacturer = '';
    this.currentMedicineType = 'all';
    this.sortBy = 'name_asc';
    this.minPrice = null;
    this.maxPrice = null;
    this.currentPage = 1;
    this.loadMedicines();
  }

  openDetails(medicine: SearchResult) {
    this.selectedProduct = medicine;
  }

  closeDetails() {
    this.selectedProduct = null;
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadMedicines();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadMedicines();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  goToPage(page: number) {
    this.currentPage = page;
    this.loadMedicines();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  get pageNumbers(): number[] {
    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, this.currentPage - 2);
    let endPage = Math.min(this.totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  }

  hasActiveFilters(): boolean {
    return !!(
      this.searchQuery ||
      this.selectedCategory ||
      this.selectedManufacturer ||
      this.maxPrice !== null ||
      this.currentMedicineType !== 'all'
    );
  }

  selectPrice(price: number | null) {
    this.maxPrice = price;
    this.activeDropdown = null;
    this.applyFilters();
  }

  getSortLabel(): string {
    const option = this.sortOptions.find(o => o.value === this.sortBy);
    return option ? option.label : 'Sort By';
  }

  selectSort(value: string) {
    this.sortBy = value;
    this.activeDropdown = null;
    this.applyFilters();
  }

  toggleDropdown(name: 'sort' | 'price' | 'manufacturer') {
    if (this.activeDropdown === name) {
      this.activeDropdown = null;
    } else {
      this.activeDropdown = name;
      this.showSuggestions = false;
    }
  }
}