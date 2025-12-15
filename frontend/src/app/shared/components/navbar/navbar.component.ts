import { Component, OnInit, Output, EventEmitter, HostListener, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { filter } from 'rxjs/operators';
import { ContentService } from 'src/app/services/content.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit, OnDestroy {
  @Output() logoutRequested = new EventEmitter<void>();
  @ViewChild('sidebarElement') sidebarElement!: ElementRef;

  sidebarExpanded = true;
  isHome = false;
  activeScrollSection = '';
  homeDropdownOpen = true;
  newArticlesCount = 0;
  private articlesSubscription?: any;

  constructor(
    public authService: AuthService,
    public router: Router,
    public contentService: ContentService
  ) { }

  ngOnInit() {
    // Load saved sidebar state
    const savedState = localStorage.getItem('sidebarExpanded');
    if (savedState !== null) {
      this.sidebarExpanded = savedState === 'true';
    }

    // Check if on home page
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.isHome = this.router.url === '/' || this.router.url.startsWith('/home');
    });

    this.isHome = this.router.url === '/' || this.router.url.startsWith('/home');

    this.contentService.getHealthArticles().subscribe(response => {
      this.newArticlesCount = response.articles?.filter((a: { isNew: any; }) => a.isNew).length || 0;
    });
    // TO:
    this.articlesSubscription = this.contentService.getHealthArticles().subscribe({
      next: (response) => {
        this.newArticlesCount = response.articles?.filter((a: any) => a.isNew).length || 0;
      },
      error: (err) => {
        console.error('Error fetching articles:', err);
        this.newArticlesCount = 0;
      }
    });
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!this.sidebarElement) return;

    const target = event.target as HTMLElement;
    const sidebar = this.sidebarElement.nativeElement;

    // Check if click is outside sidebar
    const clickedOutside = !sidebar.contains(target);

    // Auto-collapse on mobile/tablet when clicking outside
    if (this.sidebarExpanded && clickedOutside) {
      this.sidebarExpanded = false;
      localStorage.setItem('sidebarExpanded', 'false');
    }

    // Also close dropdown when clicking outside
    if (this.homeDropdownOpen && clickedOutside) {
      this.homeDropdownOpen = false;
    }
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.checkActiveSection();
  }

  checkActiveSection() {
    if (!this.isHome) {
      this.activeScrollSection = '';
      return;
    }

    const sections = ['topDoctors', 'articles', 'services', 'testimonials'];
    const scrollPosition = window.scrollY + 100; // Offset for header

    for (const sectionId of sections) {
      const element = document.getElementById(sectionId);
      if (element) {
        const elementTop = element.offsetTop;
        const elementBottom = elementTop + element.offsetHeight;

        if (scrollPosition >= elementTop && scrollPosition < elementBottom) {
          this.activeScrollSection = sectionId;
          return;
        }
      }
    }
  }

  // Add debouncing:
  private scrollTimeout: any;
  @HostListener('window:scroll', [])
  onWindowScrollDebounced() {
    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout);
    }
    this.scrollTimeout = setTimeout(() => {
      this.checkActiveSection();
    }, 100);
  }

  toggleSidebar() {
    this.sidebarExpanded = !this.sidebarExpanded;
    localStorage.setItem('sidebarExpanded', this.sidebarExpanded.toString());
  }

  getSidebarCollapsed(): boolean {
    return !this.sidebarExpanded;
  }

  scrollToSection(sectionId: string) {
    this.activeScrollSection = sectionId;

    if (!this.isHome) {
      // Navigate to home with fragment
      this.router.navigate(['/'], { fragment: sectionId });
    } else {
      // Already on home, scroll with offset for top navbar
      const element = document.getElementById(sectionId);
      if (element) {
        const navbarHeight = 64; // Top navbar height (h-16 = 64px)
        const elementPosition = element.getBoundingClientRect().top + window.scrollY;
        const offsetPosition = elementPosition - navbarHeight;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    }
  }

  isScrollSectionActive(sectionId: string): boolean {
    return this.activeScrollSection === sectionId;
  }

  isAdminRoute(): boolean {
    return this.router.url.startsWith('/admin');
  }

  isLoggedIn() {
    return this.authService.isLoggedIn();
  }

  getRole() {
    return this.authService.getRole();
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/']);
    this.logoutRequested.emit();
  }

  shouldShowFindDoctors(): boolean {
    if (this.isLoggedIn()) {
      return this.getRole() === 'user';
    }
    return true;
  }

  ngOnDestroy() {
    if (this.articlesSubscription) {
      this.articlesSubscription.unsubscribe();
    }
  }

}
