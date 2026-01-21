import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RatingDisplayComponent } from '../rating-display/rating-display.component';
import { HospitalReview, WebsiteReview } from '../../models/review.model';

@Component({
  selector: 'app-review-list',
  standalone: true,
  imports: [CommonModule, RatingDisplayComponent],
  templateUrl: './review-list.component.html',
  styleUrls: ['./review-list.component.css']
})
export class ReviewListComponent {
  @Input() reviews: (HospitalReview | WebsiteReview)[] = [];
  @Input() type: 'hospital' | 'website' = 'hospital';
  @Input() currentUserId?: number;
  @Input() loading: boolean = false;
  @Input() showPagination: boolean = true;
  @Input() totalPages: number = 1;
  @Input() currentPage: number = 1;

  @Output() editReview = new EventEmitter<any>();
  @Output() deleteReview = new EventEmitter<number>();
  @Output() pageChange = new EventEmitter<number>();

  canEditReview(review: any): boolean {
    return !!this.currentUserId && review.user_id === this.currentUserId;
  }

  onEditClick(review: any): void {
    this.editReview.emit(review);
  }

  onDeleteClick(reviewId: number): void {
    if (confirm('Are you sure you want to delete this review? This action cannot be undone.')) {
      this.deleteReview.emit(reviewId);
    }
  }

  onPageChange(page: number): void {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      this.pageChange.emit(page);
    }
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;

    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  getCategoryLabel(category: string): string {
    const labels: { [key: string]: string } = {
      'general': 'General',
      'ui_ux': 'UI/UX',
      'features': 'Features',
      'performance': 'Performance',
      'suggestion': 'Suggestion',
      'bug_report': 'Bug Report'
    };
    return labels[category] || category;
  }

  isHospitalReview(review: any): review is HospitalReview {
    return this.type === 'hospital';
  }

  isWebsiteReview(review: any): review is WebsiteReview {
    return this.type === 'website';
  }
}
