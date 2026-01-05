import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { SnackbarService } from './shared/services/snackbar.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const token = localStorage.getItem('auth_token');
    const router = inject(Router);
    const snackbarService = inject(SnackbarService);

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
                // Only handle this if user actually HAD a token
                const currentToken = localStorage.getItem('auth_token');

                // URLs that are expected to return 401 when not logged in
                const ignoredUrls = ['/cart', '/notifications'];
                const shouldIgnore = ignoredUrls.some(url => req.url.includes(url));

                if (currentToken && !shouldIgnore) {
                    // User was logged in but token is now expired/invalid
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

                    // Determine redirect path BEFORE clearing data
                    const loginPath = userRole === 'doctor' ? '/for-doctors' : '/for-users';

                    // Clear authentication data
                    localStorage.removeItem('auth_token');
                    localStorage.removeItem('user');

                    // Show error message
                    snackbarService.show('Token is expired, please login again', 'error');

                    // Navigate after alert is dismissed
                    router.navigate([loginPath]);
                }
            }

            // Re-throw the error for other handlers
            return throwError(() => error);
        })
    );
};
