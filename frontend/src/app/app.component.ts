import { Component, ViewChild, AfterViewInit, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { NavbarComponent } from './shared/components/navbar/navbar.component';
import { TopNavbarComponent } from './shared/components/top-navbar/top-navbar.component';
import { FooterComponent } from './shared/components/footer/footer.component';
import { SnackbarComponent } from './shared/components/snackbar/snackbar.component';
import { filter, Subscription } from 'rxjs';
import { AuthService } from './services/auth.service';
import { HamburgerMenuComponent } from './shared/components/hamburger-menu/hamburger-menu.component';
import { BottomNavigationComponent } from './shared/components/bottom-navigation/bottom-navigation.component';
import { ScrollToTopComponent } from './shared/components/scroll-to-top/scroll-to-top.component';

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
    ScrollToTopComponent
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

  // Subscriptions for cleanup
  private routerSubscription?: Subscription;
  private authSubscription?: Subscription;

  constructor(
    private router: Router,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.routerSubscription = this.router.events.subscribe(() => {
      this.isAdminRoute = this.router.url.startsWith('/admin');
    });


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

  ngOnDestroy(): void {
    this.routerSubscription?.unsubscribe();
    this.authSubscription?.unsubscribe();
  }
}
