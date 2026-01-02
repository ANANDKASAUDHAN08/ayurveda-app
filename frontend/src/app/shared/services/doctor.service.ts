import { environment } from '@env/environment';

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class DoctorService {
    private apiUrl = environment.apiUrl + '/doctors';
    private slotsUrl = environment.apiUrl + '/slots';

    constructor(private http: HttpClient) { }

    getDoctors(filters: any): Observable<any[]> {
        let params = new HttpParams();

        // NEW: Medicine type filter
        if (filters.medicine_type && filters.medicine_type !== 'all') {
            params = params.set('medicine_type', filters.medicine_type);
        }

        if (filters.specialization) {
            if (Array.isArray(filters.specialization)) {
                filters.specialization.forEach((spec: string) => {
                    params = params.append('specialization', spec);
                });
            } else {
                params = params.set('specialization', filters.specialization);
            }
        }

        if (filters.mode && filters.mode !== 'both') params = params.set('mode', filters.mode);
        if (filters.search) params = params.set('search', filters.search);
        if (filters.maxFee) params = params.set('maxFee', filters.maxFee.toString());
        if (filters.minExperience) params = params.set('minExperience', filters.minExperience.toString());

        return this.http.get<any[]>(this.apiUrl, { params });
    }

    getDoctorById(id: number): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/${id}`);
    }

    getSlots(doctorId: number, date?: string): Observable<any[]> {
        let params = new HttpParams().set('doctorId', doctorId);
        if (date) params = params.set('date', date);
        return this.http.get<any[]>(this.slotsUrl, { params });
    }

    lockSlot(slotId: number): Observable<any> {
        return this.http.post(`${this.slotsUrl}/lock`, { slotId });
    }
}
