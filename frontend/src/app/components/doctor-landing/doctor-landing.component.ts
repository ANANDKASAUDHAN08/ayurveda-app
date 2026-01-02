import { environment } from '@env/environment';

import { Component }
from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { AuthService } from '../../shared/services/auth.service';
import { SnackbarService } from '../../shared/services/snackbar.service';
import { PasswordStrengthIndicatorComponent } from 'src/app/shared/components/password-strength-indicator/password-strength-indicator.component';

@Component({
  selector: 'app-doctor-landing',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    HttpClientModule,
    PasswordStrengthIndicatorComponent
  ],
  templateUrl: './doctor-landing.component.html'
})
export class DoctorLandingComponent {
  activeTab: 'login' | 'register' = 'login';
  loginForm: FormGroup;
  registerForm: FormGroup;
  isLoading = false;
  showLoginPassword = false;
  showRegisterPassword = false;
  isPasswordValid: boolean = false;
  isPasswordFocused: boolean = false;

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
    // No OAuth handling needed - backend redirects to /home
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

  signInWithGoogle() {
    // Redirect to backend OAuth endpoint for doctors
    window.location.href = environment.apiUrl + '/auth/google/doctor';
  }

  toggleLoginPassword() {
    this.showLoginPassword = !this.showLoginPassword;
  }

  toggleRegisterPassword() {
    this.showRegisterPassword = !this.showRegisterPassword;
  }

  onLoginSubmit() {
    if (this.loginForm.valid) {
      this.isLoading = true;
      this.authService.login(this.loginForm.value).subscribe({
        next: (res) => {
          this.isLoading = false;
          if (res.user.role === 'doctor') {
            this.snackbar.success('Welcome back, Doctor!');
            this.router.navigate(['/doctor/dashboard']);
          } else {
            this.snackbar.error('Access denied. This login is for Doctors only.');
            this.authService.logout();
          }
        },
        error: (err) => {
          this.isLoading = false;
          this.snackbar.error(err.error?.message || 'Login failed. Please check your credentials.');
        }
      });
    } else {
      this.loginForm.markAllAsTouched();
    }
  }

  onRegisterSubmit() {
    if (this.registerForm.valid) {
      this.isLoading = true;
      this.http.post<any>(environment.apiUrl + '/doctors/register', this.registerForm.value)
        .subscribe({
          next: (res) => {
            this.isLoading = false;
            this.snackbar.success('Registration successful! Please configure your availability.');

            // Auto-login after registration
            this.authService.login({
              email: this.registerForm.value.email,
              password: this.registerForm.value.password
            }).subscribe({
              next: () => {
                this.router.navigate(['/doctor/dashboard']);
              },
              error: () => {
                this.switchTab('login');
              }
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
}
