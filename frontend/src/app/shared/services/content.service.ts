import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class ContentService {
    private baseUrl = 'http://localhost:3000/api/content';

    constructor(private http: HttpClient) { }

    // Featured doctors for home page
    getFeaturedDoctors(): Observable<any> {
        return this.http.get(`${this.baseUrl}/featured-doctors`);
    }

    // Health articles for home page
    getHealthArticles(): Observable<any> {
        return this.http.get(`${this.baseUrl}/health-articles`);
    }

    // Get single article
    getArticleById(id: number): Observable<any> {
        return this.http.get(`${this.baseUrl}/health-articles/${id}`);
    }

    // Hospitals
    getHospitals(params?: any): Observable<any> {
        return this.http.get(`${this.baseUrl}/hospitals`, { params });
    }

    // Pharmacies
    getPharmacies(params?: any): Observable<any> {
        return this.http.get(`${this.baseUrl}/pharmacies`, { params });
    }

    // Static pages
    getStaticPage(slug: string): Observable<any> {
        return this.http.get(`${this.baseUrl}/page/${slug}`);
    }
}
