import { environment } from '@env/environment';

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
export interface Article {
    id: number | string;
    title: string;
    category: string;
    content?: string;
    image?: string;
    author?: string;
    excerpt?: string;
    created_at?: string;
}

@Injectable({
    providedIn: 'root'
})
export class ContentService {
    private baseUrl = `${environment.apiUrl}/content`;

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
    getHospitals(params?: any, suffix: string = 'hospitals'): Observable<any> {
        return this.http.get(`${this.baseUrl}/${suffix}`, { params });
    }

    // Pharmacies
    getPharmacies(params?: any): Observable<any> {
        return this.http.get(`${this.baseUrl}/pharmacies`, { params });
    }

    // Static pages
    getStaticPage(slug: string): Observable<any> {
        return this.http.get(`${this.baseUrl}/page/${slug}`);
    }

    // Specialty Encyclopedia
    getSpecialtyEncyclopedia(): Observable<any> {
        return this.http.get(`${this.baseUrl}/specialty-encyclopedia`);
    }
}
