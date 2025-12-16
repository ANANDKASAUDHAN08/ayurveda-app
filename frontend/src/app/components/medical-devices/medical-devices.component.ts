import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { SearchService, SearchResult } from '../../shared/services/search.service';
import { CartService } from '../../shared/services/cart.service';
import { SnackbarService } from '../../shared/services/snackbar.service';
import { ProductDetailModalComponent } from '../product-detail-modal/product-detail-modal.component';

@Component({
  selector: 'app-medical-devices',
  standalone: true,
  imports: [CommonModule, FormsModule, ProductDetailModalComponent],
  templateUrl: './medical-devices.component.html',
  styleUrls: ['./medical-devices.component.css']
})
export class MedicalDevicesComponent implements OnInit {
  devices: SearchResult[] = [];
  loading = false;
  addingToCart: { [key: string]: boolean } = {};
  selectedProduct: SearchResult | null = null;

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

  constructor(
    private searchService: SearchService,
    private cartService: CartService,
    private snackbarService: SnackbarService,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit() {
    this.loadCategories();

    // Check for query params
    this.route.queryParams.subscribe(params => {
      this.searchQuery = params['q'] || '';
      this.selectedCategory = params['category'] || '';
      this.sortBy = params['sortBy'] || 'name_asc';
      this.loadDevices();
    });
  }

  loadCategories() {
    this.categories = this.searchService.getCategories();
  }

  loadDevices() {
    this.loading = true;

    this.searchService.searchProducts({
      q: this.searchQuery,
      type: 'device',
      category: this.selectedCategory,
      sortBy: this.sortBy,
      page: 1,
      limit: 100
    }).subscribe({
      next: (response) => {
        if (response.success) {
          this.devices = response.data.results;
        }
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.snackbarService.show('Failed to load medical devices', 'error');
      }
    });
  }

  addToCart(device: SearchResult) {
    const key = `device-${device.id}`;
    this.addingToCart[key] = true;

    this.cartService.addToCart({
      product_id: device.id,
      product_type: 'device',
      quantity: 1,
      price: device.price
    }).subscribe({
      next: () => {
        this.addingToCart[key] = false;
        this.snackbarService.show(`${device.name} added to cart!`, 'success');
      },
      error: () => {
        this.addingToCart[key] = false;
        this.snackbarService.show('Failed to add to cart', 'error');
      }
    });
  }

  openDetails(device: SearchResult) {
    this.selectedProduct = device;
  }

  closeDetails() {
    this.selectedProduct = null;
  }

  addToCartFromModal(device: SearchResult) {
    this.addToCart(device);
    this.closeDetails();
  }

  applyFilters() {
    this.router.navigate([], {
      queryParams: {
        q: this.searchQuery || null,
        category: this.selectedCategory || null,
        sortBy: this.sortBy
      },
      queryParamsHandling: 'merge'
    });
  }

  clearFilters() {
    this.searchQuery = '';
    this.selectedCategory = '';
    this.sortBy = 'name_asc';
    this.loadDevices();
  }
}