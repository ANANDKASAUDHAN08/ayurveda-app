import { Component, OnDestroy, OnInit, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { DoctorService } from '../../shared/services/doctor.service';
import { AuthService } from '../../shared/services/auth.service';
import { SnackbarService } from '../../shared/services/snackbar.service';
import { AppointmentService } from '../../shared/services/appointment.service';
import { DoctorCardComponent } from '../doctor-card/doctor-card.component';
import { BookingModalComponent } from '../booking-modal/booking-modal.component';
import { DoctorDetailModalComponent } from '../doctor-detail-modal/doctor-detail-modal.component';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-doctor-list',
  standalone: true,
  imports: [CommonModule, FormsModule, DoctorCardComponent, BookingModalComponent, DoctorDetailModalComponent],
  templateUrl: './doctor-list.component.html',
  styleUrls: ['./doctor-list.component.css']
})
export class DoctorListComponent implements OnInit, OnDestroy {

  Math = Math;
  doctors: any[] = [];
  isLoading = true;
  error: string = '';

  // Video Consultancy Features
  doctorOnlineStatus: Map<number, boolean> = new Map();
  isFirstTimeUser: boolean = false;

  filters: any = {
    search: '',
    specialization: [],
    mode: '',
    maxFee: null, // default was 2000, changed to null to show all doctors
    minFee: 0,
    minExperience: null,

    minRating: 0,
    gender: '', // 'male', 'female', ''
    languages: [],
    availableNow: false,
    medicine_type: 'all'
  };

  private destroy$ = new Subject<void>();

  // Pagination
  currentPage = 1;
  itemsPerPage = 8;

  specializations = [
    'Cardiology', 'Orthopedics', 'Dermatology', 'Pediatrics', 'Neurology',
    'Oncology', 'Gastroenterology', 'Nephrology', 'Pulmonology', 'Ophthalmology',
    'ENT', 'General Medicine', 'Gynecology', 'Psychiatry', 'Dentistry',
    'Urology', 'Endocrinology', 'Rheumatology', 'Ayurveda', 'Homeopathy'
  ];

  languages = [
    'English', 'Hindi'
  ];

  // Sort Options
  sortBy = 'relevance'; // 'relevance', 'rating', 'experience', 'fee_low', 'fee_high'

  selectedDoctor: any = null;
  selectedDoctorForDetails: any = null;
  showMobileFilters = false;
  showDesktopFilters = false;
  showSortDropdown = false;

  // Search Suggestions & Omni-search
  suggestions: any[] = [];
  showSuggestions = false;
  searchDebounce: any;

  constructor(
    private doctorService: DoctorService,
    private authService: AuthService,
    private snackbar: SnackbarService,
    private route: ActivatedRoute,
    private appointmentService: AppointmentService,
    private elementRef: ElementRef
  ) { }


  ngOnInit() {
    // Check if first-time user for free consultation
    if (this.authService.isLoggedIn()) {
      this.appointmentService.isFirstTimeUser().subscribe({
        next: (isFree) => this.isFirstTimeUser = isFree,
        error: () => this.isFirstTimeUser = false
      });
    }

    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      if (params['search']) {
        this.filters.search = params['search'];
      }

      const bookId = params['bookId'];
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
            this.openBooking(matchedDoctor);
          } else {
            console.warn(`Doctor with ID ${idToFind} not found in filtered list`);
            this.doctors = data;
          }
        } else {
          this.doctors = data;
        }

        // Check online status for each doctor
        this.checkDoctorsOnlineStatus();

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
      minFee: 0,
      minExperience: null,
      minRating: 0,
      gender: '',
      languages: [],
      availableNow: false,
      medicine_type: 'all'
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
    this.destroy$.next();
    this.destroy$.complete();
    // Reset body overflow when component is destroyed
    document.body.style.overflow = '';
  }

  toggleMobileFilters() {
    this.showMobileFilters = !this.showMobileFilters;

    // Prevent body scroll when mobile filters are open
    if (this.showMobileFilters) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }

  toggleFilterSidebar() {
    this.showDesktopFilters = !this.showDesktopFilters;
  }

  toggleSortDropdown() {
    this.showSortDropdown = !this.showSortDropdown;
  }

  selectSort(value: string) {
    this.sortBy = value;
    this.showSortDropdown = false;
    this.onSortChange();
  }

  getSortLabel(value: string): string {
    const labels: { [key: string]: string } = {
      'relevance': 'Relevance',
      'rating': 'Highest Rated',
      'experience': 'Most Experienced',
      'fee_low': 'Price (Low to High)',
      'fee_high': 'Price (High to Low)'
    };
    return labels[value] || 'Relevance';
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
    this.applyFilters();
  }

  onClearFilter() {
    this.filters.medicine_type = 'all';
    this.applyFilters();
  }

  // Video Consultancy Methods

  checkDoctorsOnlineStatus() {
    this.doctors.forEach(doctor => {
      this.doctorService.isOnlineNow(doctor.id).subscribe({
        next: (isOnline) => {
          this.doctorOnlineStatus.set(doctor.id, isOnline);
        },
        error: () => {
          this.doctorOnlineStatus.set(doctor.id, false);
        }
      });
    });
  }

  isDoctorOnline(doctorId: number): boolean {
    return this.doctorOnlineStatus.get(doctorId) || false;
  }

  onInstantConsult(doctor: any) {
    if (!this.authService.isLoggedIn()) {
      this.snackbar.warning('Please login to start instant consultation');
      return;
    }

    // Open booking modal in instant mode
    this.selectedDoctor = { ...doctor, instantMode: true };
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;

    // Close suggestions if clicked outside
    const isSearchClick = target.closest('#omniSearchContainer') || target.closest('#mobileSearchContainer');
    if (!isSearchClick) {
      this.showSuggestions = false;
    }

    // Close Sort Dropdown on outside click
    const mobileSort = document.getElementById('mobileSortDropdown');
    const desktopSort = document.getElementById('desktopSortDropdown');
    const isSortClick = (mobileSort && mobileSort.contains(target)) || (desktopSort && desktopSort.contains(target));
    if (!isSortClick) {
      this.showSortDropdown = false;
    }
  }

  onSearchInput(query: string) {
    if (this.searchDebounce) clearTimeout(this.searchDebounce);

    if (!query || query.length < 2) {
      this.suggestions = [];
      this.showSuggestions = false;
      return;
    }

    this.searchDebounce = setTimeout(() => {
      this.doctorService.getDoctorSuggestions(query).subscribe({
        next: (res) => {
          if (res.success) {
            this.suggestions = res.data;
            this.showSuggestions = this.suggestions.length > 0;
          }
        },
        error: () => {
          this.suggestions = [];
          this.showSuggestions = false;
        }
      });
    }, 300);
  }

  selectSuggestion(suggestion: any) {
    this.showSuggestions = false;

    if (suggestion.type === 'doctor') {
      this.doctorService.getDoctorById(suggestion.id).subscribe(doctor => {
        this.openDetails(doctor);
      });
    } else if (suggestion.type === 'specialization') {
      this.filters.specialization = [suggestion.text];
      this.filters.search = '';
      this.applyFilters();
    } else if (suggestion.type === 'medicine_type') {
      this.filters.medicine_type = suggestion.text.toLowerCase();
      this.filters.search = '';
      this.applyFilters();
    } else if (suggestion.type === 'clinic') {
      this.filters.search = suggestion.text;
      this.applyFilters();
    } else if (suggestion.type === 'price') {
      this.filters.maxFee = suggestion.value;
      this.filters.search = '';
      this.applyFilters();
    } else if (suggestion.type === 'experience') {
      this.filters.minExperience = suggestion.value;
      this.filters.search = '';
      this.applyFilters();
    } else {
      this.filters.search = suggestion.text;
      this.applyFilters();
    }
  }

  clearSearch(event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    this.filters.search = '';
    this.suggestions = [];
    this.showSuggestions = false;
    this.applyFilters();

    // Maintain focus on mobile if clear was clicked
    if (!this.isDesktop()) {
      setTimeout(() => {
        const input = document.getElementById('mobileSearchInput') as HTMLInputElement;
        if (input) input.focus();
      }, 0);
    }
  }

  isDesktop(): boolean {
    return window.innerWidth >= 1024;
  }
}
