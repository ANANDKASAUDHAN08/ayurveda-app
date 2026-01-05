import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NewsletterService } from '../../services/newsletter.service';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.css']
})
export class FooterComponent {
  currentYear = new Date().getFullYear();
  newsletterEmail: string = '';
  newsletterMessage: string = '';
  newsletterSuccess: boolean = false;
  isSubmitting: boolean = false;

  constructor(
    private router: Router,
    private newsletterService: NewsletterService
  ) { }

  isAdminRoute(): boolean {
    return this.router.url.startsWith('/admin');
  }

  onNewsletterSubmit(): void {
    if (!this.newsletterEmail || !this.isValidEmail(this.newsletterEmail)) {
      this.newsletterMessage = 'Please enter a valid email address.';
      this.newsletterSuccess = false;
      return;
    }

    // Prevent multiple submissions
    if (this.isSubmitting) {
      return;
    }

    this.isSubmitting = true;
    this.newsletterMessage = '';

    this.newsletterService.subscribe(this.newsletterEmail).subscribe({
      next: (response) => {
        this.newsletterMessage = response.message;
        this.newsletterSuccess = true;
        this.newsletterEmail = '';
        this.isSubmitting = false;

        // Clear message after 5 seconds
        setTimeout(() => {
          this.newsletterMessage = '';
        }, 5000);
      },
      error: (error) => {
        this.newsletterMessage = error.error?.message || 'An error occurred. Please try again later.';
        this.newsletterSuccess = false;
        this.isSubmitting = false;

        // Clear message after 5 seconds
        setTimeout(() => {
          this.newsletterMessage = '';
        }, 5000);
      }
    });
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
