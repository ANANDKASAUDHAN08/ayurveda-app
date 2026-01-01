import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { DoctorService } from '../../shared/services/doctor.service';
import { AuthService } from '../../shared/services/auth.service';
import { SnackbarService } from '../../shared/services/snackbar.service';
import { DoctorCardComponent } from '../doctor-card/doctor-card.component';
import { BookingModalComponent } from '../booking-modal/booking-modal.component';
import { DoctorDetailModalComponent } from '../doctor-detail-modal/doctor-detail-modal.component';
import { MedicineTypeService, MedicineType, FilterMode } from '../../shared/services/medicine-type.service';
import { ContextBannerComponent } from '../../shared/components/context-banner/context-banner.component';
import { Subscription, combineLatest, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-doctor-list',
  standalone: true,
  imports: [CommonModule, FormsModule, DoctorCardComponent, BookingModalComponent, DoctorDetailModalComponent, ContextBannerComponent],
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
    maxFee: 2000,
    minFee: 0,
    minExperience: null,
    medicine_type: 'all', // NEW: Medicine type filter
    minRating: 0,
    gender: '', // 'male', 'female', ''
    languages: [],
    availableNow: false
  };

  private medicineTypeSubscription?: Subscription;
  private destroy$ = new Subject<void>();

  // Pagination
  currentPage = 1;
  itemsPerPage = 10;

  specializations = [
    'Cardiology', 'Orthopedics', 'Dermatology', 'Pediatrics', 'Neurology',
    'Oncology', 'Gastroenterology', 'Nephrology', 'Pulmonology', 'Ophthalmology',
    'ENT', 'General Medicine', 'Gynecology', 'Psychiatry', 'Dentistry',
    'Urology', 'Endocrinology', 'Rheumatology', 'Ayurveda', 'Homeopathy'
  ];

  languages = [
    'English', 'Hindi', 'Bengali', 'Tamil', 'Telugu',
    'Marathi', 'Gujarati', 'Kannada', 'Malayalam'
  ];

  // Sort Options
  sortBy = 'relevance'; // 'relevance', 'rating', 'experience', 'fee_low', 'fee_high'

  selectedDoctor: any = null;
  selectedDoctorForDetails: any = null;
  showMobileFilters = false;
  isFilterCollapsed = false;

  // Medicine type context
  currentMedicineType: MedicineType | 'all' = 'all';

  constructor(
    private doctorService: DoctorService,
    private authService: AuthService,
    private snackbar: SnackbarService,
    private medicineTypeService: MedicineTypeService,
    private route: ActivatedRoute
  ) { }

  ngOnInit() {
    combineLatest([
      this.route.queryParams,
      this.medicineTypeService.getCurrentType()
    ]).pipe(takeUntil(this.destroy$)).subscribe(([params, type]) => {
      if (params['search']) {
        this.filters.search = params['search'];
      }

      const bookId = params['bookId'];
      this.filters.medicine_type = type;
      this.currentMedicineType = type;

      this.loadDoctorsInternal(bookId);
    });
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
    this.loadDoctorsInternal();
  }

  loadDoctorsInternal(bookIdToOpen?: string) {
    this.isLoading = true;
    this.error = '';

    this.doctorService.getDoctors(this.filters).subscribe({
      next: (data) => {
        // If bookId is provided, show ONLY that doctor
        if (bookIdToOpen) {
          const idToFind = parseInt(bookIdToOpen, 10);
          const matchedDoctor = data.find((d: any) => Number(d.id) === idToFind);

          if (matchedDoctor) {
            this.doctors = [matchedDoctor];
            this.filteredDoctors = [matchedDoctor];
            this.openBooking(matchedDoctor);
          } else {
            console.warn(`Doctor with ID ${idToFind} not found in filtered list`);
            this.doctors = data;
            this.filteredDoctors = data;
          }
        } else {
          this.doctors = data;
          this.filteredDoctors = data;
        }

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
    // Don't clear medicine_type - it's controlled by the navbar selector
    const currentMedicineType = this.filters.medicine_type;
    this.filters = {
      search: '',
      specialization: [],
      mode: '',
      maxFee: 2000,
      minFee: 0,
      minExperience: null,
      medicine_type: currentMedicineType,
      minRating: 0,
      gender: '',
      languages: [],
      availableNow: false
    };
    this.sortBy = 'relevance';
    this.loadDoctors();
  }

  toggleLanguage(lang: string) {
    const index = this.filters.languages.indexOf(lang);
    if (index > -1) {
      this.filters.languages.splice(index, 1);
    } else {
      this.filters.languages.push(lang);
    }
    this.applyFilters();
  }

  toggleGender(gender: string) {
    this.filters.gender = this.filters.gender === gender ? '' : gender;
    this.applyFilters();
  }

  onPriceRangeChange() {
    this.applyFilters();
  }

  onSortChange() {
    // Sort the current doctors array based on selected sort option
    switch (this.sortBy) {
      case 'rating':
        this.doctors.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'experience':
        this.doctors.sort((a, b) => (b.experience || 0) - (a.experience || 0));
        break;
      case 'fee_low':
        this.doctors.sort((a, b) => (a.consultation_fee || 0) - (b.consultation_fee || 0));
        break;
      case 'fee_high':
        this.doctors.sort((a, b) => (b.consultation_fee || 0) - (a.consultation_fee || 0));
        break;
      default:
        // relevance - keep original order from API
        this.loadDoctors();
        return;
    }
    this.currentPage = 1;
  }

  ngOnDestroy() {
    this.medicineTypeSubscription?.unsubscribe();
    this.destroy$.next();
    this.destroy$.complete();
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

  onToggleFilter() {
    // Filter mode toggle not implemented in service
    this.applyFilters();
  }

  onClearFilter() {
    this.currentMedicineType = 'all';
    this.filters.medicine_type = 'all';
    this.applyFilters();
  }

  onSwitchType(type: MedicineType) {
    this.medicineTypeService.setMedicineType(type);
  }
}
