import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DoctorService } from '../../shared/services/doctor.service';
import { AuthService } from '../../shared/services/auth.service';
import { SnackbarService } from '../../shared/services/snackbar.service';
import { DoctorCardComponent } from '../doctor-card/doctor-card.component';
import { BookingModalComponent } from '../booking-modal/booking-modal.component';
import { DoctorDetailModalComponent } from '../doctor-detail-modal/doctor-detail-modal.component';

@Component({
  selector: 'app-doctor-list',
  standalone: true,
  imports: [CommonModule, FormsModule, DoctorCardComponent, BookingModalComponent, DoctorDetailModalComponent],
  templateUrl: './doctor-list.component.html'
})
export class DoctorListComponent implements OnInit {
  doctors: any[] = [];
  filteredDoctors: any[] = [];
  isLoading = true;
  error: string = '';

  filters = {
    search: '',
    specialization: '',
    mode: ''
  };

  specializations = [
    'Cardiology', 'Orthopedics', 'Dermatology', 'Pediatrics', 'Neurology',
    'Oncology', 'Gastroenterology', 'Nephrology', 'Pulmonology', 'Ophthalmology',
    'ENT', 'General Medicine', 'Gynecology', 'Psychiatry', 'Dentistry',
    'Urology', 'Endocrinology', 'Rheumatology', 'Ayurveda', 'Homeopathy'
  ];

  selectedDoctor: any = null;
  selectedDoctorForDetails: any = null;

  constructor(
    private doctorService: DoctorService,
    private authService: AuthService,
    private snackbar: SnackbarService
  ) { }

  ngOnInit() {
    this.loadDoctors();
  }

  loadDoctors() {
    this.isLoading = true;
    this.error = '';

    this.doctorService.getDoctors(this.filters).subscribe({
      next: (data) => {
        if (data.length > 0) {
          console.log('First doctor sample:', data[0]);
        }
        this.doctors = data;
        this.filteredDoctors = data;
        setTimeout(() => {
          this.isLoading = false;
        }, 500);
      },
      error: (err) => {
        this.error = 'Failed to load doctors. Please try again.';
        setTimeout(() => {
          this.isLoading = false;
        }, 500);
      }
    });
  }

  applyFilters() {
    this.loadDoctors();
  }

  clearFilters() {
    this.filters = {
      search: '',
      specialization: '',
      mode: ''
    };
    this.loadDoctors();
  }

  openDetails(doctor: any) {
    this.selectedDoctorForDetails = doctor;
  }

  closeDetails() {
    this.selectedDoctorForDetails = null;
  }

  openBookingFromDetails(doctor: any) {
    this.closeDetails();
    this.openBooking(doctor);
  }

  openBooking(doctor: any) {
    if (!this.authService.isLoggedIn()) {
      this.snackbar.warning('Please login to book an appointment');
      return;
    }
    this.selectedDoctor = doctor;
  }

  closeBooking() {
    this.selectedDoctor = null;
  }

  onBookingConfirmed(appointment: any) {
    this.snackbar.success('Your appointment has been booked successfully!');
    this.selectedDoctor = null;
  }
}
