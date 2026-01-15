import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';

export interface MorbidityCode {
    id: number;
    namc_id: number;
    namc_code: string;
    namc_term: string;
    namc_term_diacritical: string;
    namc_term_devanagari: string;
    short_definition: string;
    long_definition: string;
    ontology_branches: string;
}

export interface NAMCResponse {
    success: boolean;
    count?: number;
    results?: MorbidityCode[];
    total?: number;
    page?: number;
    limit?: number;
    data?: MorbidityCode[];
}

@Injectable({
    providedIn: 'root'
})
export class MorbidityService {
    private apiUrl = `${environment.apiUrl}/morbidity`;

    constructor(private http: HttpClient) { }

    searchCodes(query: string, limit: number = 20): Observable<NAMCResponse> {
        return this.http.get<NAMCResponse>(`${this.apiUrl}/search`, {
            params: { q: query, limit: limit.toString() }
        });
    }

    getCodeById(id: number | string): Observable<{ success: boolean; data: MorbidityCode }> {
        return this.http.get<{ success: boolean; data: MorbidityCode }>(`${this.apiUrl}/${id}`);
    }

    getAllCodes(page: number = 1, limit: number = 20): Observable<NAMCResponse> {
        return this.http.get<NAMCResponse>(this.apiUrl, {
            params: { page: page.toString(), limit: limit.toString() }
        });
    }
}
