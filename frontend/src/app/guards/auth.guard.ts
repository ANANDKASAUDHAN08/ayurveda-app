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
        // Get user role before any potential redirect
        const user = authService.getUser();
        const userRole = user?.role || 'user';

        // Show alert message
        snackbarService.show('Token is expired, please login again');

        // Redirect to appropriate login page based on role
        const loginPath = userRole === 'doctor' ? '/for-doctors' : '/for-users';
        router.navigate([loginPath]);
        return false;
    }
};
