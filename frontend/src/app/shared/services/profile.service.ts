import { environment } from '@env/environment';

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class ProfileService {
    private userApiUrl = environment.apiUrl + '/users';
    private doctorApiUrl = environment.apiUrl + '/doctors';

    constructor(private http: HttpClient) { }

    // --- Generic Helpers ---
    private getBaseUrl(isDoctor: boolean): string {
        return isDoctor ? this.doctorApiUrl : this.userApiUrl;
    }

    // --- Profile Operations ---

    getProfile(isDoctor: boolean): Observable<any> {
        const url = isDoctor ? this.doctorApiUrl : `${this.userApiUrl}/profile`;
        // Note: Doctor profile fetch in component was fetching ALL doctors and finding by ID.
        // Ideally, backend should support /api/doctors/profile for the logged-in doctor.
        // For now, I will mirror the component's logic or provide the specific endpoint if it exists.
        // Looking at component: 
        // User: ${environment.apiUrl}/users/profile
        // Doctor: ${environment.apiUrl}/doctors (and then filter)
        return this.http.get<any>(url);
    }

    updateProfile(isDoctor: boolean, data: FormData): Observable<any> {
        const url = `${this.getBaseUrl(isDoctor)}/profile`;
        return this.http.put(url, data);
    }

    // --- Account Security ---

    changePassword(isDoctor: boolean, newPassword: string): Observable<any> {
        const url = `${this.getBaseUrl(isDoctor)}/change-password`;
        return this.http.put(url, { newPassword });
    }

    enable2FA(isDoctor: boolean): Observable<any> {
        const url = `${this.getBaseUrl(isDoctor)}/enable-2fa`;
        return this.http.put(url, {});
    }

    deleteAccount(isDoctor: boolean): Observable<any> {
        const url = `${this.getBaseUrl(isDoctor)}/profile`;
        return this.http.delete(url);
    }
}
