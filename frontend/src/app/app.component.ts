import { Component, ViewChild, AfterViewInit, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { NavbarComponent } from './shared/components/navbar/navbar.component';
import { TopNavbarComponent } from './shared/components/top-navbar/top-navbar.component';
import { FooterComponent } from './shared/components/footer/footer.component';
import { SnackbarComponent } from './shared/components/snackbar/snackbar.component';
import { filter, Subscription } from 'rxjs';
import { AuthService } from './shared/services/auth.service';
import { HamburgerMenuComponent } from './shared/components/hamburger-menu/hamburger-menu.component';
import { BottomNavigationComponent } from './shared/components/bottom-navigation/bottom-navigation.component';
import { ScrollToTopComponent } from './shared/components/scroll-to-top/scroll-to-top.component';
import { OfflineIndicatorComponent } from './shared/components/offline-indicator/offline-indicator.component';
import { LocationService, UserLocation } from './shared/services/location.service';
import { LocationBottomSheetComponent } from './shared/components/location-bottom-sheet/location-bottom-sheet.component';
import { LocationMapModalComponent } from './shared/components/location-map-modal/location-map-modal.component';
import { FabMenuComponent } from './shared/components/fab-menu/fab-menu.component';
import { GoogleMapsLoaderService } from './shared/services/google-maps-loader.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    NavbarComponent,
    TopNavbarComponent,
    FooterComponent,
    SnackbarComponent,
    HamburgerMenuComponent,
    BottomNavigationComponent,
    ScrollToTopComponent,
    OfflineIndicatorComponent,
    FabMenuComponent,
    LocationBottomSheetComponent,
    LocationMapModalComponent
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy, AfterViewInit {
  title = 'ayurveda-app';
  @ViewChild(NavbarComponent) navbarComponent!: NavbarComponent;

  hamburgerMenuOpen = false;
  isAdminRoute = false;
  isUserLoggedIn = false;
  isLocationSheetOpen = false;
  showMapModal = false;
  mapsLoaded$ = this.googleMapsLoader.isLoaded$;

  // Subscriptions for cleanup
  private routerSubscription?: Subscription;
  private authSubscription?: Subscription;
  private locationSheetSubscription?: Subscription;
  private mapModalSubscription?: Subscription;

  constructor(
    private router: Router,
    private authService: AuthService,
    public locationService: LocationService,
    private googleMapsLoader: GoogleMapsLoaderService
  ) { }

  ngOnInit(): void {
    this.routerSubscription = this.router.events.subscribe(() => {
      this.isAdminRoute = this.router.url.startsWith('/admin');
      this.closeHamburgerMenu();
    });

    // Dynamically load Google Maps API
    this.googleMapsLoader.load().then(() => {
      console.log('Google Maps API loaded successfully');
    }).catch(err => {
      console.error('Failed to load Google Maps API', err);
    });

    // Handle Location Bottom Sheet
    this.locationSheetSubscription = this.locationService.sheetOpen$.subscribe(open => {
      this.isLocationSheetOpen = open;
    });

    this.mapModalSubscription = this.locationService.openMap$.subscribe(open => {
      this.showMapModal = open;
    });

    /* 
    // Detect location on start if not already stored - REMOVED per user request
    if (!this.locationService.getStoredLocation()) {
      this.locationService.detectLocation();
    }
    */


    // Listen for auth state changes
    this.authSubscription = this.authService.authStatus$.subscribe(isLoggedIn => {
      this.isUserLoggedIn = isLoggedIn;
      if (!isLoggedIn) {
        // User logged out - check if on protected route
        const protectedRoutes = ['/user/', '/doctor/', '/admin/'];
        const currentUrl = this.router.url;

        const isOnProtectedRoute = protectedRoutes.some(route =>
          currentUrl.startsWith(route)
        );
        if (isOnProtectedRoute) {
          // Redirect to home
          this.router.navigate(['/']);
        }
      }
    });


  }

  ngAfterViewInit() {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      const tree = this.router.parseUrl(this.router.url);
      if (tree.fragment) {
        setTimeout(() => {
          const element = document.getElementById(tree.fragment!);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 100);
      }
    });
  }

  isLoggedIn(): boolean {
    return this.isUserLoggedIn;
  }

  get sidebarCollapsed(): boolean {
    return this.navbarComponent ? this.navbarComponent.getSidebarCollapsed() : false;
  }

  toggleHamburgerMenu = () => {
    this.hamburgerMenuOpen = !this.hamburgerMenuOpen;
  }

  closeHamburgerMenu = () => {
    this.hamburgerMenuOpen = false;
  }

  handleFabAction(action: string): void {
    switch (action) {
      case 'search':
        // Navigate to search or open search modal
        this.router.navigate(['/search']);
        break;
      case 'book':
        // Navigate to book appointment
        this.router.navigate(['/find-doctors']);
        break;
      case 'order':
        // Navigate to medicines
        this.router.navigate(['/medicines']);
        break;
      case 'hospital':
        // Navigate to hospitals
        this.router.navigate(['/hospitals']);
        break;
      case 'support':
        // Open support contact (could be a modal or navigate)
        window.location.href = 'tel:+911234567890';
        break;
      case 'emergency':
        this.router.navigate(['/emergency']);
        break;
    }
  }



  onLocationFromMap(location: UserLocation) {
    this.locationService.setLocation(location, true); // Map selection is persistent
    this.locationService.toggleMap(false);
  }

  ngOnDestroy(): void {
    this.routerSubscription?.unsubscribe();
    this.authSubscription?.unsubscribe();
    this.locationSheetSubscription?.unsubscribe();
    this.mapModalSubscription?.unsubscribe();
  }
}
