import { environment } from '@env/environment';
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { AuthService } from '../../shared/services/auth.service';
import { SnackbarService } from '../../shared/services/snackbar.service';
import { PasswordStrengthIndicatorComponent } from 'src/app/shared/components/password-strength-indicator/password-strength-indicator.component';

import { OnDestroy, OnInit } from '@angular/core';

@Component({
  selector: 'app-doctor-landing',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    FormsModule,
    HttpClientModule,
    PasswordStrengthIndicatorComponent
  ],
  templateUrl: './doctor-landing.component.html'
})
export class DoctorLandingComponent implements OnInit, OnDestroy {
  activeTab: 'login' | 'register' = 'login';
  loginForm: FormGroup;
  registerForm: FormGroup;
  isLoading = false;
  showLoginPassword = false;
  showRegisterPassword = false;
  isPasswordValid: boolean = false;
  isPasswordFocused: boolean = false;
  showEmailVerificationWarning = false;
  unverifiedEmail: string = '';

  // Forgot Password
  showForgotPasswordModal = false;
  forgotPasswordEmail = '';
  forgotPasswordSubmitting = false;
  private authSub: Subscription | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private http: HttpClient,
    private router: Router,
    private snackbar: SnackbarService
  ) {
    // Initialize login form
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });

    // Initialize register form
    this.registerForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit() {
    // Check if already logged in (for manual refresh or direct access)
    if (this.authService.isLoggedIn() && this.authService.getRole() === 'doctor') {
      this.router.navigate(['/doctor/dashboard']);
      return;
    }

    // Listen for auth status changes (for cross-tab sync)
    this.authSub = this.authService.authStatus$.subscribe(isLoggedIn => {
      if (isLoggedIn && this.authService.getRole() === 'doctor') {
        // Only redirect if we're not already in the middle of a 2FA flow in THIS tab
        if (!this.show2FAChallenge) {
          this.snackbar.success('Session detected. Redirecting...');
          this.router.navigate(['/doctor/dashboard']);
        }
      }
    });
  }

  ngOnDestroy() {
    if (this.authSub) {
      this.authSub.unsubscribe();
    }
  }

  switchTab(tab: 'login' | 'register') {
    this.activeTab = tab;
    // Reset forms when switching
    this.loginForm.reset();
    this.registerForm.reset();
  }

  clearField(form: FormGroup, fieldName: string) {
    form.get(fieldName)?.setValue('');
    form.get(fieldName)?.markAsUntouched();
  }

  signInWithGoogle(mode: 'login' | 'register' = 'login') {
    // Redirect to backend OAuth endpoint for doctors with mode
    window.location.href = environment.apiUrl + `/auth/google/doctor?mode=${mode}`;
  }

  toggleLoginPassword() {
    this.showLoginPassword = !this.showLoginPassword;
  }

  toggleRegisterPassword() {
    this.showRegisterPassword = !this.showRegisterPassword;
  }

  show2FAChallenge = false;
  twoFactorCode = '';
  pendingLoginData: any = null;

  onLoginSubmit() {
    if (this.loginForm.valid) {
      this.isLoading = true;
      this.authService.login(this.loginForm.value).subscribe({
        next: (res: any) => {
          this.isLoading = false;
          if (res.require2FA) {
            this.show2FAChallenge = true;
            this.pendingLoginData = { userId: res.userId, role: res.role };
            this.snackbar.info('Two-factor authentication required');
          } else if (res.user.role === 'doctor') {
            this.snackbar.success('Welcome back, Doctor!');
            this.router.navigate(['/doctor/dashboard']);
          } else {
            this.snackbar.error('Access denied. This login is for Doctors only.');
            this.authService.logout();
          }
        },
        error: (err) => {
          this.isLoading = false;
          // Check if error is due to unverified email
          if (err.status === 403 && err.error?.emailVerified === false) {
            this.showEmailVerificationWarning = true;
            this.unverifiedEmail = this.loginForm.get('email')?.value;
            this.snackbar.error('⚠️ Please verify your email before logging in. Check your inbox for the verification link.');
          } else {
            this.snackbar.error(err.error?.message || 'Login failed. Please check your credentials.');
          }
        }
      });
    } else {
      this.loginForm.markAllAsTouched();
    }
  }

  verify2FALogin() {
    if (!this.twoFactorCode || this.twoFactorCode.length !== 6) {
      this.snackbar.error('Please enter a 6-digit code');
      return;
    }

    this.isLoading = true;
    this.authService.verify2FALogin(this.pendingLoginData.userId, this.pendingLoginData.role, this.twoFactorCode).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        this.snackbar.success('2FA Verification successful!');
        this.router.navigate(['/doctor/dashboard']);
      },
      error: (err: any) => {
        this.isLoading = false;
        this.snackbar.error(err.error?.message || 'Invalid 2FA code');
      }
    });
  }

  onRegisterSubmit() {
    if (this.registerForm.valid) {
      this.isLoading = true;
      this.http.post<any>(environment.apiUrl + '/doctors/register', this.registerForm.value)
        .subscribe({
          next: (res) => {
            this.isLoading = false;
            this.snackbar.success('Registration successful! Please check your email to verify your account.');

            // Switch to login tab and pre-fill email
            this.switchTab('login');
            this.loginForm.patchValue({
              email: this.registerForm.value.email
            });
          },
          error: (err) => {
            this.isLoading = false;
            this.snackbar.error(err.error?.message || 'Registration failed');
          }
        });
    } else {
      this.registerForm.markAllAsTouched();
    }
  }

  onPasswordValidityChange(isValid: boolean): void {
    this.isPasswordValid = isValid;
  }

  dismissVerificationWarning() {
    this.showEmailVerificationWarning = false;
  }

  resendVerificationEmail() {
    if (!this.unverifiedEmail) return;

    this.authService.resendVerification(this.unverifiedEmail, 'doctor').subscribe({
      next: () => {
        this.snackbar.success('✅ Verification email sent! Please check your inbox.');
      },
      error: (err: any) => {
        this.snackbar.error(err.error?.message || 'Failed to send verification email.');
      }
    });
  }

  // Forgot Password Methods
  openForgotPasswordModal() {
    this.showForgotPasswordModal = true;
    this.forgotPasswordEmail = this.loginForm.get('email')?.value || '';
  }

  closeForgotPasswordModal() {
    this.showForgotPasswordModal = false;
    this.forgotPasswordEmail = '';
    this.forgotPasswordSubmitting = false;
  }

  submitForgotPassword() {
    if (!this.forgotPasswordEmail || !this.forgotPasswordEmail.includes('@')) {
      this.snackbar.error('Please enter a valid email address');
      return;
    }

    this.forgotPasswordSubmitting = true;
    this.authService.forgotPassword(this.forgotPasswordEmail, 'doctor').subscribe({
      next: (response) => {
        this.forgotPasswordSubmitting = false;
        this.snackbar.success(response.message || 'Password reset link sent to your email!');
        this.closeForgotPasswordModal();
      },
      error: (error) => {
        this.forgotPasswordSubmitting = false;
        this.snackbar.error(error.error?.message || 'Failed to send reset link');
      }
    });
  }
}
