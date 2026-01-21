import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-rating-display',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './rating-display.component.html',
  styleUrls: ['./rating-display.component.css']
})
export class RatingDisplayComponent {
  @Input() rating: number = 0;
  @Input() totalReviews: number = 0;
  @Input() size: 'small' | 'medium' | 'large' = 'medium';
  @Input() showCount: boolean = true;
  @Input() clickable: boolean = false;
  @Output() ratingClick = new EventEmitter<void>();

  get stars(): { filled: boolean; half: boolean }[] {
    const starsArray = [];
    const fullStars = Math.floor(this.rating);
    const hasHalfStar = this.rating % 1 >= 0.5;

    for (let i = 1; i <= 5; i++) {
      starsArray.push({
        filled: i <= fullStars,
        half: i === fullStars + 1 && hasHalfStar
      });
    }

    return starsArray;
  }

  onRatingClick(): void {
    if (this.clickable) {
      this.ratingClick.emit();
    }
  }
}
