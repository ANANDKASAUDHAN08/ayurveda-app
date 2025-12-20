import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';

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

    // Call backend verification API
    this.http.get<any>(`http://localhost:3000/api/verify-email/${token}?type=${type}`)
      .subscribe({
        next: (response) => {
          this.loading = false;
          this.success = response.success;
          this.message = response.message || 'Email verified successfully!';
        },
        error: (error) => {
          this.loading = false;
          this.success = false;
          this.message = error.error?.message || 'Verification failed. Please try again.';
        }
      });
  }

  goToLogin() {
    if (this.userType === 'doctor') {
      this.router.navigate(['/doctor-landing']);
    } else {
      this.router.navigate(['/user-landing']);
    }
  }
}
