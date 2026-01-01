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

  constructor(private ayurvedaService: AyurvedaService) { }

  ngOnInit(): void {
    this.loadYogaData();
  }

  loadYogaData(): void {
    this.loading = true;

    // Load Yoga Sequences
    this.ayurvedaService.getExercises(10, 'yoga').subscribe({
      next: (data) => {
        this.yogaSequences = data;
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
  breathingState: 'inhale' | 'hold' | 'exhale' | 'ready' = 'ready';
  breathingTimer: any;

  startBreathing(): void {
    this.breathingState = 'inhale';
    // Mock logic for UI animation sync
    setTimeout(() => this.breathingState = 'hold', 4000);
    setTimeout(() => this.breathingState = 'exhale', 11000);
    setTimeout(() => this.breathingState = 'ready', 19000);
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
}
