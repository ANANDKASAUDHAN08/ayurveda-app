import { Component, Input, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { LocationSelectorComponent } from '../location-selector/location-selector.component';
import { Subscription } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { CartService } from 'src/app/shared/services/cart.service';
import { SearchService } from '../../services/search.service';
import { SnackbarService } from '../../services/snackbar.service';
import { NotificationBellComponent } from '../../../components/shared/notification-bell/notification-bell.component';

@Component({
  selector: 'app-top-navbar',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    LocationSelectorComponent,
    FormsModule,
    NotificationBellComponent
  ],
  templateUrl: './top-navbar.component.html',
  styleUrl: './top-navbar.component.css'
})
export class TopNavbarComponent implements OnInit, OnDestroy {
  @Input() onMenuToggle?: () => void;

  searchQuery: string = '';

  // User info for profile display
  userName: string = '';
  userRole: string = '';
  userInitials: string = '';
  showMobileSearch = false;

  profileMenuOpen: boolean = false;
  loginDropdownOpen: boolean = false; // For login dropdown
  shopDropdownOpen: boolean = false; // NEW: For shop dropdown
  myHealthDropdownOpen: boolean = false; // NEW: For my health dropdown
  careDropdownOpen: boolean = false; // NEW: For find care dropdown

  cartCount = 0;
  isLoggedIn = false;
  private cartSubscription?: Subscription;
  private authSubscription?: Subscription;

  // Search autocomplete
  showSuggestions = false;
  suggestions: any[] = [];
  searchHistory: string[] = [];
  popularSearches: string[] = [];
  private suggestionTimeout: any;

  constructor(
    public router: Router,
    public authService: AuthService,
    private cartService: CartService,
    private searchService: SearchService,
    private snackbarService: SnackbarService
  ) { }

  ngOnInit() {
    // Subscribe to cart count
    this.cartSubscription = this.cartService.cartCount$.subscribe(
      count => this.cartCount = count
    );
    // Subscribe to auth state
    this.authSubscription = this.authService.authStatus$.subscribe(
      isLoggedIn => {
        this.isLoggedIn = isLoggedIn;
        if (isLoggedIn) {
          this.updateUserData();
        } else {
          this.clearUserData();
        }
      }
    );

    // Load search data
    this.loadSearchData();
  }

  ngOnDestroy() {
    this.cartSubscription?.unsubscribe();
    this.authSubscription?.unsubscribe();
  }

  // Update user data from authService
  private updateUserData() {
    const user = this.authService.getUser();
    this.userName = user?.name || '';
    this.userRole = user?.role || '';
    this.userInitials = this.calculateInitials(user?.name || 'U');
  }

  // Clear user data on logout
  private clearUserData() {
    this.userName = '';
    this.userRole = '';
    this.userInitials = '';
  }

  // Calculate user initials
  private calculateInitials(name: string): string {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  // Get user initials for template
  getUserInitials(): string {
    return this.userInitials;
  }

  isAdminRoute(): boolean {
    return this.router.url.startsWith('/admin');
  }

  toggleProfileMenu() {
    this.profileMenuOpen = !this.profileMenuOpen;
  }

  toggleHamburger() {
    if (this.onMenuToggle) {
      this.onMenuToggle();
    }
  }

  toggleLoginDropdown() {
    this.loginDropdownOpen = !this.loginDropdownOpen;
    // Close other dropdowns
    this.shopDropdownOpen = false;
    this.myHealthDropdownOpen = false;
    this.careDropdownOpen = false;
  }

  // NEW: Toggle shop dropdown
  toggleShopDropdown() {
    this.shopDropdownOpen = !this.shopDropdownOpen;
    // Close other dropdowns
    this.loginDropdownOpen = false;
    this.myHealthDropdownOpen = false;
    this.profileMenuOpen = false;
    this.careDropdownOpen = false;
  }

  // NEW: Toggle my health dropdown
  toggleMyHealthDropdown() {
    this.myHealthDropdownOpen = !this.myHealthDropdownOpen;
    // Close other dropdowns
    this.loginDropdownOpen = false;
    this.shopDropdownOpen = false;
    this.profileMenuOpen = false;
    this.careDropdownOpen = false;
  }

  // NEW: Toggle care dropdown
  toggleCareDropdown() {
    this.careDropdownOpen = !this.careDropdownOpen;
    // Close other dropdowns
    this.loginDropdownOpen = false;
    this.shopDropdownOpen = false;
    this.myHealthDropdownOpen = false;
    this.profileMenuOpen = false;
  }

  onSearch() {
    if (this.searchQuery.trim()) {
      this.router.navigate(['/search'], { queryParams: { q: this.searchQuery } });
    }
  }

  // Load search history and popular searches
  loadSearchData() {
    this.searchHistory = this.searchService.getSearchHistory();

    this.searchService.getPopularSearches().subscribe({
      next: (response) => {
        if (response.success) {
          this.popularSearches = response.data;
        }
      }, error: (err) => {
        this.snackbarService.show('Could not load popular searches', 'error');
      }
    });
  }

  onSearchInput() {
    // Clear previous timeout
    if (this.suggestionTimeout) {
      clearTimeout(this.suggestionTimeout);
    }

    // Hide suggestions if query is too short
    if (this.searchQuery.length < 2) {
      this.suggestions = [];
      this.showSuggestions = false;
      return;
    }

    // Debounce - wait 300ms after user stops typing
    this.suggestionTimeout = setTimeout(() => {
      this.searchService.getSuggestions(this.searchQuery).subscribe({
        next: (response) => {
          if (response.success) {
            this.suggestions = response.data;
            this.showSuggestions = true;
          }
        },
        error: (err) => {
          // Silent failure - suggestions not critical
          this.suggestions = [];
        }
      });
    }, 300);
  }

  // Show dropdown when focused
  onFocusSearch() {
    this.searchHistory = this.searchService.getSearchHistory();
    if (this.searchQuery.length === 0) {
      this.showSuggestions = true;
    } else if (this.searchQuery.length >= 2) {
      this.onSearchInput();
    }
  }

  // Hide dropdown when clicked outside
  onBlurSearch() {
    // Delay to allow click on suggestion
    setTimeout(() => {
      this.showSuggestions = false;
    }, 200);
  }

  // Select a suggestion
  selectSuggestion(suggestion: any) {
    this.searchQuery = suggestion.name;
    this.showSuggestions = false;
    this.onSearch();
  }

  // Search from history
  searchFromHistory(term: string) {
    this.searchQuery = term;
    this.showSuggestions = false;
    this.onSearch();
  }

  // Search popular term
  searchPopular(term: string) {
    this.searchQuery = term;
    this.showSuggestions = false;
    this.onSearch();
  }

  // Clear search history
  clearHistory() {
    this.searchService.clearSearchHistory();
    this.searchHistory = [];
  }

  navigateToSearch() {
    this.router.navigate(['/search']);
  }

  // Toggle mobile search overlay
  toggleMobileSearch() {
    this.showMobileSearch = !this.showMobileSearch;

    // Reset suggestions when closing
    if (!this.showMobileSearch) {
      this.suggestions = [];
    }
  }

  // Perform search from mobile overlay
  performMobileSearch() {
    if (this.searchQuery.trim()) {
      this.showMobileSearch = false;
      this.onSearch();
    }
  }

  // Select suggestion on mobile
  selectSuggestionMobile(suggestion: any) {
    this.searchQuery = suggestion.name;
    this.showMobileSearch = false;
    this.onSearch();
  }

  // Search from history on mobile
  searchFromHistoryMobile(term: string) {
    this.searchQuery = term;
    this.showMobileSearch = false;
    this.onSearch();
  }

  // Search popular term on mobile
  searchPopularMobile(term: string) {
    this.searchQuery = term;
    this.showMobileSearch = false;
    this.onSearch();
  }

  navigateToOrders() {
    this.router.navigate(['/orders']);
    this.profileMenuOpen = false;
  }

  navigateToDashboard() {
    const role = this.authService.getRole();
    if (role === 'doctor') {
      this.router.navigate(['/doctor/dashboard']);
    } else {
      this.router.navigate(['/user/dashboard']);
    }
    this.profileMenuOpen = false;
  }

  navigateToProfile() {
    const role = this.authService.getRole();
    if (role === 'doctor') {
      this.router.navigate(['/doctor/profile']);
    } else {
      this.router.navigate(['/user/profile']);
    }
    this.profileMenuOpen = false;
  }

  navigateToSettings() {
    const role = this.authService.getRole();
    if (role === 'doctor') {
      this.router.navigate(['/doctor/settings']);
    } else {
      this.router.navigate(['/user/settings']);
    }
    this.profileMenuOpen = false;
  }

  logout() {
    this.authService.logout();
    this.clearUserData();
    this.profileMenuOpen = false;
    this.router.navigate(['/']);
  }

  // Close dropdowns when clicking outside
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;

    // Close login dropdown if clicking outside
    if (this.loginDropdownOpen && !target.closest('.login-dropdown-container')) {
      this.loginDropdownOpen = false;
    }

    // Close profile menu if clicking outside  
    if (this.profileMenuOpen && !target.closest('.profile-menu-container')) {
      this.profileMenuOpen = false;
    }

    // NEW: Close shop dropdown if clicking outside
    if (this.shopDropdownOpen && !target.closest('.shop-dropdown-container')) {
      this.shopDropdownOpen = false;
    }

    // NEW: Close my health dropdown if clicking outside
    if (this.myHealthDropdownOpen && !target.closest('.my-health-dropdown-container')) {
      this.myHealthDropdownOpen = false;
    }

    // NEW: Close care dropdown if clicking outside
    if (this.careDropdownOpen && !target.closest('.care-dropdown-container')) {
      this.careDropdownOpen = false;
    }
  }
}