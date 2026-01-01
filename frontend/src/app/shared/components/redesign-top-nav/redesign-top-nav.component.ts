import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';


import { MedicineTypeService, MedicineTypeInfo } from '../../services/medicine-type.service';
import { CartService } from '../../services/cart.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-redesign-top-nav',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './redesign-top-nav.component.html',
  styleUrl: './redesign-top-nav.component.css'
})
export class RedesignTopNavComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();



  // Medicine Types
  medicineTypes: MedicineTypeInfo[] = [];
  showMedicineDropdown = false;
  currentMedicineType: MedicineTypeInfo | undefined;

  // Shop
  showShopDropdown = false;
  shopCategories = [
    { name: 'All Products', slug: 'all', icon: '🏪' },
    { name: 'Medicines', slug: 'medicines', icon: '💊' },
    { name: 'Personal Care', slug: 'personal-care', icon: '🧴' },
    { name: 'Herbal Products', slug: 'herbal', icon: '🌿' },
    { name: 'Medical Devices', slug: 'devices', icon: '🩺' },
    { name: 'Wellness & Fitness', slug: 'wellness', icon: '🧘' }
  ];

  // Cart
  cartItemCount = 0;
  showCartSidebar = false;

  // Search
  showSearchOverlay = false;
  searchQuery = '';

  // Notifications
  showNotifications = false;
  notificationCount = 3; // Example

  // Profile
  showProfileDropdown = false;
  isLoggedIn = false;
  userProfile: any = null;

  // Scroll state
  isScrolled = false;
  lastScrollY = 0;
  showNav = true;

  constructor(
    private medicineTypeService: MedicineTypeService,
    private cartService: CartService,
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.initializeData();
    this.setupScrollListener();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeData(): void {
    // Subscribe to location changes
    // this.locationService.getCurrentLocation()
    //   .pipe(takeUntil(this.destroy$))
    //   .subscribe(location => {
    //     this.currentLocation = location;
    //   });

    // Get popular cities
    // this.popularCities = this.locationService.getPopularCities();
    // this.recentLocations = this.locationService.getRecentLocations();

    // Subscribe to medicine type changes
    this.medicineTypes = this.medicineTypeService.getAllTypes();
    this.medicineTypeService.getCurrentType()
      .pipe(takeUntil(this.destroy$))
      .subscribe(type => {
        this.currentMedicineType = this.medicineTypeService.getTypeInfo(type);
      });

    // Subscribe to cart changes
    this.cartService.getCart()
      .pipe(takeUntil(this.destroy$))
      .subscribe(cart => {
        this.cartItemCount = cart.totalItems;
      });

    // Check auth status
    this.authService.authStatus$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.isLoggedIn = !!user;
        this.userProfile = user;
      });
  }

  private setupScrollListener(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('scroll', () => {
        const currentScrollY = window.scrollY;

        // Determine if scrolled
        this.isScrolled = currentScrollY > 50;

        // Show/hide nav based on scroll direction
        if (currentScrollY > this.lastScrollY && currentScrollY > 100) {
          // Scrolling down
          this.showNav = false;
        } else {
          // Scrolling up
          this.showNav = true;
        }

        this.lastScrollY = currentScrollY;
      });
    }
  }



  // Medicine Type Methods
  toggleMedicineDropdown(): void {
    this.showMedicineDropdown = !this.showMedicineDropdown;
    if (this.showMedicineDropdown) {
      this.closeAllDropdowns('medicine');
    }
  }

  selectMedicineType(type: MedicineTypeInfo): void {
    this.medicineTypeService.setMedicineType(type.id);
    this.router.navigate([type.route]);
    this.showMedicineDropdown = false;
  }

  // Shop Methods
  toggleShopDropdown(): void {
    this.showShopDropdown = !this.showShopDropdown;
    if (this.showShopDropdown) {
      this.closeAllDropdowns('shop');
    }
  }

  navigateToCategory(slug: string): void {
    this.router.navigate(['/shop', slug]);
    this.showShopDropdown = false;
  }

  // Cart Methods
  toggleCartSidebar(): void {
    this.showCartSidebar = !this.showCartSidebar;
  }

  // Search Methods
  toggleSearchOverlay(): void {
    this.showSearchOverlay = !this.showSearchOverlay;
  }

  performSearch(): void {
    if (this.searchQuery.trim()) {
      this.router.navigate(['/search'], { queryParams: { q: this.searchQuery } });
      this.showSearchOverlay = false;
      this.searchQuery = '';
    }
  }

  // Notification Methods
  toggleNotifications(): void {
    this.showNotifications = !this.showNotifications;
    if (this.showNotifications) {
      this.closeAllDropdowns('notifications');
    }
  }

  // Profile Methods
  toggleProfileDropdown(): void {
    this.showProfileDropdown = !this.showProfileDropdown;
    if (this.showProfileDropdown) {
      this.closeAllDropdowns('profile');
    }
  }

  logout(): void {
    this.authService.logout();
    this.showProfileDropdown = false;
  }

  // Navigation
  navigateTo(route: string): void {
    this.router.navigate([route]);
    this.closeAllDropdowns();
  }

  // Utilities
  private closeAllDropdowns(except?: string): void {
    if (except !== 'medicine') this.showMedicineDropdown = false;
    if (except !== 'shop') this.showShopDropdown = false;
    if (except !== 'notifications') this.showNotifications = false;
    if (except !== 'profile') this.showProfileDropdown = false;
  }

  closeAllOnClickOutside(): void {
    this.closeAllDropdowns();
    this.showSearchOverlay = false;
    this.showCartSidebar = false;
  }
}
