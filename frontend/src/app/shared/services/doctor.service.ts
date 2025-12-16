import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class DoctorService {
    private apiUrl = 'http://localhost:3000/api/doctors';
    private slotsUrl = 'http://localhost:3000/api/slots';

    constructor(private http: HttpClient) { }

    getDoctors(filters: any): Observable<any[]> {
        let params = new HttpParams();
        if (filters.specialization) params = params.set('specialization', filters.specialization);
        if (filters.mode) params = params.set('mode', filters.mode);
        if (filters.search) params = params.set('search', filters.search);

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
