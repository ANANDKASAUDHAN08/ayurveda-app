import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { SnackbarService } from './shared/services/snackbar.service';
import { AuthService } from './shared/services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const token = localStorage.getItem('auth_token');
    const router = inject(Router);
    const snackbarService = inject(SnackbarService);
    const authService = inject(AuthService);

    // Clone request with auth header if token exists
    const cloned = token ? req.clone({
        setHeaders: {
            Authorization: `Bearer ${token}`
        }
    }) : req;

    // Handle the request and catch errors
    return next(cloned).pipe(
        catchError((error: HttpErrorResponse) => {
            // Check if it's a 401 Unauthorized error
            if (error.status === 401) {
                const currentToken = localStorage.getItem('auth_token');

                if (currentToken) {
                    // Check if we already showed the session expired alert recently
                    // to prevent spam if multiple requests fail at once
                    const now = Date.now();
                    const lastAlert = (window as any)._lastSessionAlert || 0;

                    if (now - lastAlert > 5000) { // 5 second debounce
                        (window as any)._lastSessionAlert = now;

                        const userStr = localStorage.getItem('user');
                        let userRole = 'user';

                        try {
                            if (userStr) {
                                const user = JSON.parse(userStr);
                                userRole = user.role || 'user';
                            }
                        } catch (e) {
                            console.error('Error parsing user data:', e);
                        }

                        const loginPath = userRole === 'doctor' ? '/for-doctors' : '/for-users';

                        // Clear authentication data properly
                        authService.logout();

                        // Show error message
                        snackbarService.show('Session expired. Please login again.', 'error');

                        // Navigate to login
                        router.navigate([loginPath]);
                    }
                }
            }

            // Re-throw the error for other handlers
            return throwError(() => error);
        })
    );
};
