import { Component, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-rating-input',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './rating-input.component.html',
  styleUrls: ['./rating-input.component.css'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => RatingInputComponent),
      multi: true
    }
  ]
})
export class RatingInputComponent implements ControlValueAccessor {
  rating: number = 0;
  hoverRating: number = 0;
  readonly: boolean = false;
  stars: number[] = [1, 2, 3, 4, 5];

  private onChange: (value: number) => void = () => { };
  private onTouched: () => void = () => { };

  // Hover over star
  onStarHover(star: number): void {
    if (!this.readonly) {
      this.hoverRating = star;
    }
  }

  // Leave star hover
  onStarLeave(): void {
    this.hoverRating = 0;
  }

  // Click on star
  onStarClick(star: number): void {
    if (!this.readonly) {
      this.rating = star;
      this.onChange(this.rating);
      this.onTouched();
    }
  }

  // Get star state (filled, half, empty)
  getStarClass(star: number): string {
    const currentRating = this.hoverRating || this.rating;

    if (star <= currentRating) {
      return 'filled';
    }
    return 'empty';
  }

  // ControlValueAccessor implementation
  writeValue(value: number): void {
    this.rating = value || 0;
  }

  registerOnChange(fn: (value: number) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.readonly = isDisabled;
  }
}
