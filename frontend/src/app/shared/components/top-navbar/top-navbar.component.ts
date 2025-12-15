import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { LocationSelectorComponent } from '../location-selector/location-selector.component';
import { Subscription } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { CartService } from 'src/app/services/cart.service';

@Component({
  selector: 'app-top-navbar',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    LocationSelectorComponent,
    FormsModule
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

  profileMenuOpen: boolean = false;

  cartCount = 0;
  isLoggedIn = false;
  private cartSubscription?: Subscription;
  private authSubscription?: Subscription;

  constructor(
    public router: Router,
    public authService: AuthService,
    private cartService: CartService
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

  onSearch() {
    if (this.searchQuery.trim()) {
      this.router.navigate(['/search'], { queryParams: { q: this.searchQuery } });
    }
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

  logout() {
    this.authService.logout();
    this.clearUserData();
    this.profileMenuOpen = false;
    this.router.navigate(['/']);
  }
}