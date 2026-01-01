import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { LocationService } from './location.service';


@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private apiUrl = 'http://localhost:3000/api/auth';
    private tokenKey = 'auth_token';

    // Auth state observable
    private authStatusSubject = new BehaviorSubject<boolean>(this.isLoggedIn());
    public authStatus$ = this.authStatusSubject.asObservable();

    constructor(
        private http: HttpClient,
        private locationService: LocationService
    ) {
        // Listen for storage changes (manual token clearing or cross-tab logout)
        if (typeof window !== 'undefined') {
            window.addEventListener('storage', (event) => {
                if (event.key === 'auth_token') {
                    const hasToken = !!event.newValue;
                    this.authStatusSubject.next(hasToken);
                }
            });
            // Check periodically if token was removed in current tab
            setInterval(() => {
                const hasToken = this.isLoggedIn();
                const currentAuthStatus = this.authStatusSubject.value;

                if (hasToken !== currentAuthStatus) {
                    this.authStatusSubject.next(hasToken);
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
                this.setSession(res);
                this.authStatusSubject.next(true);
                // Detect location on success
                this.locationService.detectLocation();
            })
        );
    }

    private setSession(authResult: any) {
        localStorage.setItem(this.tokenKey, authResult.token);
        localStorage.setItem('user', JSON.stringify(authResult.user));
    }

    logout() {
        localStorage.removeItem(this.tokenKey);
        localStorage.removeItem('user');
        this.authStatusSubject.next(false);
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
}
