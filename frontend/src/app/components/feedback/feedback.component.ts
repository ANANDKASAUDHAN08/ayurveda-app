import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WebsiteReviewService } from '../../shared/services/website-review.service';
import { AuthService } from '../../shared/services/auth.service';
import { SnackbarService } from '../../shared/services/snackbar.service';
import { ReviewFormComponent } from '../../shared/components/review-form/review-form.component';
import { ReviewListComponent } from '../../shared/components/review-list/review-list.component';
import { RatingDisplayComponent } from '../../shared/components/rating-display/rating-display.component';
import { WebsiteReview, WebsiteReviewStats } from '../../shared/models/review.model';

@Component({
    selector: 'app-feedback',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ReviewFormComponent,
        ReviewListComponent,
        RatingDisplayComponent
    ],
    templateUrl: './feedback.component.html',
    styleUrl: './feedback.component.css'
})
export class FeedbackComponent implements OnInit {
    reviews: WebsiteReview[] = [];
    stats: WebsiteReviewStats | null = null;
    loading = false;
    showReviewForm = false;

    // Filters
    selectedCategory: string = '';
    categories = [
        { value: '', label: 'All Feedback' },
        { value: 'general', label: 'General' },
        { value: 'ui_ux', label: 'UI/UX' },
        { value: 'features', label: 'Features' },
        { value: 'performance', label: 'Performance' },
        { value: 'suggestion', label: 'Suggestions' },
        { value: 'bug_report', label: 'Bug Reports' }
    ];

    // Pagination
    currentPage = 1;
    totalPages = 1;
    limit = 10;

    constructor(
        private websiteReviewService: WebsiteReviewService,
        public authService: AuthService,
        private snackbar: SnackbarService
    ) { }

    private toggleBodyScroll(show: boolean) {
        if (show) {
            document.body.classList.add('overflow-hidden');
        } else {
            document.body.classList.remove('overflow-hidden');
        }
    }

    ngOnInit() {
        this.loadReviews();
        this.loadStats();
    }

    loadReviews() {
        this.loading = true;

        this.websiteReviewService.getWebsiteReviews({
            page: this.currentPage,
            limit: this.limit,
            category: this.selectedCategory || undefined
        }).subscribe({
            next: (response: any) => {
                this.reviews = response.data;
                this.totalPages = response.pagination?.totalPages || 1;
                setTimeout(() => {
                    this.loading = false;
                }, 500);
            },
            error: (error: any) => {
                console.error('Error loading reviews:', error);
                this.loading = false;
            }
        });
    }

    loadStats() {
        this.websiteReviewService.getWebsiteReviewStats().subscribe({
            next: (response: any) => {
                this.stats = response.data;
            },
            error: (error: any) => {
                console.error('Error loading stats:', error);
            }
        });
    }

    onCategoryChange() {
        this.currentPage = 1;
        this.loadReviews();
        this.loadStats();
    }

    openReviewForm() {
        if (!this.authService.isLoggedIn()) {
            this.snackbar.info('Please login to submit feedback');
            return;
        }
        this.showReviewForm = true;
        this.toggleBodyScroll(true);
    }

    closeReviewForm() {
        this.showReviewForm = false;
        this.toggleBodyScroll(false);
    }

    submitReview(reviewData: any) {
        this.websiteReviewService.submitWebsiteReview(reviewData).subscribe({
            next: (response) => {
                this.showReviewForm = false;
                this.toggleBodyScroll(false);
                this.loadReviews();
                this.loadStats();
                this.snackbar.success('Feedback submitted successfully! Thank you.');
            },
            error: (error) => {
                console.error('Error submitting feedback:', error);
                this.snackbar.error(error.error?.message || 'Failed to submit feedback');
            }
        });
    }

    onPageChange(page: number) {
        this.currentPage = page;
        this.loadReviews();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    onEditReview(review: WebsiteReview) {
        console.log('Edit review:', review);
        // TODO: Implement edit functionality
    }

    onDeleteReview(reviewId: number) {
        this.websiteReviewService.deleteWebsiteReview(reviewId).subscribe({
            next: () => {
                this.loadReviews();
                this.loadStats();
                this.snackbar.success('Feedback deleted successfully');
            },
            error: (error) => {
                console.error('Error deleting feedback:', error);
                this.snackbar.error('Failed to delete feedback');
            }
        });
    }
}
