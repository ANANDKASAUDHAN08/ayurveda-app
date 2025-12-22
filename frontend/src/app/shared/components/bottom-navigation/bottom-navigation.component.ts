import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';
import { CartService } from '../../services/cart.service';
import { Subscription } from 'rxjs';


@Component({
  selector: 'app-bottom-navigation',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './bottom-navigation.component.html',
  styleUrl: './bottom-navigation.component.css'
})
export class BottomNavigationComponent implements OnInit, OnDestroy {
  activeRoute: string = '';
  isLoggedIn = false;
  cartCount = 0;
  navItems: any[] = [];
  showLoginDropdown = false;

  private authSubscription?: Subscription;
  private cartSubscription?: Subscription;
  @Output() navItemClicked = new EventEmitter<void>();

  constructor(
    private router: Router,
    private authService: AuthService,
    private cartService: CartService
  ) {
    this.updateActiveRoute();

    router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.updateActiveRoute();
    });
  }

  ngOnInit() {
    // Subscribe to auth state
    this.authSubscription = this.authService.authStatus$.subscribe(isLoggedIn => {
      this.isLoggedIn = isLoggedIn;
      this.updateNavItems();
    });

    // Subscribe to cart count
    this.cartSubscription = this.cartService.cartCount$.subscribe(count => {
      this.cartCount = count;
      this.updateNavItems();
    });
  }

  ngOnDestroy() {
    this.authSubscription?.unsubscribe();
    this.cartSubscription?.unsubscribe();
  }

  updateNavItems() {
    if (this.isLoggedIn) {
      // Logged in: Show Home, SOS, Cart (with badge), Profile
      this.navItems = [
        { icon: 'fas fa-home', label: 'Home', route: '/' },
        { icon: 'fas fa-ambulance', label: 'SOS', route: '/emergency', isEmergency: true },
        { icon: 'fas fa-shopping-cart', label: 'Cart', route: '/cart', badge: this.cartCount },
        { icon: 'fas fa-user', label: 'Profile', route: '/user/profile' }
      ];
    } else {
      // Not logged in: Show Home, SOS, Medicine, Login
      this.navItems = [
        { icon: 'fas fa-home', label: 'Home', route: '/' },
        { icon: 'fas fa-ambulance', label: 'SOS', route: '/emergency', isEmergency: true },
        { icon: 'fas fa-pills', label: 'Medicine', route: '/medicines' },
        { icon: 'fas fa-sign-in-alt', label: 'Login', route: '/for-users' }
      ];
    }
  }

  updateActiveRoute() {
    this.activeRoute = this.router.url;
    this.navItemClicked.emit();
  }

  isActive(route: string): boolean {
    if (route === '/') {
      return this.activeRoute === '/';
    }
    return this.activeRoute.startsWith(route);
  }

  toggleLoginDropdown(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    this.showLoginDropdown = !this.showLoginDropdown;
  }

  navigateToLogin(type: 'user' | 'doctor', event: Event) {
    event.preventDefault();
    event.stopPropagation();
    const route = type === 'user' ? '/for-users' : '/for-doctors';
    this.router.navigate([route]);
    this.showLoginDropdown = false;
  }
}