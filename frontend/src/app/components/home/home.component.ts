import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

import { ContentService } from '../../services/content.service';

import { ArticleDetailsComponent } from '../article-details/article-details.component';
import { TopRatedDoctorsCarouselComponent } from './top-rated-doctors-carousel/top-rated-doctors-carousel.component';
import { HealthArticlesCarouselComponent } from './health-articles-carousel/health-articles-carousel.component';
import { DoctorDetailModalComponent } from '../doctor-detail-modal/doctor-detail-modal.component';
import { HeroSectionComponent } from './hero-section/hero-section.component';
import { ServiceCardComponent, ServiceCardData } from 'src/app/shared/components/service-card/service-card.component';
import { CategoryCardComponent, CategoryCardData } from 'src/app/shared/components/category-card/category-card.component';
import { DealCardComponent, DealCardData } from 'src/app/shared/components/deal-card/deal-card.component';
import { TrustBadgeComponent, TrustBadgeData } from 'src/app/shared/components/trust-badge/trust-badge.component';
import { FormsModule } from '@angular/forms';
import { SkeletonLoaderComponent } from 'src/app/shared/components/skeleton-loader/skeleton-loader.component';
import { EmptyStateComponent } from 'src/app/shared/components/empty-state/empty-state.component';

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
    EmptyStateComponent
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit {
  loadingDoctors = true;
  loadingArticles = true;
  loadingServices = true;
  showScrollTop = false;

  // Modal properties
  selectedDoctor: any = null;
  showDoctorModal = false;

  selectedArticle: any = null;
  showArticleModal = false;

  // services = [
  //   { icon: 'fas fa-user-md', title: 'Find Doctors', description: 'Connect with top specialists', link: '/user/find-doctors', queryParams: {} },
  //   { icon: 'fas fa-hospital', title: 'Hospitals', description: 'Locate nearby hospitals', link: '/hospitals', queryParams: {} },
  //   { icon: 'fas fa-pills', title: 'Pharmacies', description: 'Get medicines delivered', link: '/pharmacies', queryParams: {} },
  //   { icon: 'fas fa-file-medical-alt', title: 'Health Articles', description: 'Read expert health tips', fragment: 'articles' },
  //   { icon: 'fas fa-question-circle', title: 'Ask Questions', description: 'Get answers from experts', fragment: 'contact' },
  //   { icon: 'fas fa-ambulance', title: 'Emergency', description: '24/7 emergency services', link: '/user/find-doctors', queryParams: { type: 'emergency' } },
  //   { icon: 'fas fa-heartbeat', title: 'Health Checkups', description: 'Book preventive checkups', link: '/user/find-doctors', queryParams: { type: 'checkup' } },
  //   { icon: 'fas fa-brain', title: 'Mental Health', description: 'Therapists and counselors', link: '/user/find-doctors', queryParams: { specialty: 'psychiatrist' } }
  // ];

  topDoctors: any[] = [];
  articles: any[] = [];

  constructor(
    private router: Router,
    private contentService: ContentService,
    private route: ActivatedRoute
  ) { }

  ngOnInit() {
    this.loadFeaturedDoctors();
    this.loadHealthArticles();


    this.loadingServices = true;
    // Simulate API delay (remove in production)
    setTimeout(() => {
      this.loadingServices = false;
    }, 1000);
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
      route: '/medicine',
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
      route: '/consult',
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
      route: '/product/vitamin-c'
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
      route: '/product/face-wash'
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
      route: '/product/shampoo'
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
      route: '/product/protein'
    }
  ];
  // Trust Badges Data
  trustBadges: TrustBadgeData[] = [
    { icon: 'fas fa-user-md', number: '5000+', label: 'Verified Doctors', subtext: 'Across specialties', color: 'text-emerald-600' },
    { icon: 'fas fa-shield-alt', number: '100%', label: 'Genuine Products', subtext: 'Quality assured', color: 'text-blue-600' },
    { icon: 'fas fa-headset', number: '24/7', label: 'Customer Support', subtext: 'Always available', color: 'text-purple-600' },
    { icon: 'fas fa-star', number: '4.8⭐', label: 'User Rating', subtext: '10k+ happy users', color: 'text-yellow-600' }
  ];
  searchQuery: string = '';
  // Search method
  onSearch() {
    if (this.searchQuery.trim()) {
      this.router.navigate(['/search'], { queryParams: { q: this.searchQuery } });
    }
  }
}
