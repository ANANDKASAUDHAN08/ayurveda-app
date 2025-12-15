import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
interface NavItem {
  icon: string;
  label: string;
  route: string;
  badge?: number;
}
@Component({
  selector: 'app-bottom-navigation',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './bottom-navigation.component.html',
  styleUrl: './bottom-navigation.component.css'
})
export class BottomNavigationComponent {
  activeRoute: string = '';

  navItems: NavItem[] = [
    { icon: 'fas fa-home', label: 'Home', route: '/' },
    { icon: 'fas fa-flask', label: 'Tests', route: '/lab-tests' },
    { icon: 'fas fa-shopping-cart', label: 'Cart', route: '/cart', badge: 0 },
    { icon: 'fas fa-user', label: 'Profile', route: '/profile' }
  ];
  constructor(private router: Router) {
    this.updateActiveRoute();

    router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.updateActiveRoute();
    });
  }
  updateActiveRoute() {
    this.activeRoute = this.router.url;
  }
  isActive(route: string): boolean {
    if (route === '/') {
      return this.activeRoute === '/';
    }
    return this.activeRoute.startsWith(route);
  }
}