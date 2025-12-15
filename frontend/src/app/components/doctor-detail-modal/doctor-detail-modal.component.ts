import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BookingModalComponent } from '../booking-modal/booking-modal.component';
import { SnackbarService } from 'src/app/services/snackbar.service';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-doctor-detail-modal',
  standalone: true,
  imports: [CommonModule, BookingModalComponent],
  templateUrl: './doctor-detail-modal.component.html'
})
export class DoctorDetailModalComponent {
  @Input() doctor: any;
  @Output() close = new EventEmitter<void>();
  @Output() book = new EventEmitter<any>();

  showBooking = false;

  constructor(
    private authService: AuthService,
    private snackbar: SnackbarService
  ) { }

  onClose() {
    this.close.emit();
  }

  onBook() {
    if (!this.authService.isLoggedIn()) {
      this.snackbar.warning('Please login to book an appointment');
      return;
    }
    this.showBooking = true;
    // this.book.emit(this.doctor); // Disabled to use inline booking
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
}
