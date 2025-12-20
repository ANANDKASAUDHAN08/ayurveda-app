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

  Math = Math;
  doctors: any[] = [];
  filteredDoctors: any[] = [];
  isLoading = true;
  error: string = '';

  filters: any = {
    search: '',
    specialization: [],
    mode: '',
    maxFee: null,
    minExperience: null
  };

  // Pagination
  currentPage = 1;
  itemsPerPage = 10;

  specializations = [
    'Cardiology', 'Orthopedics', 'Dermatology', 'Pediatrics', 'Neurology',
    'Oncology', 'Gastroenterology', 'Nephrology', 'Pulmonology', 'Ophthalmology',
    'ENT', 'General Medicine', 'Gynecology', 'Psychiatry', 'Dentistry',
    'Urology', 'Endocrinology', 'Rheumatology', 'Ayurveda', 'Homeopathy'
  ];

  selectedDoctor: any = null;
  selectedDoctorForDetails: any = null;
  showMobileFilters = false;
  isFilterCollapsed = false;

  constructor(
    private doctorService: DoctorService,
    private authService: AuthService,
    private snackbar: SnackbarService
  ) { }

  ngOnInit() {
    this.loadDoctors();
  }

  get paginatedDoctors() {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.doctors.slice(start, end);
  }

  get totalPages() {
    return Math.ceil(this.doctors.length / this.itemsPerPage);
  }

  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  loadDoctors() {
    this.isLoading = true;
    this.error = '';

    this.doctorService.getDoctors(this.filters).subscribe({
      next: (data) => {
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
    this.currentPage = 1;
    this.loadDoctors();
  }

  toggleSpecialization(spec: string) {
    const index = this.filters.specialization.indexOf(spec);
    if (index > -1) {
      this.filters.specialization.splice(index, 1);
    } else {
      this.filters.specialization.push(spec);
    }
    this.applyFilters();
  }

  toggleMode(mode: string) {
    if (this.filters.mode === mode) {
      this.filters.mode = ''; // Deselect
    } else {
      this.filters.mode = mode;
    }
    this.applyFilters();
  }

  clearFilters() {
    this.filters = {
      search: '',
      specialization: [],
      mode: '',
      maxFee: null,
      minExperience: null
    };
    this.loadDoctors();
  }

  toggleMobileFilters() {
    this.showMobileFilters = !this.showMobileFilters;
  }

  toggleFilterSidebar() {
    this.isFilterCollapsed = !this.isFilterCollapsed;
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }
  nextPage() {
    this.goToPage(this.currentPage + 1);
  }
  previousPage() {
    this.goToPage(this.currentPage - 1);
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
