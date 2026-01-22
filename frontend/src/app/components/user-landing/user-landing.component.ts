import { environment } from '@env/environment';
import { Component, OnInit, ElementRef, ViewChild, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { AuthService } from '../../shared/services/auth.service';
import { SnackbarService } from '../../shared/services/snackbar.service';
import { PasswordStrengthIndicatorComponent } from 'src/app/shared/components/password-strength-indicator/password-strength-indicator.component';

@Component({
  selector: 'app-user-landing',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    FormsModule,
    PasswordStrengthIndicatorComponent
  ],
  templateUrl: './user-landing.component.html'
})
export class UserLandingComponent implements OnInit, OnDestroy {
  @ViewChild('emailInput') emailInput!: ElementRef;
  @ViewChild('nameInput') nameInput!: ElementRef;

  activeTab: 'login' | 'register' = 'login';

  loginForm: FormGroup;
  registerForm: FormGroup;

  isLoading = false;
  showLoginPassword = false;
  showRegisterPassword = false;
  showConfirmPassword = false;
  isPasswordValid: boolean = false;
  showEmailVerificationWarning = false;
  unverifiedEmail: string = '';

  // Forgot Password
  showForgotPasswordModal = false;
  forgotPasswordEmail = '';
  forgotPasswordSubmitting = false;
  isPasswordFocused: boolean = false;
  private authSub: Subscription | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private snackbar: SnackbarService
  ) {
    // Login Form
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });

    // Register Form
    this.registerForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    }, { validator: this.passwordMatchValidator });
  }

  ngOnInit() {
    // Check if already logged in (for manual refresh or direct access)
    if (this.authService.isLoggedIn() && this.authService.getRole() === 'user') {
      this.router.navigate(['/user/dashboard']);
      return;
    }

    // Listen for auth status changes (for cross-tab sync)
    this.authSub = this.authService.authStatus$.subscribe(isLoggedIn => {
      if (isLoggedIn && this.authService.getRole() === 'user') {
        // Only redirect if we're not already in the middle of a 2FA flow in THIS tab
        // Or if we were, but now we're fully logged in elsewhere
        if (!this.show2FAChallenge) {
          this.snackbar.success('Session detected. Redirecting...');
          this.router.navigate(['/user/dashboard']);
        }
      }
    });
  }

  ngOnDestroy() {
    if (this.authSub) {
      this.authSub.unsubscribe();
    }
  }

  signInWithGoogle(mode: 'login' | 'register' = 'login') {
    // Redirect to backend OAuth endpoint with mode
    window.location.href = environment.apiUrl + `/auth/google/user?mode=${mode}`;
  }

  switchTab(tab: 'login' | 'register') {
    this.activeTab = tab;
    // Reset forms when switching
    this.loginForm.reset();
    this.registerForm.reset();
  }

  // --- Login Logic ---
  toggleLoginPassword() {
    this.showLoginPassword = !this.showLoginPassword;
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
          } else if (res.user && res.user.role === 'user') {
            this.snackbar.success('Login successful!');
            this.router.navigate(['/user/dashboard']);
          } else {
            this.snackbar.error('Access denied. This login is for Users only.');
            this.authService.logout();
          }
        },
        error: (err: any) => {
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
        this.router.navigate(['/user/dashboard']);
      },
      error: (err: any) => {
        this.isLoading = false;
        this.snackbar.error(err.error?.message || 'Invalid 2FA code');
      }
    });
  }

  // --- Register Logic ---
  passwordMatchValidator(g: FormGroup) {
    return g.get('password')?.value === g.get('confirmPassword')?.value
      ? null : { 'mismatch': true };
  }

  toggleRegisterPassword() {
    this.showRegisterPassword = !this.showRegisterPassword;
  }

  toggleConfirmPassword() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  onRegisterSubmit() {
    if (this.registerForm.valid) {
      this.isLoading = true;
      this.authService.register(this.registerForm.value).subscribe({
        next: (res: any) => {
          this.isLoading = false;

          // Show success message about email verification
          this.snackbar.success('Registration successful! Please check your email to verify your account.');

          // Switch to login tab and pre-fill email
          this.activeTab = 'login';
          this.loginForm.patchValue({
            email: this.registerForm.get('email')?.value
          });

          // Clear registration form
          this.registerForm.reset();
        },
        error: (err: any) => {
          this.isLoading = false;
          this.snackbar.error(err.error?.message || 'Registration failed. Please try again.');
        }
      });
    } else {
      this.registerForm.markAllAsTouched();
    }
  }

  // Helper
  clearField(form: FormGroup, fieldName: string) {
    form.get(fieldName)?.setValue('');
    form.get(fieldName)?.markAsUntouched();
  }

  onPasswordValidityChange(isValid: boolean): void {
    this.isPasswordValid = isValid;
  }

  dismissVerificationWarning() {
    this.showEmailVerificationWarning = false;
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
    this.authService.forgotPassword(this.forgotPasswordEmail, 'user').subscribe({
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

  resendVerificationEmail() {
    if (!this.unverifiedEmail) return;

    this.authService.resendVerification(this.unverifiedEmail, 'user').subscribe({
      next: () => {
        this.snackbar.success('✅ Verification email sent! Please check your inbox.');
      },
      error: (err: any) => {
        this.snackbar.error(err.error?.message || 'Failed to send verification email.');
      }
    });
  }
}
