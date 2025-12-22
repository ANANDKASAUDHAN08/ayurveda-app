import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
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
    PasswordStrengthIndicatorComponent
  ],
  templateUrl: './user-landing.component.html'
})
export class UserLandingComponent implements OnInit {
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
  isPasswordFocused: boolean = false;

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
    // No OAuth handling needed - backend redirects to /home
  }

  signInWithGoogle() {
    // Redirect to backend OAuth endpoint
    window.location.href = 'http://localhost:3000/api/auth/google/user';
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

  onLoginSubmit() {
    if (this.loginForm.valid) {
      this.isLoading = true;
      this.authService.login(this.loginForm.value).subscribe({
        next: (res: any) => {
          this.isLoading = false;
          if (res.user && res.user.role === 'user') {
            this.snackbar.success('Login successful!');
            this.router.navigate(['/user/dashboard']);
          } else {
            this.snackbar.error('Access denied. This login is for Users only.');
            this.authService.logout();
          }
        },
        error: (err: any) => {
          this.isLoading = false;
          this.snackbar.error(err.error?.message || 'Login failed. Please check your credentials.');
        }
      });
    } else {
      this.loginForm.markAllAsTouched();
    }
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
        next: () => {
          this.isLoading = false;
          this.snackbar.success('Registration successful! Logging you in...');

          // Auto-login after registration
          this.authService.login({
            email: this.registerForm.get('email')?.value,
            password: this.registerForm.get('password')?.value
          }).subscribe({
            next: () => {
              this.router.navigate(['/user/find-doctors']);
            },
            error: () => {
              // Fallback if auto-login fails
              this.activeTab = 'login';
              this.loginForm.patchValue({
                email: this.registerForm.get('email')?.value
              });
            }
          });
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
}
