import { environment } from '@env/environment';

import { Injectable, NgZone } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { LocationService } from './location.service';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private apiUrl = `${environment.apiUrl}/auth`;
    private tokenKey = 'auth_token';

    // Auth state observable
    private authStatusSubject = new BehaviorSubject<boolean>(this.isLoggedIn());
    public authStatus$ = this.authStatusSubject.asObservable();

    constructor(
        private http: HttpClient,
        private locationService: LocationService,
        private ngZone: NgZone
    ) {
        // Listen for storage changes (manual token clearing or cross-tab logout)
        if (typeof window !== 'undefined') {
            window.addEventListener('storage', (event) => {
                if (event.key === 'auth_token' || event.key === 'user') {
                    this.ngZone.run(() => {
                        const hasToken = this.isLoggedIn();
                        this.authStatusSubject.next(hasToken);
                    });
                }
            });
            // Check periodically if token was removed in current tab
            setInterval(() => {
                const hasToken = this.isLoggedIn();
                const currentAuthStatus = this.authStatusSubject.value;

                if (hasToken !== currentAuthStatus) {
                    this.ngZone.run(() => {
                        this.authStatusSubject.next(hasToken);
                    });
                }
            }, 2000); // Check every 2 seconds
        }
    }

    register(user: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/register`, user).pipe(
            tap((res: any) => {
                this.setSession(res);
                this.authStatusSubject.next(true);
            })
        );
    }

    login(credentials: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/login`, credentials).pipe(
            tap((res: any) => {
                if (res.token) {
                    this.setSession(res);
                    this.authStatusSubject.next(true);
                    // Detect location on success
                    this.locationService.detectLocation();
                }
            })
        );
    }

    private setSession(authResult: any) {
        // Set user first so role is available when auth_token triggers storage event in other tabs
        localStorage.setItem('user', JSON.stringify(authResult.user));
        localStorage.setItem(this.tokenKey, authResult.token);
    }

    logout() {
        localStorage.removeItem(this.tokenKey);
        localStorage.removeItem('user');
        this.authStatusSubject.next(false);
    }

    resendVerification(email: string, userType: 'user' | 'doctor'): Observable<any> {
        const endpoint = userType === 'doctor' ? '/doctors/resend-verification' : '/users/resend-verification';
        return this.http.post(`${environment.apiUrl}${endpoint}`, { email });
    }

    // Forgot Password - Request password reset
    forgotPassword(email: string, userType: 'user' | 'doctor'): Observable<any> {
        const endpoint = userType === 'doctor' ? '/doctors/forgot-password' : '/auth/forgot-password';
        return this.http.post(`${environment.apiUrl}${endpoint}`, { email });
    }

    // Reset Password - Update password with token
    resetPassword(token: string, newPassword: string, userType: 'user' | 'doctor'): Observable<any> {
        const endpoint = userType === 'doctor' ? '/doctors/reset-password' : '/auth/reset-password';
        return this.http.post(`${environment.apiUrl}${endpoint}`, { token, newPassword });
    }

    // Verify Reset Token - Check if token is valid
    verifyResetToken(token: string, userType: 'user' | 'doctor'): Observable<any> {
        const endpoint = userType === 'doctor' ? `/doctors/verify-reset-token/${token}` : `/auth/verify-reset-token/${token}`;
        return this.http.get(`${environment.apiUrl}${endpoint}`);
    }

    getToken(): string | null {
        return localStorage.getItem(this.tokenKey);
    }

    isLoggedIn(): boolean {
        return !!this.getToken();
    }

    getUser(): any {
        const userStr = localStorage.getItem('user');
        try {
            return userStr ? JSON.parse(userStr) : null;
        } catch (e) {
            return null;
        }
    }

    getRole(): string {
        const user = this.getUser();
        return user ? user.role : '';
    }

    // 2FA Methods
    setup2FA(): Observable<any> {
        return this.http.get(`${environment.apiUrl}/auth/2fa/setup`);
    }

    verify2FASetup(code: string): Observable<any> {
        return this.http.post(`${environment.apiUrl}/auth/2fa/verify-setup`, { code });
    }

    disable2FA(): Observable<any> {
        return this.http.post(`${environment.apiUrl}/auth/2fa/disable`, {});
    }

    verify2FALogin(userId: number, role: string, code: string): Observable<any> {
        return this.http.post(`${environment.apiUrl}/auth/2fa/verify-login`, { userId, role, code }).pipe(
            tap((res: any) => {
                this.setSession(res);
                this.authStatusSubject.next(true);
                // Detect location on success
                this.locationService.detectLocation();
            })
        );
    }
}
