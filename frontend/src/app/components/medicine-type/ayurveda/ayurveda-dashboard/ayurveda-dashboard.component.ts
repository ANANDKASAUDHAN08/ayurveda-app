import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MedicineTypeService } from '../../../../shared/services/medicine-type.service';
import { DoctorService } from '../../../../shared/services/doctor.service';
import { AyurvedaService, Medicine, Exercise, Article, DashboardStats, Herb } from '../../../../shared/services/ayurveda.service';
import { CartService } from '../../../../shared/services/cart.service';
import { SnackbarService } from '../../../../shared/services/snackbar.service';
import { AyurvedaWellnessComponent } from '../ayurveda-wellness/ayurveda-wellness.component';
import { YogaComponent } from '../yoga/yoga.component';
import { AyurvedaArticleComponent } from '../ayurveda-article/ayurveda-article.component';
import { AyurvedaSearchComponent } from '../ayurveda-search/ayurveda-search.component';
import { AyurvedaAboutComponent } from '../ayurveda-about/ayurveda-about.component';
import { AyurvedaQuickSearchComponent } from '../ayurveda-quick-search/ayurveda-quick-search.component';
import { HerbLibraryComponent } from '../herb-library/herb-library.component';
import { HerbDetailComponent } from '../herb-detail/herb-detail.component';
import { PrakritiService, PrakritiResult } from '../../../../shared/services/prakriti.service';

@Component({
  selector: 'app-ayurveda-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    AyurvedaWellnessComponent,
    YogaComponent,
    AyurvedaArticleComponent,
    AyurvedaSearchComponent,
    AyurvedaAboutComponent,
    AyurvedaQuickSearchComponent,
    HerbLibraryComponent,
    HerbDetailComponent
  ],
  templateUrl: './ayurveda-dashboard.component.html',
  styleUrl: './ayurveda-dashboard.component.css'
})
export class AyurvedaDashboardComponent implements OnInit {
  // Data properties
  doctors: any[] = [];
  medicines: Medicine[] = [];
  exercises: Exercise[] = [];
  articles: Article[] = [];
  stats: DashboardStats = {
    doctors: 0,
    medicines: 0,
    exercises: 0,
    articles: 0
  };

  loading = true;
  medicinesLoading = true;
  exercisesLoading = true;
  articlesLoading = true;

  // Tab switching (NO URL change) - Hero stays, content changes
  activeTab: 'home' | 'ayurveda-wellness' | 'yoga' | 'ayurveda-article' | 'about' | 'search' | 'herb-library' = 'home';
  searchQuery: string = '';
  showQuickSearch = false;
  // Interactive sidebar and modal state
  showDoshaQuiz = false;
  showAyurvedaInfo = false;
  selectedHerbForModal: Herb | null = null;
  showYogaInfo = false;
  dailyTip = '';
  currentSeason = '';
  seasonalTip = '';

  showQuickBalance = false;
  // Using your current time for a dynamic nav indicator
  currentDoshaPhase = { name: 'Pitta', icon: '🔥', activity: 'Active Agni', color: 'text-orange-600' };
  selectedFeeling: string | null = null;
  activeRemedy: string = '';
  suggestedHerb: Herb | null = null;

  doshaAssessment = {
    vata: 70,
    pitta: 15,
    kapha: 15
  };

  private tips = [
    "Sip warm water with ginger to boost digestion.",
    "Practice mindfulness while eating; avoid screens.",
    "Include all 6 tastes in your main meal for balance.",
    "Use a tongue scraper daily to remove morning toxins.",
    "Perform a self-massage with warm oil (Abhyanga).",
    "Go to bed before 10 PM to honor natural rhythms.",
    "Favor seasonal and local produce for optimal vitality."
  ];

  constructor(
    private medicineTypeService: MedicineTypeService,
    private doctorService: DoctorService,
    private ayurvedaService: AyurvedaService,
    private cartService: CartService,
    private snackbarService: SnackbarService,
    private prakritiService: PrakritiService,
    private router: Router
  ) { }

  ngOnInit(): void {
    // Set medicine type to Ayurveda
    this.medicineTypeService.setMedicineType('ayurveda');

    // Load all dashboard data
    this.loadDashboardData();
    this.initializeDynamicFeatures();

    // Subscribe to Prakriti results
    this.prakritiService.result$.subscribe(result => {
      if (result) {
        this.doshaAssessment = {
          vata: result.breakdown.vata,
          pitta: result.breakdown.pitta,
          kapha: result.breakdown.kapha
        };
      }
    });
  }

  initializeDynamicFeatures(): void {
    // ... your existing tip logic ...
    const hour = new Date().getHours();

    // Dynamic Phase Calculation for the Nav Bar
    if (hour >= 2 && hour < 6) this.currentDoshaPhase = { name: 'Vata', icon: '💨', activity: 'Movement', color: 'text-blue-600' };
    else if (hour >= 6 && hour < 10) this.currentDoshaPhase = { name: 'Kapha', icon: '🌊', activity: 'Structure', color: 'text-emerald-600' };
    else if (hour >= 10 && hour < 14) this.currentDoshaPhase = { name: 'Pitta', icon: '🔥', activity: 'Active Agni', color: 'text-orange-600' };
    else if (hour >= 14 && hour < 18) this.currentDoshaPhase = { name: 'Vata', icon: '💨', activity: 'Movement', color: 'text-blue-600' };
    else if (hour >= 18 && hour < 22) this.currentDoshaPhase = { name: 'Kapha', icon: '🌊', activity: 'Structure', color: 'text-emerald-600' };
    else this.currentDoshaPhase = { name: 'Pitta', icon: '🔥', activity: 'Active Agni', color: 'text-orange-600' };
  }

  // This method picks the most relevant tip from your 'tips' array based on a feeling
  getQuickFix(feeling: string): void {
    this.selectedFeeling = feeling;
    this.suggestedHerb = null;

    let targetDosha = '';
    if (feeling === 'Heavy') {
      this.activeRemedy = "Warm ginger tea and light movement will stimulate your Agni.";
      targetDosha = 'Kapha';
    } else if (feeling === 'Distracted') {
      this.activeRemedy = "Ground yourself with deep breathing and warm, nourishing foods.";
      targetDosha = 'Vata';
    } else if (feeling === 'Anxious') {
      this.activeRemedy = "Perform a self-massage with warm oil to calm your nervous system.";
      targetDosha = 'Vata';
    } else if (feeling === 'Tired') {
      this.activeRemedy = "Rejuvenate with restorative rest and adaptogenic support.";
      targetDosha = 'Pitta'; // Or generic rejuvenation
    }

    // Fetch a random herb that pacifies this dosha
    this.ayurvedaService.getHerbs({ pacify: targetDosha }).subscribe(herbs => {
      if (herbs.length > 0) {
        // Pick a random herb from the results
        const randomIndex = Math.floor(Math.random() * herbs.length);
        this.suggestedHerb = herbs[randomIndex];
      }
    });
  }

  loadDashboardData(): void {
    // Load doctors
    this.loadAyurvedaDoctors();

    // Load stats
    this.ayurvedaService.getStats().subscribe({
      next: (stats) => {
        this.stats = stats;
      },
      error: (err) => console.error('Failed to load stats:', err)
    });

    // Load medicines
    this.ayurvedaService.getMedicines(4, true).subscribe({
      next: (medicines) => {
        this.medicines = medicines;
        this.medicinesLoading = false;
      },
      error: (err) => {
        console.error('Failed to load medicines:', err);
        this.medicinesLoading = false;
      }
    });

    // Load exercises
    this.ayurvedaService.getExercises(3).subscribe({
      next: (exercises) => {
        this.exercises = exercises;
        this.exercisesLoading = false;
      },
      error: (err) => {
        console.error('Failed to load exercises:', err);
        this.exercisesLoading = false;
      }
    });

    // Load articles
    this.ayurvedaService.getArticles(2).subscribe({
      next: (articles) => {
        this.articles = articles;
        this.articlesLoading = false;
      },
      error: (err) => {
        console.error('Failed to load articles:', err);
        this.articlesLoading = false;
      }
    });
  }

  loadAyurvedaDoctors(): void {
    this.doctorService.getDoctors({ medicine_type: 'ayurveda' }).subscribe({
      next: (doctors) => {
        this.doctors = doctors;
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load doctors:', err);
        this.loading = false;
      }
    });
  }

  // Tab switching method - Hero stays, only content changes
  switchTab(tab: 'home' | 'ayurveda-wellness' | 'yoga' | 'ayurveda-article' | 'about' | 'search' | 'herb-library'): void {
    this.activeTab = tab;

    // Optional: Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }

    // Scroll to the absolute top of the page immediately
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Also ensure we scroll to content if appropriate, but top is priority for "new page" feel
    setTimeout(() => {
      const contentSection = document.getElementById('tab-content');
      if (contentSection && tab !== 'home') {
        // Only scroll to content if not going to home
        contentSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  }

  onHerbSelected(herb: Herb): void {
    this.selectedHerbForModal = herb;
    document.body.style.overflow = 'hidden';
  }

  viewAllDoctors(): void {
    this.router.navigate(['/find-doctors']);
  }

  viewAllMedicines(): void {
    this.router.navigate(['/medicines']);
  }

  exploreAllYoga(): void {
    this.router.navigate(['/user/content']); // Or specific yoga page if available
  }

  bookDoctor(doctor: any): void {
    if (doctor.id) {
      this.router.navigate(['/find-doctors'], { queryParams: { bookId: doctor.id } });
    } else {
      // Fallback search
      this.router.navigate(['/find-doctors'], { queryParams: { search: doctor.name } });
    }
  }

  addToCart(medicine: Medicine): void {
    this.cartService.addItem({
      id: String(medicine.id),
      name: medicine.name,
      type: 'medicine',
      price: medicine.price || 0,
      quantity: 1,
      image: ''
    });

    setTimeout(() => {
      this.snackbarService.success(`${medicine.name} added to cart!`);
    }, 300);
  }

  openDoshaQuiz(): void {
    this.router.navigate(['/ayurveda/prakriti']);
  }

  closeDoshaQuiz(): void {
    this.showDoshaQuiz = false;
  }

  submitDoshaQuiz(result: any): void {
    this.doshaAssessment = result;
    this.showDoshaQuiz = false;
    this.snackbarService.success('Dosha Assessment Updated!');
  }

  toggleSearchPortal(): void {
    this.searchQuery = '';
    this.switchTab('search');
  }

  handleQuickSearch(term: string): void {
    this.searchQuery = term;
    this.switchTab('search');
  }

  toggleAyurvedaInfo(): void {
    this.showAyurvedaInfo = !this.showAyurvedaInfo;
  }

  toggleYogaInfo(): void {
    this.showYogaInfo = !this.showYogaInfo;
  }

  toggleQuickSearch(): void {
    this.showQuickSearch = !this.showQuickSearch;
  }

  getDifficultyClass(difficulty: string): string {
    return difficulty.toLowerCase();
  }

  viewAllArticles(): void {
    this.router.navigate(['/articles']);
  }
}
