import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BookingModalComponent } from '../booking-modal/booking-modal.component';
import { SnackbarService } from 'src/app/shared/services/snackbar.service';
import { AuthService } from 'src/app/shared/services/auth.service';
import { FavoritesService } from 'src/app/shared/services/favorites.service';
import { DoctorService } from '../../shared/services/doctor.service';

@Component({
  selector: 'app-doctor-detail-modal',
  standalone: true,
  imports: [CommonModule, BookingModalComponent],
  templateUrl: './doctor-detail-modal.component.html'
})
export class DoctorDetailModalComponent implements OnInit, OnDestroy {
  @Input() doctor: any;
  @Input() isOnline: boolean = false; // NEW
  @Input() isFree: boolean = false; // NEW
  @Output() close = new EventEmitter<void>();
  @Output() book = new EventEmitter<any>();
  @Output() instantConsult = new EventEmitter<any>(); // NEW

  showBooking = false;

  // Video Consultancy Features
  reviews: any[] = [];
  availableSlots: any[] = [];
  selectedDate: Date = new Date();
  loadingReviews: boolean = false;
  loadingSlots: boolean = false;

  constructor(
    private authService: AuthService,
    private snackbar: SnackbarService,
    private favoritesService: FavoritesService,
    private doctorService: DoctorService
  ) { }

  ngOnInit(): void {
    document.body.style.overflow = 'hidden';
    this.loadReviews();
    this.loadAvailableSlots();
  }

  ngOnDestroy(): void {
    document.body.style.overflow = '';
  }

  onClose() {
    this.close.emit();
  }

  onBook() {
    if (!this.authService.isLoggedIn()) {
      this.snackbar.warning('Please login to book an appointment');
      return;
    }
    this.book.emit(this.doctor);
  }

  toggleFavorite() {
    if (this.doctor) {
      this.favoritesService.toggleFavorite(this.doctor.id, 'doctor').subscribe();
    }
  }

  isFavorite(): boolean {
    return this.doctor ? this.favoritesService.isFavorite(this.doctor.id, 'doctor') : false;
  }

  closeBooking() {
    this.showBooking = false;
  }

  getLanguages(): string[] {
    if (!this.doctor?.languages) return ['English', 'Hindi'];
    if (Array.isArray(this.doctor.languages)) return this.doctor.languages;
    if (typeof this.doctor.languages === 'string') {
      return this.doctor.languages.split(',').map((l: string) => l.trim());
    }
    return ['English', 'Hindi'];
  }

  // Video Consultancy Methods

  loadReviews() {
    if (!this.doctor?.id) return;

    this.loadingReviews = true;
    this.doctorService.getDoctorReviews(this.doctor.id, 1, 5).subscribe({
      next: (response) => {
        this.reviews = response.data || [];
        this.loadingReviews = false;
      },
      error: () => {
        this.reviews = [];
        this.loadingReviews = false;
      }
    });
  }

  loadAvailableSlots() {
    if (!this.doctor?.id) return;

    const today = new Date().toISOString().split('T')[0];
    this.loadingSlots = true;

    this.doctorService.getAvailableSlots(this.doctor.id, today).subscribe({
      next: (slots) => {
        this.availableSlots = slots || [];
        this.loadingSlots = false;
      },
      error: () => {
        this.availableSlots = [];
        this.loadingSlots = false;
      }
    });
  }

  onInstantConsult() {
    if (!this.authService.isLoggedIn()) {
      this.snackbar.warning('Please login to start instant consultation');
      return;
    }
    this.instantConsult.emit(this.doctor);
  }

  getStars(rating: number): string[] {
    const stars = [];
    const fullStars = Math.floor(rating || 0);
    for (let i = 1; i <= 5; i++) {
      stars.push(i <= fullStars ? '★' : '☆');
    }
    return stars;
  }

  getRatingPercentage(stars: number): number {
    if (!this.reviews || this.reviews.length === 0) return 0;
    const count = this.reviews.filter(r => Math.round(r.rating) === stars).length;
    return (count / this.reviews.length) * 100;
  }

  formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  formatTime(time: string): string {
    if (!time) return '';
    const [hours, minutes] = time.split(':').map(Number);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const h = hours % 12 || 12;
    return `${h}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  }
}
