import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../shared/services/auth.service';
import { SnackbarService } from '../../shared/services/snackbar.service';

@Component({
    selector: 'app-reset-password',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './reset-password.component.html',
    styleUrls: []
})
export class ResetPasswordComponent implements OnInit {
    resetForm: FormGroup;
    loading = true;
    submitting = false;
    tokenValid = false;
    token = '';
    userType: 'user' | 'doctor' = 'user';
    message = '';
    userName = '';

    passwordVisible = false;
    confirmPasswordVisible = false;

    constructor(
        private fb: FormBuilder,
        private route: ActivatedRoute,
        private router: Router,
        private authService: AuthService,
        private snackbar: SnackbarService
    ) {
        this.resetForm = this.fb.group({
            newPassword: ['', [Validators.required, Validators.minLength(6)]],
            confirmPassword: ['', [Validators.required]]
        }, { validators: this.passwordMatchValidator });
    }

    ngOnInit() {
        // Get token and type from URL
        this.token = this.route.snapshot.queryParams['token'] || '';
        this.userType = this.route.snapshot.queryParams['type'] || 'user';

        if (!this.token) {
            this.loading = false;
            this.tokenValid = false;
            this.message = 'Invalid password reset link. No token provided.';
            return;
        }

        // Verify token
        this.authService.verifyResetToken(this.token, this.userType).subscribe({
            next: (response) => {
                this.loading = false;
                this.tokenValid = response.valid;
                if (response.valid) {
                    this.userName = response.user?.name || '';
                } else {
                    this.message = response.message || 'Invalid or expired token';
                }
            },
            error: (error) => {
                this.loading = false;
                this.tokenValid = false;
                this.message = error.error?.message || 'Failed to verify token';
            }
        });
    }

    passwordMatchValidator(group: FormGroup) {
        const password = group.get('newPassword')?.value;
        const confirmPassword = group.get('confirmPassword')?.value;
        return password === confirmPassword ? null : { passwordMismatch: true };
    }

    togglePasswordVisibility() {
        this.passwordVisible = !this.passwordVisible;
    }

    toggleConfirmPasswordVisibility() {
        this.confirmPasswordVisible = !this.confirmPasswordVisible;
    }

    onSubmit() {
        if (this.resetForm.invalid) {
            this.resetForm.markAllAsTouched();
            return;
        }

        this.submitting = true;
        const newPassword = this.resetForm.get('newPassword')?.value;

        this.authService.resetPassword(this.token, newPassword, this.userType).subscribe({
            next: (response) => {
                this.submitting = false;
                this.snackbar.success(response.message || 'Password reset successful!');

                // Redirect to appropriate login page
                setTimeout(() => {
                    const loginPath = this.userType === 'doctor' ? '/for-doctors' : '/for-users';
                    this.router.navigate([loginPath]);
                }, 2000);
            },
            error: (error) => {
                this.submitting = false;
                this.snackbar.error(error.error?.message || 'Failed to reset password');
            }
        });
    }

    goToLogin() {
        const loginPath = this.userType === 'doctor' ? '/for-doctors' : '/for-users';
        this.router.navigate([loginPath]);
    }

    get newPassword() {
        return this.resetForm.get('newPassword');
    }

    get confirmPassword() {
        return this.resetForm.get('confirmPassword');
    }

    get passwordStrength(): string {
        const password = this.newPassword?.value || '';
        if (password.length === 0) return '';
        if (password.length < 6) return 'weak';
        if (password.length < 10) return 'medium';
        return 'strong';
    }
}
