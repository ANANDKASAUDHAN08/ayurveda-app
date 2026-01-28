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
import { ChatbotComponent } from './shared/components/chatbot/chatbot.component';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { UpdateNotificationComponent } from './shared/components/update-notification/update-notification.component';
import { LocationPermissionDialogComponent } from './shared/components/location-permission-dialog/location-permission-dialog.component';
import { LogoutConfirmationComponent } from './shared/components/logout-confirmation/logout-confirmation.component';
import { LogoutConfirmationService } from './shared/services/logout-confirmation.service';
import { NotificationService } from './shared/services/notification.service';
import { ShareModalComponent } from './shared/components/share/share-modal/share-modal.component';

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
    LocationMapModalComponent,
    ChatbotComponent,
    UpdateNotificationComponent,
    LocationPermissionDialogComponent,
    LogoutConfirmationComponent,
    ShareModalComponent
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy, AfterViewInit {
  title = 'ayurveda-app';
  @ViewChild(NavbarComponent) navbarComponent!: NavbarComponent;

  hamburgerMenuOpen = false;
  isAdminRoute = false;
  isVideoCallRoute = false;
  isUserLoggedIn = false;
  isLocationSheetOpen = false;
  showMapModal = false;
  mapsLoaded$ = this.googleMapsLoader.isLoaded$;
  showUpdateNotification = false;
  showLocationPermissionDialog = false;
  showLogoutConfirmation = false;

  // Subscriptions for cleanup
  private routerSubscription?: Subscription;
  private authSubscription?: Subscription;
  private locationSheetSubscription?: Subscription;
  private mapModalSubscription?: Subscription;
  private permissionDialogSubscription?: Subscription;
  private logoutConfirmationSubscription?: Subscription;

  constructor(
    private router: Router,
    private authService: AuthService,
    public locationService: LocationService,
    private googleMapsLoader: GoogleMapsLoaderService,
    private swUpdate: SwUpdate,
    private logoutConfirmationService: LogoutConfirmationService,
    private notificationService: NotificationService
  ) { }

  ngOnInit(): void {
    this.routerSubscription = this.router.events.subscribe(() => {
      this.isAdminRoute = this.router.url.startsWith('/admin');
      this.isVideoCallRoute = this.router.url.includes('/video-call');
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

    // Handle Location Permission Dialog
    this.permissionDialogSubscription = this.locationService.showPermissionDialog$.subscribe(show => {
      this.showLocationPermissionDialog = show;
    });

    // Handle Logout Confirmation Dialog
    this.logoutConfirmationSubscription = this.logoutConfirmationService.showDialog$.subscribe(show => {
      this.showLogoutConfirmation = show;
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


    // Check for PWA updates
    if (this.swUpdate.isEnabled) {
      // Check for updates when the app initializes
      this.swUpdate.versionUpdates.pipe(
        filter((evt): evt is VersionReadyEvent => evt.type === 'VERSION_READY')
      ).subscribe(() => {
        // New version available - show visual notification
        this.showUpdateNotification = true;

        // Also add to notification center
        this.notificationService.addLocalNotification({
          type: 'critical_update',
          title: 'App Update Available',
          message: 'A new version of the app is ready. Click to update now.',
          action_url: '@action:update'
        });
      });

      // Check for updates every 5 minutes
      setInterval(() => {
        this.swUpdate.checkForUpdate().then(() => {
          console.log('Checked for updates');
        }).catch(err => {
          console.error('Error checking for updates:', err);
        });
      }, 5 * 60 * 1000); // 5 minutes
    }

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

  onUpdateApp() {
    // User clicked "Update Now" - reload the page to get the latest version
    window.location.reload();
  }

  onDismissUpdate() {
    // User clicked "Later" - hide the notification
    this.showUpdateNotification = false;
  }

  onLogoutConfirm() {
    this.logoutConfirmationService.confirmLogout();
  }

  onLogoutCancel() {
    this.logoutConfirmationService.cancelLogout();
  }

  ngOnDestroy(): void {
    this.routerSubscription?.unsubscribe();
    this.authSubscription?.unsubscribe();
    this.locationSheetSubscription?.unsubscribe();
    this.mapModalSubscription?.unsubscribe();
    this.permissionDialogSubscription?.unsubscribe();
    this.logoutConfirmationSubscription?.unsubscribe();
  }
}
