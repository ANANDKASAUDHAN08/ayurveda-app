import { environment } from '@env/environment';

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class AdminService {
    private baseUrl = environment.apiUrl + '/admin';

    constructor(private http: HttpClient) { }

    // ==================== FEATURED DOCTORS ====================

    getFeaturedDoctors(): Observable<any> {
        return this.http.get(`${this.baseUrl}/featured-doctors`);
    }

    addFeaturedDoctor(data: any): Observable<any> {
        return this.http.post(`${this.baseUrl}/featured-doctors`, data);
    }

    updateFeaturedDoctor(id: number, data: any): Observable<any> {
        return this.http.put(`${this.baseUrl}/featured-doctors/${id}`, data);
    }

    deleteFeaturedDoctor(id: number): Observable<any> {
        return this.http.delete(`${this.baseUrl}/featured-doctors/${id}`);
    }

    // Get all doctors (for dropdown when adding featured doctor)
    getAllDoctors(): Observable<any> {
        return this.http.get(environment.apiUrl + '/doctors');
    }

    addDoctor(data: any): Observable<any> {
        return this.http.post(environment.apiUrl + '/admin/doctors', data);
    }

    updateDoctor(id: number, data: any): Observable<any> {
        return this.http.put(`${environment.apiUrl}/admin/doctors/${id}`, data);
    }

    deleteDoctor(id: number): Observable<any> {
        return this.http.delete(`${environment.apiUrl}/admin/doctors/${id}`);
    }

    // ==================== HEALTH ARTICLES ====================

    getHealthArticles(): Observable<any> {
        return this.http.get(`${this.baseUrl}/articles`);
    }

    addHealthArticle(data: any): Observable<any> {
        return this.http.post(`${this.baseUrl}/articles`, data);
    }

    updateHealthArticle(id: number, data: any): Observable<any> {
        return this.http.put(`${this.baseUrl}/articles/${id}`, data);
    }

    deleteHealthArticle(id: number): Observable<any> {
        return this.http.delete(`${this.baseUrl}/articles/${id}`);
    }

    // ==================== HOSPITALS ====================

    getHospitals(): Observable<any> {
        return this.http.get(`${this.baseUrl}/hospitals`);
    }

    addHospital(data: any): Observable<any> {
        return this.http.post(`${this.baseUrl}/hospitals`, data);
    }

    updateHospital(id: number, data: any): Observable<any> {
        return this.http.put(`${this.baseUrl}/hospitals/${id}`, data);
    }

    deleteHospital(id: number): Observable<any> {
        return this.http.delete(`${this.baseUrl}/hospitals/${id}`);
    }

    // ==================== PHARMACIES ====================

    getPharmacies(): Observable<any> {
        return this.http.get(`${this.baseUrl}/pharmacies`);
    }

    addPharmacy(data: any): Observable<any> {
        return this.http.post(`${this.baseUrl}/pharmacies`, data);
    }

    updatePharmacy(id: number, data: any): Observable<any> {
        return this.http.put(`${this.baseUrl}/pharmacies/${id}`, data);
    }

    deletePharmacy(id: number): Observable<any> {
        return this.http.delete(`${this.baseUrl}/pharmacies/${id}`);
    }

    // ==================== STATIC PAGES ====================

    getStaticPages(): Observable<any> {
        return this.http.get(`${this.baseUrl}/static-pages`);
    }

    updateStaticPage(id: number, data: any): Observable<any> {
        return this.http.put(`${this.baseUrl}/static-pages/${id}`, data);
    }
}
