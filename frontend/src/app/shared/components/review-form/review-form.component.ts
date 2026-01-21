import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { RatingInputComponent } from '../rating-input/rating-input.component';

@Component({
  selector: 'app-review-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RatingInputComponent],
  templateUrl: './review-form.component.html',
  styleUrls: ['./review-form.component.css']
})
export class ReviewFormComponent implements OnInit {
  @Input() type: 'hospital' | 'website' = 'hospital';
  @Input() initialData?: any; // For editing existing reviews
  @Input() showAspects: boolean = false; // For hospital reviews
  @Input() showCategory: boolean = false; // For website reviews

  @Output() submitReview = new EventEmitter<any>();
  @Output() cancel = new EventEmitter<void>();

  reviewForm!: FormGroup;
  isSubmitting: boolean = false;

  // Website review categories
  categories = [
    { value: 'general', label: 'General Feedback' },
    { value: 'ui_ux', label: 'UI/UX' },
    { value: 'features', label: 'Features' },
    { value: 'performance', label: 'Performance' },
    { value: 'suggestion', label: 'Suggestion' },
    { value: 'bug_report', label: 'Bug Report' }
  ];

  constructor(private fb: FormBuilder) { }

  ngOnInit(): void {
    this.initializeForm();
  }

  initializeForm(): void {
    const formConfig: any = {
      rating: [this.initialData?.rating || 0, [Validators.required, Validators.min(1), Validators.max(5)]],
      title: [this.initialData?.title || ''],
      comment: [this.initialData?.comment || '', [Validators.required, Validators.minLength(10)]]
    };

    // Add hospital-specific fields
    if (this.type === 'hospital' && this.showAspects) {
      formConfig.aspects = this.fb.group({
        cleanliness: [this.initialData?.aspects?.cleanliness || 0],
        staff: [this.initialData?.aspects?.staff || 0],
        facilities: [this.initialData?.aspects?.facilities || 0],
        waiting_time: [this.initialData?.aspects?.waiting_time || 0]
      });
    }

    // Add website-specific fields
    if (this.type === 'website' && this.showCategory) {
      formConfig.category = [this.initialData?.category || 'general', Validators.required];
    }

    this.reviewForm = this.fb.group(formConfig);
  }

  onSubmit(): void {
    if (this.reviewForm.valid) {
      this.isSubmitting = true;
      const formValue = this.reviewForm.value;

      // Clean up aspects if all are 0
      if (formValue.aspects) {
        const hasAnyAspect = Object.values(formValue.aspects).some((val: any) => (val as number) > 0);
        if (!hasAnyAspect) {
          delete formValue.aspects;
        }
      }

      this.submitReview.emit(formValue);
    } else {
      // Mark all fields as touched to show validation errors
      Object.keys(this.reviewForm.controls).forEach(key => {
        this.reviewForm.get(key)?.markAsTouched();
      });
    }
  }

  onCancel(): void {
    this.cancel.emit();
  }

  resetSubmitting(): void {
    this.isSubmitting = false;
  }

  get rating() { return this.reviewForm.get('rating'); }
  get title() { return this.reviewForm.get('title'); }
  get comment() { return this.reviewForm.get('comment'); }
  get category() { return this.reviewForm.get('category'); }
  get aspects() { return this.reviewForm.get('aspects'); }
}
