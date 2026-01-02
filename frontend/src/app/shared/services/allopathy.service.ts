import { environment } from '@env/environment';

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
@Injectable({
    providedIn: 'root'
})
export class AllopathyService {
    private apiUrl = `${environment.apiUrl}/allopathy`;

    constructor(private http: HttpClient) { }

    getDashboardStats(): Observable<any> {
        return this.http.get(`${this.apiUrl}/stats`);
    }

    getMedicalRecords(type?: string): Observable<any> {
        const params: any = {};
        if (type && type !== 'all') {
            params.type = type;
        }
        return this.http.get(`${this.apiUrl}/records`, { params });
    }

    getDiagnosticPackages(): Observable<any> {
        return this.http.get(`${this.apiUrl}/diagnostic/packages`);
    }

    getPharmacyOverview(): Observable<any> {
        return this.http.get(`${this.apiUrl}/pharmacy/overview`);
    }

    getPrinciplesContent(): Observable<any> {
        return this.http.get(`${this.apiUrl}/principles`);
    }

    // Reuse existing lab tests API for single tests
    getLabTests(params: any): Observable<any> {
        return this.http.get(`${environment.apiUrl}/lab-tests`, { params });
    }
}
