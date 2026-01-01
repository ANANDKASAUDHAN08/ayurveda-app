import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../shared/services/auth.service';
import { SnackbarService } from '../shared/services/snackbar.service';

export const authGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);
    const snackbarService = inject(SnackbarService);

    if (authService.isLoggedIn()) {
        const requiredRole = route.data['role'];
        if (requiredRole) {
            const currentRole = authService.getRole();
            if (currentRole !== requiredRole) {
                // Role mismatch: Auto-logout and redirect
                authService.logout();
                const loginPath = requiredRole === 'doctor' ? '/for-doctors' : '/for-users';
                router.navigate([loginPath]);
                return false;
            }
        }
        return true;
    } else {
        // Only show token expired message if user actually had a token before
        const token = localStorage.getItem('auth_token');

        if (token) {
            // User had a token but it's expired/invalid
            const user = authService.getUser();
            const userRole = user?.role || 'user';

            snackbarService.show('Token is expired, please login again');

            const loginPath = userRole === 'doctor' ? '/for-doctors' : '/for-users';
            router.navigate([loginPath]);
        } else {
            // No token at all - just redirect silently for guest users
            router.navigate(['/for-users']);
        }

        return false;
    }
};
