import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AyurvedaService, Exercise, YogaPose } from '../../../../shared/services/ayurveda.service';

@Component({
  selector: 'app-yoga',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './yoga.component.html',
  styleUrl: './yoga.component.css'
})
export class YogaComponent implements OnInit {
  yogaSequences: Exercise[] = [];
  meditationSessions: Exercise[] = [];
  allPoses: YogaPose[] = [];
  poseOfWeek: YogaPose | null = null;
  isAudioPlaying = false;
  visualizerBars = new Array(20).fill(0);
  loading = true;
  activeCategory = 'All';
  filteredSequences: Exercise[] = [];
  categories = ['All', 'Foundational', 'Vinyasa', 'Hatha', 'Restorative', 'Power'];
  currentSutra: { text: string, translation: string } | null = null;
  activeSession: Exercise | null = null;

  sutras = [
    { text: 'Yogas Chitta Vritti Nirodhah', translation: 'Yoga is the cessation of the fluctuations of the mind.' },
    { text: 'Abhyasa Vairagyabhyam Tan-nirodhah', translation: 'The fluctuations are stilled through practice and non-attachment.' },
    { text: 'Sthira Sukham Asanam', translation: 'The posture should be steady and comfortable.' },
    { text: 'Tapah Svadhyaya Ishvara Pranidhanani Kriya Yogah', translation: 'Discipline, self-study, and surrender to the divine constitute Kriya Yoga.' }
  ];

  constructor(private ayurvedaService: AyurvedaService) { }

  ngOnInit(): void {
    this.loadYogaData();
    this.currentSutra = this.sutras[Math.floor(Math.random() * this.sutras.length)];
  }

  loadYogaData(): void {
    this.loading = true;

    // Load Yoga Sequences
    this.ayurvedaService.getExercises(10, 'yoga').subscribe({
      next: (data) => {
        this.yogaSequences = data;
        this.filteredSequences = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error fetching yoga sequences:', err);
        this.loading = false;
      }
    });

    // Load Meditation Sessions
    this.ayurvedaService.getExercises(10, 'meditation').subscribe({
      next: (data) => {
        this.meditationSessions = data;
        if (data.length > 0) this.activeSession = data[0];
      },
      error: (err) => console.error('Error fetching meditations:', err)
    });

    // Load Poses
    this.ayurvedaService.getYogaPoses().subscribe({
      next: (data) => {
        this.allPoses = data;
        this.poseOfWeek = data.find(p => p.is_pose_of_week) || data[0];
      },
      error: (err) => console.error('Error fetching poses:', err)
    });
  }

  toggleAudio(): void {
    this.isAudioPlaying = !this.isAudioPlaying;
    if (this.isAudioPlaying) {
      this.animateVisualizer();
    }
  }

  animateVisualizer(): void {
    if (!this.isAudioPlaying) return;
    this.visualizerBars = this.visualizerBars.map(() => Math.random() * 100);
    setTimeout(() => this.animateVisualizer(), 150);
  }
  breathingState: 'Inhale' | 'Hold' | 'Exhale' | 'Ready' = 'Ready';
  breathingTimer: any;

  startBreathing(): void {
    if (this.breathingState !== 'Ready') return;

    const cycle = () => {
      // Inhale: 4 seconds
      this.breathingState = 'Inhale';
      setTimeout(() => {
        // Hold: 7 seconds
        this.breathingState = 'Hold';
        setTimeout(() => {
          // Exhale: 8 seconds
          this.breathingState = 'Exhale';
          setTimeout(() => {
            this.breathingState = 'Ready';
          }, 8000);
        }, 7000);
      }, 4000);
    };

    cycle();
  }

  filterByCategory(category: string): void {
    this.activeCategory = category;
    if (category === 'All') {
      this.filteredSequences = this.yogaSequences;
    } else {
      this.filteredSequences = this.yogaSequences.filter(s =>
        s.difficulty.toLowerCase().includes(category.toLowerCase()) ||
        s.name.toLowerCase().includes(category.toLowerCase())
      );
    }
  }

  getEnergyLevel(difficulty: string): string {
    switch (difficulty) {
      case 'beginner': return 'Low';
      case 'intermediate': return 'Medium';
      case 'advanced': return 'High';
      default: return 'Medium';
    }
  }

  getIcon(type: string): string {
    switch (type) {
      case 'yoga': return '🧘';
      case 'pranayama': return '🌬️';
      case 'meditation': return '✨';
      default: return '🌿';
    }
  }

  scrollToSection(sectionId: string): void {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  playSession(session: Exercise): void {
    this.activeSession = session;
    if (!this.isAudioPlaying) {
      this.toggleAudio();
    }
  }

  viewExercise(exercise: any): void {
    console.log('Viewing exercise:', exercise);
    // Future: router.navigate to details
  }
}
