import { environment } from '@env/environment';

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface LabTest {
    id: number;
    name: string;
    category: string;
    price: number;
    discounted_price: number;
    description: string;
    includes: string;
    parameters_count: number;
    is_popular: boolean;
    sample_type: string;
    fasting_required: boolean;
    report_time: string;
}

@Injectable({
    providedIn: 'root'
})
export class LabTestService {
    private apiUrl = environment.apiUrl + '/lab-tests';

    constructor(private http: HttpClient) { }

    getLabTests(filters: any): Observable<any> {
        let params = new HttpParams();

        if (filters.category && filters.category !== 'All') params = params.set('category', filters.category);
        if (filters.search) params = params.set('search', filters.search);
        if (filters.minPrice) params = params.set('minPrice', filters.minPrice.toString());
        if (filters.maxPrice) params = params.set('maxPrice', filters.maxPrice.toString());
        if (filters.sortBy) params = params.set('sortBy', filters.sortBy);
        if (filters.page) params = params.set('page', filters.page.toString());
        if (filters.limit) params = params.set('limit', filters.limit.toString());
        return this.http.get<any>(this.apiUrl, { params });
    }

    getLabTestById(id: number): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/${id}`);
    }
}
