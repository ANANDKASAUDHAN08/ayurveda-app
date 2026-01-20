import { Component, EventEmitter, Input, Output, OnInit, OnDestroy, OnChanges, Renderer2 } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { AuthService } from '../../services/auth.service';
import { Subscription } from 'rxjs';
import { PwaInstallService } from '../../services/pwa-install.service';
import { CartService } from '../../services/cart.service';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { LogoutConfirmationService } from '../../services/logout-confirmation.service';
import { SnackbarService } from '../../services/snackbar.service';
interface MenuItem {
  title: string;
  icon: string;
  route?: string;
  divider?: boolean;
  action?: () => void;
}
@Component({
  selector: 'app-hamburger-menu',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './hamburger-menu.component.html',
  styleUrl: './hamburger-menu.component.css',
  animations: [
    trigger('slideIn', [
      state('void', style({ transform: 'translateX(-100%)' })),
      state('*', style({ transform: 'translateX(0)' })),
      transition('void => *', animate('300ms ease-out')),
      transition('* => void', animate('300ms ease-in'))
    ]),
    trigger('fadeIn', [
      state('void', style({ opacity: 0 })),
      state('*', style({ opacity: 1 })),
      transition('void => *', animate('300ms ease-out')),
      transition('* => void', animate('300ms ease-in'))
    ])
  ]
})
export class HamburgerMenuComponent implements OnInit, OnDestroy, OnChanges {
  @Input() isOpen: boolean = false;
  @Output() close = new EventEmitter<void>();

  menuItems: MenuItem[] = [];
  private authSubscription?: Subscription;

  showLoginDropdown = false;
  showInstallButton$ = this.pwaInstallService.showInstallButton$;

  constructor(
    public authService: AuthService,
    private router: Router,
    private renderer: Renderer2,
    private pwaInstallService: PwaInstallService,
    private logoutConfirmationService: LogoutConfirmationService,
    private snackbarService: SnackbarService
  ) { }

  ngOnInit() {
    // Subscribe to auth state changes
    this.authSubscription = this.authService.authStatus$.subscribe(() => {
      this.updateMenuItems();
    });
  }

  ngOnDestroy() {
    this.authSubscription?.unsubscribe();
    // Ensure body scroll is unlocked when component destroys
    this.renderer.removeClass(document.body, 'overflow-hidden');
  }

  updateMenuItems() {
    if (this.authService.isLoggedIn()) {
      // Logged in: Show user-specific menu (NO CART - it's in bottom nav)
      this.menuItems = [
        { title: 'Medicine', icon: 'fas fa-pills', route: '/medicines' },
        { title: 'Lab Tests', icon: 'fas fa-flask', route: '/lab-tests' },
        { title: 'Find Doctors', icon: 'fas fa-user-md', route: '/find-doctors' },
        { title: 'Health Plans', icon: 'fas fa-heartbeat', route: '/health-plans' },
        { title: 'Hospitals', icon: 'fas fa-hospital', route: '/hospitals' },
        { title: 'Nearby Care', icon: 'fas fa-location-dot', route: '/nearby-services' },
        { divider: true, title: '', icon: '' },
        { title: 'My Orders', icon: 'fas fa-shopping-bag', route: '/orders' },
        { title: 'My Profile', icon: 'fas fa-user', route: '/user/profile' },
        { title: 'Settings', icon: 'fas fa-cog', route: '/user/settings' },
        { divider: true, title: '', icon: '' },
        { title: 'About Us', icon: 'fas fa-info-circle', route: '/about-us' },
        { title: 'Help & Support', icon: 'fas fa-question-circle', route: '/help-support' },
      ];
    } else {
      // Not logged in: Show public menu
      this.menuItems = [
        { title: 'Medicine', icon: 'fas fa-pills', route: '/medicines' },
        { title: 'Lab Tests', icon: 'fas fa-flask', route: '/lab-tests' },
        { title: 'Find Doctors', icon: 'fas fa-user-md', route: '/find-doctors' },
        { title: 'Health Plans', icon: 'fas fa-heartbeat', route: '/health-plans' },
        { title: 'Hospitals', icon: 'fas fa-hospital', route: '/hospitals' },
        { title: 'Nearby Care', icon: 'fas fa-location-dot', route: '/nearby-services' },
        { divider: true, title: '', icon: '' },
        { title: 'About Us', icon: 'fas fa-info-circle', route: '/about-us' },
        { title: 'Contact', icon: 'fas fa-envelope', route: '/contact' },
        { title: 'Career', icon: 'fas fa-briefcase', route: '/career' },
        { title: 'Help & Support', icon: 'fas fa-question-circle', route: '/help-support' },
      ];
    }
  }

  toggleLoginDropdown() {
    this.showLoginDropdown = !this.showLoginDropdown;
  }
  navigateToLogin(type: 'user' | 'doctor') {
    const route = type === 'user' ? '/for-users' : '/for-doctors';
    this.router.navigate([route]);
    this.showLoginDropdown = false;
    this.closeMenu();
  }

  // Watch for isOpen changes to lock/unlock body scroll
  ngOnChanges() {
    if (this.isOpen) {
      this.renderer.addClass(document.body, 'overflow-hidden');
    } else {
      this.renderer.removeClass(document.body, 'overflow-hidden');
    }
  }

  closeMenu() {
    this.close.emit();
  }

  navigateAndClose(route: string) {
    this.router.navigate([route]);
    this.closeMenu();
  }

  logout() {
    this.logoutConfirmationService.requestLogout(() => {
      this.authService.logout();
      this.router.navigate(['/']);
      this.snackbarService.show('Logged out successfully', 'success');
    });
  }

  installApp() {
    this.pwaInstallService.installApp();
    this.closeMenu();
  }
}