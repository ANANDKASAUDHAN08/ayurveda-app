import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { SnackbarService } from '../../services/snackbar.service';
import { SnackbarComponent } from '../../shared/components/snackbar/snackbar.component';

@Component({
    selector: 'app-admin-login',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule],
    templateUrl: './admin-login.component.html',
    styleUrl: './admin-login.component.css'
})
export class AdminLoginComponent {
    email: string = '';
    password: string = '';
    loading: boolean = false;
    showPassword: boolean = false;
    showConfirmPassword: boolean = false;
    errorMessage: string = '';

    // Validation flags
    isEmailValid: boolean = true;
    confirmPassword: string = '';
    isPasswordMatch: boolean = true;

    constructor(
        private authService: AuthService,
        private router: Router,
        private snackbarService: SnackbarService
    ) {
        // If already logged in as admin, redirect to dashboard
        const userStr = localStorage.getItem('user');
        if (userStr) {
            const user = JSON.parse(userStr);
            if (user.role === 'admin') {
                this.router.navigate(['/admin/dashboard']);
            }
        }
    }

    togglePassword() {
        this.showPassword = !this.showPassword;
    }

    toggleConfirmPassword() {
        this.showConfirmPassword = !this.showConfirmPassword;
    }

    clearEmail() {
        this.email = '';
        this.validateEmail();
    }

    clearPassword() {
        this.password = '';
        this.validateConfirmPassword(); // Re-validate match
    }

    validateEmail() {
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        this.isEmailValid = this.email === '' || emailRegex.test(this.email);
    }

    validateConfirmPassword() {
        this.isPasswordMatch = !this.confirmPassword || this.password === this.confirmPassword;
    }

    get isFormValid(): boolean {
        return !!this.email &&
            !!this.password &&
            this.isEmailValid &&
            (!this.confirmPassword || this.isPasswordMatch); // Only require confirm pass validity if entered
    }

    login() {
        this.errorMessage = '';
        this.validateEmail();
        this.validateConfirmPassword();

        if (!this.email || !this.password) {
            this.errorMessage = 'Please enter all required fields';
            return;
        }

        if (!this.isEmailValid) {
            this.errorMessage = 'Please enter a valid email address';
            return;
        }

        // Note: Confirm password check is unusual for login, but added as requested
        if (this.confirmPassword && !this.isPasswordMatch) {
            this.errorMessage = 'Passwords do not match';
            return;
        }

        this.loading = true;
        const credentials = { email: this.email, password: this.password };

        this.authService.login(credentials).subscribe({
            next: (response) => {
                // Check if user is admin
                if (response.user.role === 'admin') {
                    this.snackbarService.show('Welcome back, Admin!', 'success');
                    this.router.navigate(['/admin/dashboard']);
                } else {
                    this.snackbarService.show('Access denied. Admin rights required.', 'error');
                    localStorage.removeItem('user');
                    localStorage.removeItem('token');
                }
                this.loading = false;
            },
            error: (error) => {
                const msg = error.error?.message || 'Invalid credentials';
                this.errorMessage = msg;
                this.snackbarService.show(msg, 'error');
                this.loading = false;
            }
        });
    }
}
