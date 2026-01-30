import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, Renderer2, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PharmacyReviewService } from '../../../shared/services/pharmacy-review.service';
import { ShareService } from '../../../shared/services/share.service';
import { FavoritesService } from '../../../shared/services/favorites.service';
import { AuthService } from '../../../shared/services/auth.service';
import { PharmacyReview } from '../../../shared/models/review.model';

@Component({
    selector: 'app-pharmacy-details-modal',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './pharmacy-details-modal.component.html',
    styleUrl: './pharmacy-details-modal.component.css'
})
export class PharmacyDetailsModalComponent implements OnInit, OnDestroy, OnChanges {
    @Input() pharmacy: any;
    @Input() isOpen: boolean = false;
    @Output() close = new EventEmitter<void>();

    activeTab: 'details' | 'reviews' = 'details';
    reviews: PharmacyReview[] = [];
    reviewStats: any = null;
    isLoadingReviews: boolean = false;

    // New Review Form
    newReview = {
        rating: 5,
        title: '',
        comment: ''
    };
    isSubmittingReview: boolean = false;

    constructor(
        private pharmacyReviewService: PharmacyReviewService,
        private shareService: ShareService,
        private favoritesService: FavoritesService,
        public authService: AuthService,
        private renderer: Renderer2
    ) { }

    ngOnInit() {
        if (this.pharmacy && this.pharmacy.id) {
            this.loadReviewStats();
        }
    }

    ngOnDestroy() {
        // Ensure scroll is unlocked if component is destroyed while modal is open
        this.unlockScroll();
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['isOpen']) {
            if (this.isOpen) {
                this.lockScroll();
            } else {
                this.unlockScroll();
            }
        }

        if (this.isOpen && this.pharmacy && this.pharmacy.id) {
            this.loadReviewStats();
            if (this.activeTab === 'reviews') {
                this.loadReviews();
            }
        }
    }

    private lockScroll() {
        this.renderer.addClass(document.body, 'modal-open');
        this.renderer.setStyle(document.body, 'overflow', 'hidden');
    }

    private unlockScroll() {
        this.renderer.removeClass(document.body, 'modal-open');
        this.renderer.removeStyle(document.body, 'overflow');
    }

    closeModal() {
        this.close.emit();
        this.activeTab = 'details';
        this.unlockScroll();
    }

    setTab(tab: 'details' | 'reviews') {
        this.activeTab = tab;
        if (tab === 'reviews' && this.reviews.length === 0) {
            this.loadReviews();
        }
    }

    loadReviews() {
        this.isLoadingReviews = true;
        this.pharmacyReviewService.getPharmacyReviews(this.pharmacy.id).subscribe({
            next: (res) => {
                this.reviews = res.data;
                this.isLoadingReviews = false;
            },
            error: (err) => {
                console.error('Error loading reviews', err);
                this.isLoadingReviews = false;
            }
        });
    }

    loadReviewStats() {
        this.pharmacyReviewService.getPharmacyReviewStats(this.pharmacy.id).subscribe({
            next: (res) => {
                this.reviewStats = res.data;
            }
        });
    }

    submitReview() {
        if (!this.authService.isLoggedIn()) {
            return;
        }

        this.isSubmittingReview = true;
        this.pharmacyReviewService.submitPharmacyReview({
            pharmacy_id: this.pharmacy.id,
            ...this.newReview
        }).subscribe({
            next: (res) => {
                this.reviews.unshift(res.data);
                this.newReview = { rating: 5, title: '', comment: '' };
                this.isSubmittingReview = false;
                this.loadReviewStats();
            },
            error: (err) => {
                console.error('Error submitting review', err);
                this.isSubmittingReview = false;
            }
        });
    }

    sharePharmacy() {
        this.shareService.share({
            title: this.pharmacy.name,
            text: `Check out ${this.pharmacy.name} in ${this.pharmacy.city}!`,
            url: window.location.href
        });
    }

    toggleFavorite() {
        this.favoritesService.toggleFavorite(this.pharmacy.id, 'pharmacy').subscribe();
    }

    isFavorite(): boolean {
        return this.favoritesService.isFavorite(this.pharmacy.id, 'pharmacy');
    }
}
