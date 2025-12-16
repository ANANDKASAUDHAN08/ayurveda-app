import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { AuthService } from '../../services/auth.service';
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
export class HamburgerMenuComponent {
  @Input() isOpen: boolean = false;
  @Output() close = new EventEmitter<void>();
  menuItems: MenuItem[] = [
    { title: 'Medicine', icon: 'fas fa-pills', route: '/medicine' },
    { title: 'Lab Tests', icon: 'fas fa-flask', route: '/lab-tests' },
    { title: 'Consult Doctor', icon: 'fas fa-user-md', route: '/consult' },
    { title: 'Health Plans', icon: 'fas fa-heartbeat', route: '/health-plans' },
    {
      divider: true,
      title: '',
      icon: ''
    },
    { title: 'My Orders', icon: 'fas fa-shopping-bag', route: '/orders' },
    { title: 'My Profile', icon: 'fas fa-user', route: '/profile' },
    { title: 'Saved Items', icon: 'fas fa-bookmark', route: '/saved' },
    {
      divider: true,
      title: '',
      icon: ''
    },
    { title: 'Offers', icon: 'fas fa-gift', route: '/offers' },
    { title: 'Help & Support', icon: 'fas fa-question-circle', route: '/help' },
    { title: 'Settings', icon: 'fas fa-cog', route: '/settings' },
  ];
  constructor(
    public authService: AuthService,
    private router: Router
  ) { }
  closeMenu() {
    this.close.emit();
  }
  navigateAndClose(route: string) {
    this.router.navigate([route]);
    this.closeMenu();
  }
  logout() {
    this.authService.logout();
    this.closeMenu();
    this.router.navigate(['/']);
  }
}