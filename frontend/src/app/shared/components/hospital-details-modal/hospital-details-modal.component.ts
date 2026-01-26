import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { RatingDisplayComponent } from '../rating-display/rating-display.component';
import { ReviewListComponent } from '../review-list/review-list.component';
import { ReviewFormComponent } from '../review-form/review-form.component';
import { HospitalReviewService } from '../../services/hospital-review.service';
import { AuthService } from '../../services/auth.service';
import { getEncyclopediaKey } from '../../utils/specialty-mapping';
import { HospitalReview, ReviewStats } from '../../models/review.model';

@Component({
    selector: 'app-hospital-details-modal',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        FormsModule,
        RatingDisplayComponent,
        ReviewListComponent,
        ReviewFormComponent
    ],
    templateUrl: './hospital-details-modal.component.html'
})
export class HospitalDetailsModalComponent implements OnChanges {
    @Input() hospital: any;
    @Input() isFavorite: boolean = false;
    @Input() showModal: boolean = false;

    @Output() closeModal = new EventEmitter<void>();
    @Output() toggleFavorite = new EventEmitter<Event>();

    activeTab: 'details' | 'reviews' = 'details';
    reviews: HospitalReview[] = [];
    reviewStats: ReviewStats | null = null;
    reviewsLoading = false;
    showReviewForm = false;
    reviewsCurrentPage = 1;
    reviewsTotalPages = 1;

    constructor(
        private hospitalReviewService: HospitalReviewService,
        public authService: AuthService
    ) { }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['hospital'] && this.hospital && this.showModal) {
            this.resetModalState();
            this.loadHospitalReviews();
            this.loadReviewStats();
        }
    }

    resetModalState() {
        this.activeTab = 'details';
        this.reviews = [];
        this.reviewStats = null;
        this.reviewsCurrentPage = 1;
        this.showReviewForm = false;
    }

    onCloseModal() {
        this.closeModal.emit();
    }

    onToggleFavorite(event: Event) {
        this.toggleFavorite.emit(event);
    }

    loadHospitalReviews() {
        if (!this.hospital) return;
        this.reviewsLoading = true;
        const source = this.getHospitalSource(this.hospital);

        this.hospitalReviewService.getHospitalReviews(
            this.hospital.id,
            source,
            this.reviewsCurrentPage,
            5
        ).subscribe({
            next: (response) => {
                this.reviews = response.data;
                this.reviewsTotalPages = response.pagination?.totalPages || 1;
                this.reviewsLoading = false;
            },
            error: (error) => {
                console.error('Error loading reviews:', error);
                this.reviewsLoading = false;
            }
        });
    }

    loadReviewStats() {
        if (!this.hospital) return;
        const source = this.getHospitalSource(this.hospital);

        this.hospitalReviewService.getHospitalReviewStats(
            this.hospital.id,
            source
        ).subscribe({
            next: (response) => {
                this.reviewStats = response.data;
            },
            error: (error) => console.error('Error loading stats:', error)
        });
    }

    getHospitalSource(hospital: any): string {
        return hospital.data_source === 'NABH' ? 'nabh_hospitals' :
            hospital.data_source === 'Specialty' ? 'hospitals_with_specialties' : 'hospitals';
    }

    openReviewForm() {
        if (!this.authService.isLoggedIn()) {
            alert('Please login to write a review');
            return;
        }
        this.showReviewForm = true;
    }

    closeReviewForm() {
        this.showReviewForm = false;
    }

    submitReview(reviewData: any) {
        if (!this.hospital) return;
        const source = this.getHospitalSource(this.hospital);

        this.hospitalReviewService.submitHospitalReview({
            hospital_id: this.hospital.id,
            hospital_source: source,
            ...reviewData
        }).subscribe({
            next: () => {
                this.showReviewForm = false;
                this.loadHospitalReviews();
                this.loadReviewStats();
                alert('Review submitted successfully!');
            },
            error: (error) => {
                console.error('Error submitting review:', error);
                alert(error.error?.message || 'Failed to submit review');
            }
        });
    }

    onReviewPageChange(page: number) {
        this.reviewsCurrentPage = page;
        this.loadHospitalReviews();
    }

    onEditReview(review: HospitalReview) {
        console.log('Edit review:', review);
    }

    onDeleteReview(reviewId: number) {
        this.hospitalReviewService.deleteHospitalReview(reviewId).subscribe({
            next: () => {
                this.loadHospitalReviews();
                this.loadReviewStats();
                alert('Review deleted successfully');
            },
            error: (error) => {
                console.error('Error deleting review:', error);
                alert('Failed to delete review');
            }
        });
    }

    formatName(name: string): string {
        if (!name) return '';
        return name.replace(/^"+|"+$/g, '').trim();
    }

    formatLocation(hospital: any): string {
        if (!hospital) return 'Location Verified';

        const city = hospital.city?.toString().trim();
        const state = hospital.state?.toString().trim();
        const location = hospital.location?.toString().trim();

        if (city && state && city.toLowerCase() !== 'null' && state.toLowerCase() !== 'null') {
            return `${city}, ${state}`;
        } else if (state && state.toLowerCase() !== 'null' && state.toLowerCase() !== 'n/a') {
            return state;
        } else if (city && city.toLowerCase() !== 'null' && city.toLowerCase() !== 'n/a') {
            return city;
        } else if (location && location.toLowerCase() !== 'null' && location.toLowerCase() !== 'n/a') {
            return location;
        }

        // Final fallback if address contains a city-like part
        if (hospital.address && typeof hospital.address === 'string') {
            const parts = hospital.address.split(',');
            if (parts.length > 2) {
                return parts[parts.length - 2].trim();
            }
        }

        return 'Location Verified';
    }

    formatAddress(hospital: any): string {
        if (!hospital || !hospital.address) return '';
        let address = hospital.address.replace(/"/g, '').trim();
        if (hospital.name && address.startsWith(hospital.name.replace(/"/g, ''))) {
            address = address.substring(hospital.name.replace(/"/g, '').length).trim();
            if (address.startsWith(',') || address.startsWith('-')) {
                address = address.substring(1).trim();
            }
        }
        return address || 'Address available on request';
    }

    getSpecialtiesList(specialties: string): string[] {
        if (!specialties || typeof specialties !== 'string') return [];
        const sanitized = specialties.trim();
        if (sanitized === '' || sanitized === '[]' || sanitized === 'null') return [];
        return sanitized.split(',').map(s => s.trim()).filter(s => s.length > 0 && s !== '[]');
    }

    getFacilitiesList(facilities: string): string[] {
        if (!facilities || typeof facilities !== 'string') return [];
        const sanitized = facilities.trim();
        if (sanitized === '' || sanitized === '[]' || sanitized === 'null') return [];
        return sanitized.split(',').map(f => f.trim()).filter(f => f.length > 0 && f !== '[]');
    }

    getSpecialtyKey(specialty: string): string | null {
        return getEncyclopediaKey(specialty);
    }
}
