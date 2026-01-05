import { environment } from '@env/environment';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';


@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  templateUrl: './verify-email.component.html',
  styleUrls: []
})
export class VerifyEmailComponent implements OnInit {
  loading = true;
  success = false;
  message = '';
  userType = 'user';
  private static verificationCache: Map<string, { success: boolean, message: string }> = new Map();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient
  ) { }

  ngOnInit() {
    // Get token and type from URL parameters
    const token = this.route.snapshot.queryParams['token'];
    const type = this.route.snapshot.queryParams['type'] || 'user';
    this.userType = type;

    if (!token) {
      this.loading = false;
      this.success = false;
      this.message = 'Invalid verification link. No token provided.';
      return;
    }

    // Check if we already verified this token (prevents re-verification on back button)
    const cacheKey = `${token}-${type}`;
    const cached = VerifyEmailComponent.verificationCache.get(cacheKey);

    if (cached) {
      // Use cached result
      this.loading = false;
      this.success = cached.success;
      this.message = cached.message;

      // Auto-redirect if successful
      if (this.success) {
        setTimeout(() => this.goToLogin(), 3000);
      }
      return;
    }

    // Call backend verification API
    this.http.get<any>(`${environment.apiUrl}/verify-email/${token}?type=${type}`)
      .subscribe({
        next: (response) => {
          this.loading = false;
          this.success = response.success;
          this.message = response.message || 'Email verified successfully!';

          // Cache the result
          VerifyEmailComponent.verificationCache.set(cacheKey, {
            success: this.success,
            message: this.message
          });

          // Auto-redirect to login after 3 seconds if successful
          if (this.success) {
            setTimeout(() => this.goToLogin(), 3000);
          }
        },
        error: (error) => {
          this.loading = false;
          this.success = false;
          this.message = error.error?.message || 'Verification failed. Please try again.';

          // Cache the error result too
          VerifyEmailComponent.verificationCache.set(cacheKey, {
            success: this.success,
            message: this.message
          });
        }
      });
  }

  goToLogin() {
    if (this.userType === 'doctor') {
      this.router.navigate(['/for-doctors']);
    } else {
      this.router.navigate(['/for-users']);
    }
  }
}
