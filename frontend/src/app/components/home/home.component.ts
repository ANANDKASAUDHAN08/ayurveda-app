import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { ContentService } from '../../shared/services/content.service';
import { SearchService } from '../../shared/services/search.service';
import { MedicineTypeService, MedicineType } from '../../shared/services/medicine-type.service';
import { SnackbarService } from '../../shared/services/snackbar.service';
import { MobileLocationBarComponent } from '../../shared/components/mobile-location-bar/mobile-location-bar.component';

import { ArticleDetailsComponent } from '../article-details/article-details.component';
import { TopRatedDoctorsCarouselComponent } from './top-rated-doctors-carousel/top-rated-doctors-carousel.component';
import { HealthArticlesCarouselComponent } from './health-articles-carousel/health-articles-carousel.component';
import { DoctorDetailModalComponent } from '../doctor-detail-modal/doctor-detail-modal.component';
import { HeroSectionComponent } from './hero-section/hero-section.component';
import { ServiceCardComponent, ServiceCardData } from 'src/app/shared/components/service-card/service-card.component';
import { CategoryCardComponent, CategoryCardData } from 'src/app/shared/components/category-card/category-card.component';
import { DealCardComponent, DealCardData } from 'src/app/shared/components/deal-card/deal-card.component';
import { TrustBadgeComponent, TrustBadgeData } from 'src/app/shared/components/trust-badge/trust-badge.component';
import { SkeletonLoaderComponent } from 'src/app/shared/components/skeleton-loader/skeleton-loader.component';
import { EmptyStateComponent } from 'src/app/shared/components/empty-state/empty-state.component';

interface Doctor {
  id: number;
  name: string;
  specialty: string;
  image: string;
  rating: number;
  experience: number;
  available: boolean;
  medicine_type?: string;
}

interface Article {
  id: number;
  title: string;
  excerpt: string;
  image: string;
  date: string;
  author?: string;
  readTime?: string;
}

interface Service {
  id: number;
  name: string;
  icon: string;
  description: string;
  color: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ArticleDetailsComponent,
    TopRatedDoctorsCarouselComponent,
    HealthArticlesCarouselComponent,
    DoctorDetailModalComponent,
    HeroSectionComponent,
    ServiceCardComponent,
    CategoryCardComponent,
    DealCardComponent,
    TrustBadgeComponent,
    SkeletonLoaderComponent,
    EmptyStateComponent,
    MobileLocationBarComponent
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit {
  userName = 'Guest';
  loadingDoctors = true;
  loadingArticles = true;
  loadingServices = true;
  showScrollTop = false;
  currentCardIndex = 0;

  onCardScroll(event: Event) {
    const element = event.target as HTMLElement;
    const scrollPosition = element.scrollLeft;
    const scrollWidth = element.scrollWidth - element.clientWidth;
    const scrollPercentage = scrollPosition / scrollWidth;

    // There are 3 cards, so 0, 1, 2 indices
    if (scrollPercentage <= 0.25) {
      this.currentCardIndex = 0;
    } else if (scrollPercentage > 0.25 && scrollPercentage <= 0.75) {
      this.currentCardIndex = 1;
    } else {
      this.currentCardIndex = 2;
    }
  }

  scrollToCard(index: number) {
    const container = document.querySelector('.flex.overflow-x-auto');
    if (container) {
      const cards = container.querySelectorAll('.medicine-card');
      if (cards[index]) {
        cards[index].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        this.currentCardIndex = index;
      }
    }
  }

  // Modal properties
  selectedDoctor: any = null;
  showDoctorModal = false;
  selectedArticle: any = null;
  showArticleModal = false;

  topDoctors: any[] = [];
  articles: any[] = [];

  // Search autocomplete
  searchQuery = '';
  showSuggestions = false;
  suggestions: any[] = [];
  searchHistory: string[] = [];
  popularSearches: string[] = [];
  private suggestionTimeout: any;

  // Typing animation
  typedText = '';
  private fullTexts = ['Perfect Health', 'Natural Healing', 'Modern Science', 'Expert Care'];
  private currentFullTextIndex = 0;
  private typingSpeed = 100;
  private erasingSpeed = 50;
  private pauseDuration = 2000;
  isTyping = true;

  constructor(
    private router: Router,
    private contentService: ContentService,
    private searchService: SearchService,
    private snackbar: SnackbarService,
    private medicineTypeService: MedicineTypeService,
  ) { }

  ngOnInit() {
    // Check for OAuth success flag (after page reload)
    const oauthLoginSuccess = sessionStorage.getItem('oauth_login_success');
    const isNewUser = sessionStorage.getItem('oauth_new_user');

    if (oauthLoginSuccess) {
      sessionStorage.removeItem('oauth_login_success');
      sessionStorage.removeItem('oauth_new_user');

      if (isNewUser === 'true') {
        this.snackbar.success('Registered successfully with Google!');
      } else {
        this.snackbar.success('Signed in with Google successfully!');
      }
    }

    // Handle OAuth callback if redirected from Google
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const oauthSuccess = urlParams.get('oauth');
    const newUser = urlParams.get('newUser');

    if (token && oauthSuccess === 'success') {
      // Store token in localStorage
      localStorage.setItem('token', token);

      // Decode JWT to get user data
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const user = {
          id: payload.id,
          email: payload.email,
          role: payload.role,
          name: payload.name || payload.email.split('@')[0]
        };
        localStorage.setItem('user', JSON.stringify(user));
      } catch (e) {
        console.error('Failed to decode token:', e);
      }

      // Set flags to show snackbar after reload
      sessionStorage.setItem('oauth_login_success', 'true');
      sessionStorage.setItem('oauth_new_user', newUser || 'false');

      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);

      // Reload to update UI state
      window.location.reload();
      return;
    }

    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        this.userName = user.name || 'Anand';
      } catch (e) {
        console.error('Failed to parse user data', e);
      }
    }

    this.loadFeaturedDoctors();
    this.loadHealthArticles();


    this.loadingServices = true;
    // Simulate API delay (remove in production)
    setTimeout(() => {
      this.loadingServices = false;
    }, 1000);

    // Load search data
    this.loadSearchData();

    // Start animations
    this.startTypingAnimation();
    this.initializeScrollAnimations();
  }

  ngAfterViewInit(): void {
    // Re-initialize scroll animations after view is ready to catch all elements
    setTimeout(() => this.initializeScrollAnimations(), 500);
  }

  private initializeScrollAnimations(): void {
    if (typeof window === 'undefined') return;

    const options = {
      root: null,
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          // Once animated, we usually don't need to observe it anymore
          // Unless we want it to animate every time it enters
        }
      });
    }, options);

    // Elements to observe
    const animatedElements = document.querySelectorAll('.animate-on-scroll, .stagger-item, .medicine-card, .quick-action-card, .search-container');
    animatedElements.forEach(el => observer.observe(el));
  }

  loadFeaturedDoctors() {
    this.loadingDoctors = true;
    this.contentService.getFeaturedDoctors().subscribe({
      next: (response) => {
        this.topDoctors = response.doctors || [];
        setTimeout(() => {
          this.loadingDoctors = false;
        }, 500);
      },
      error: (error) => {
        console.error('Error loading featured doctors:', error);
        setTimeout(() => {
          this.loadingDoctors = false;
        }, 500);
      }
    });
  }

  loadHealthArticles() {
    this.loadingArticles = true;
    this.contentService.getHealthArticles().subscribe({
      next: (response) => {
        this.articles = response.articles || [];

        // Add the specific requested article if not present
        const sleepArticle = {
          id: 1,
          title: "10 Tips for Better Sleep",
          excerpt: "Discover simple yet effective strategies to improve your sleep quality and wake up feeling refreshed.",
          image_url: "https://images.unsplash.com/photo-1541480601022-2308c0f02487?w=400",
          author: "Dr. Sarah Johnson",
          category: "Wellness",
          created_at: "2025-12-04T22:08:33.000Z"
        };

        // Check if exists, if not unshift
        if (!this.articles.find(a => a.id === 1)) {
          this.articles.unshift(sleepArticle);
        }

        setTimeout(() => {
          this.loadingArticles = false;
        }, 500);
      },
      error: (error) => {
        console.error('Error loading health articles:', error);
        setTimeout(() => {
          this.loadingArticles = false;
        }, 500);
      }
    });
  }

  // Modal Methods
  openDoctorDetails(doctor: any) {
    this.selectedDoctor = doctor;
    this.showDoctorModal = true;
  }

  closeDoctorModal() {
    this.showDoctorModal = false;
    this.selectedDoctor = null;
  }

  openArticle(article: any) {
    this.selectedArticle = article;
    this.showArticleModal = true;
  }

  closeArticle() {
    this.selectedArticle = null;
    this.showArticleModal = false;
  }

  trackByServiceId(index: number, service: any): number {
    return service.id || index;
  }

  handleSearch(searchData: { searchTerm: string; location: string; activeTab: string }) {
    const queryParams: any = {};

    if (searchData.activeTab === 'hospitals') {
      queryParams.type = 'hospital';
    } else if (searchData.activeTab === 'pharmacies') {
      queryParams.type = 'pharmacy';
    }

    if (searchData.searchTerm) {
      queryParams.search = searchData.searchTerm;
    }

    if (searchData.location) {
      queryParams.location = searchData.location;
    }

    this.router.navigate(['/user/find-doctors'], { queryParams });
  }

  search() {
    this.router.navigate(['/user/find-doctors']);
  }

  navigateToService(service: any) {
    if (service.link) {
      this.router.navigate([service.link], { queryParams: service.queryParams });
    } else if (service.fragment) {
      this.scrollToSection(service.fragment);
    }
  }

  scrollToSection(sectionId: string) {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.showScrollTop = window.pageYOffset > 300;
  }

  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }



  // --------------------------------------------------------

  /// Service Cards Data
  services: ServiceCardData[] = [
    {
      icon: 'fas fa-pills',
      title: 'Order Medicine',
      description: 'Get medicines delivered to your doorstep',
      badge: '15% OFF',
      route: '/medicines',
      gradient: 'from-blue-500 to-blue-600'
    },
    {
      icon: 'fas fa-flask',
      title: 'Book Lab Test',
      description: 'Home sample collection available',
      badge: '20% OFF',
      route: '/lab-tests',
      gradient: 'from-purple-500 to-purple-600'
    },
    {
      icon: 'fas fa-user-md',
      title: 'Consult Doctor',
      description: 'Video consultation with top doctors',
      badge: '₹200 Only',
      route: '/find-doctors',
      gradient: 'from-emerald-500 to-emerald-600'
    },
    {
      icon: 'fas fa-syringe',
      title: 'Book Vaccine',
      description: 'Get vaccinated at home or clinic',
      badge: '100% Safe',
      route: '/vaccine',
      gradient: 'from-pink-500 to-pink-600'
    }
  ];

  // Category Cards Data  
  categories: CategoryCardData[] = [
    { icon: 'fas fa-pills', title: 'Medicines', count: 5000, route: '/category/medicines', color: 'bg-blue-100', iconColor: 'text-blue-600' },
    { icon: 'fas fa-stethoscope', title: 'Devices', count: 200, route: '/category/devices', color: 'bg-purple-100', iconColor: 'text-purple-600' },
    { icon: 'fas fa-baby', title: 'Baby Care', count: 800, badge: 'New', route: '/category/baby-care', color: 'bg-pink-100', iconColor: 'text-pink-600' },
    { icon: 'fas fa-spa', title: 'Skin Care', count: 600, badge: 'Sale', route: '/category/skin-care', color: 'bg-yellow-100', iconColor: 'text-yellow-600' },
    { icon: 'fas fa-running', title: 'Fitness', count: 400, route: '/category/fitness', color: 'bg-green-100', iconColor: 'text-green-600' },
    { icon: 'fas fa-tooth', title: 'Oral Care', count: 300, route: '/category/oral-care', color: 'bg-cyan-100', iconColor: 'text-cyan-600' },
    { icon: 'fas fa-spa', title: 'Ayurveda', count: 500, badge: 'Hot', route: '/category/ayurveda', color: 'bg-orange-100', iconColor: 'text-orange-600' },
    { icon: 'fas fa-eye', title: 'Eye Care', count: 150, route: '/category/eye-care', color: 'bg-indigo-100', iconColor: 'text-indigo-600' },
    { icon: 'fas fa-apple-alt', title: 'Nutrition', count: 700, route: '/category/nutrition', color: 'bg-red-100', iconColor: 'text-red-600' },
    { icon: 'fas fa-first-aid', title: 'First Aid', count: 250, route: '/category/first-aid', color: 'bg-teal-100', iconColor: 'text-teal-600' },
    { icon: 'fas fa-hospital', title: 'Hospital', count: 100, route: '/hospitals', color: 'bg-gray-100', iconColor: 'text-gray-600' },
    { icon: 'fas fa-plus-circle', title: 'More', route: '/categories', color: 'bg-slate-100', iconColor: 'text-slate-600' }
  ];

  // Deals Data
  deals: DealCardData[] = [
    {
      productId: 1,  // Real product ID
      productType: 'medicine',
      image: 'https://via.placeholder.com/400x300/3B82F6/FFFFFF?text=Vitamin+C',
      title: 'Vitamin C Tablets',
      description: '60 tablets pack',
      price: 699,
      mrp: 999,
      discount: 30,
      badge: 'Hot Deal',
      route: '/product/vitamin-c',
      expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000) // 8 hours from now
    },
    {
      productId: 2,
      productType: 'medicine',
      image: 'https://via.placeholder.com/400x300/10B981/FFFFFF?text=Face+Wash',
      title: 'Gentle Face Wash',
      description: 'For all skin types, 150ml',
      price: 149,
      mrp: 199,
      discount: 25,
      route: '/product/face-wash',
      expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000) // 12 hours from now
    },
    {
      productId: 3,
      productType: 'medicine',
      image: 'https://via.placeholder.com/400x300/8B5CF6/FFFFFF?text=Shampoo',
      title: 'Anti-Dandruff Shampoo',
      description: '200ml, Buy 2 Get 1 Free',
      price: 299,
      mrp: 450,
      discount: 34,
      badge: 'Limited',
      route: '/product/shampoo',
      expiresAt: new Date(Date.now() + 6 * 60 * 60 * 1000) // 6 hours from now
    },
    {
      productId: 4,
      productType: 'device',  // This one is a device
      image: 'https://via.placeholder.com/400x300/F59E0B/FFFFFF?text=Protein+Powder',
      title: 'Whey Protein 1kg',
      description: 'Chocolate flavor',
      price: 1499,
      mrp: 2499,
      discount: 40,
      route: '/product/protein',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now
    }
  ];

  // Trust Badges Data
  trustBadges: TrustBadgeData[] = [
    { icon: 'fas fa-user-md', number: '5000+', label: 'Verified Doctors', subtext: 'Across specialties', color: 'text-emerald-600' },
    { icon: 'fas fa-shield-alt', number: '100%', label: 'Genuine Products', subtext: 'Quality assured', color: 'text-blue-600' },
    { icon: 'fas fa-headset', number: '24/7', label: 'Customer Support', subtext: 'Always available', color: 'text-purple-600' },
    { icon: 'fas fa-star', number: '4.8⭐', label: 'User Rating', subtext: '10k+ happy users', color: 'text-yellow-600' }
  ];

  // Navigate to Search Results
  onSearch() {
    if (this.searchQuery.trim()) {
      this.router.navigate(['/search'], { queryParams: { q: this.searchQuery } });
    }
  }

  // Load search data
  loadSearchData() {
    this.searchHistory = this.searchService.getSearchHistory();

    this.searchService.getPopularSearches().subscribe({
      next: (response) => {
        if (response.success) {
          this.popularSearches = response.data;
        }
      },
      error: (err) => console.error('Failed to load popular searches:', err)
    });
  }

  // Handle search input with autocomplete
  onSearchInput() {
    if (this.suggestionTimeout) {
      clearTimeout(this.suggestionTimeout);
    }

    if (this.searchQuery.length < 2) {
      this.suggestions = [];
      this.showSuggestions = false;
      return;
    }

    this.suggestionTimeout = setTimeout(() => {
      this.searchService.getSuggestions(this.searchQuery).subscribe({
        next: (response) => {
          if (response.success) {
            this.suggestions = response.data;
            this.showSuggestions = true;
          }
        },
        error: (err) => {
          console.error('Suggestions error:', err);
          this.suggestions = [];
        }
      });
    }, 300);
  }

  onFocusSearch() {
    this.searchHistory = this.searchService.getSearchHistory();
    if (this.searchQuery.length === 0) {
      this.showSuggestions = true;
    } else if (this.searchQuery.length >= 2) {
      this.onSearchInput();
    }
  }

  onBlurSearch() {
    setTimeout(() => {
      this.showSuggestions = false;
    }, 200);
  }

  selectSuggestion(suggestion: any) {
    this.searchQuery = suggestion.name;
    this.showSuggestions = false;
    this.onSearch();
  }

  searchFromHistory(term: string) {
    this.searchQuery = term;
    this.showSuggestions = false;
    this.onSearch();
  }

  searchPopular(term: string) {
    this.searchQuery = term;
    this.showSuggestions = false;
    this.onSearch();
  }

  clearHistory() {
    this.searchService.clearSearchHistory();
    this.searchHistory = [];
  }

  selectSystem(type: MedicineType | 'all') {
    this.medicineTypeService.setMedicineType(type);
    if (type === 'all') {
      this.router.navigate(['/user/dashboard']);
    } else {
      this.router.navigate([`/${type}`]);
    }
  }

  navigateTo(path: string) {
    this.router.navigate([path]);
  }

  // Typing animation
  startTypingAnimation() {
    this.typeNextChar();
  }

  private typeNextChar() {
    const currentFullText = this.fullTexts[this.currentFullTextIndex];
    if (this.typedText.length < currentFullText.length && this.isTyping) {
      this.typedText += currentFullText[this.typedText.length];
      setTimeout(() => this.typeNextChar(), this.typingSpeed);
    } else if (this.isTyping) {
      // Pause at end before erasing
      setTimeout(() => {
        this.isTyping = false;
        this.eraseText();
      }, this.pauseDuration);
    }
  }

  eraseText() {
    if (this.typedText.length > 0 && !this.isTyping) {
      this.typedText = this.typedText.slice(0, -1);
      setTimeout(() => this.eraseText(), this.erasingSpeed);
    } else if (!this.isTyping) {
      // Move to next text and restart typing
      this.isTyping = true;
      this.currentFullTextIndex = (this.currentFullTextIndex + 1) % this.fullTexts.length;
      setTimeout(() => this.typeNextChar(), 500);
    }
  }

}
