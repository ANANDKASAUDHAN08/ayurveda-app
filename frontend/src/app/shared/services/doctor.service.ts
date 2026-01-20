import { environment } from '@env/environment';

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

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
        if (filters.gender) params = params.set('gender', filters.gender);

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

    // =============================================
    // Video Consultancy Methods
    // =============================================

    /**
     * Get available time slots for a specific doctor on a specific date
     * @param doctorId - Doctor ID
     * @param date - Date in YYYY-MM-DD format
     */
    getAvailableSlots(doctorId: number, date: string): Observable<any[]> {
        return this.http.get<any>(`${this.apiUrl}/${doctorId}/available-slots`, {
            params: { date }
        }).pipe(
            map((res: any) => res.success ? res.data : [])
        );
    }

    /**
     * Get doctor reviews with pagination
     * @param doctorId - Doctor ID
     * @param page - Page number
     * @param limit - Items per page
     */
    getDoctorReviews(doctorId: number, page: number = 1, limit: number = 10): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/${doctorId}/reviews`, {
            params: {
                page: page.toString(),
                limit: limit.toString()
            }
        });
    }

    /**
     * Get list of specializations for filter dropdown
     */
    getSpecializations(): Observable<string[]> {
        return this.http.get<any>(`${this.apiUrl}/filters/specializations`).pipe(
            map((res: any) => res.success ? res.data : [])
        );
    }

    /**
     * Get list of locations for filter dropdown
     */
    getLocations(): Observable<string[]> {
        return this.http.get<any>(`${this.apiUrl}/filters/locations`).pipe(
            map((res: any) => res.success ? res.data : [])
        );
    }

    /**
     * Check if doctor is available for instant consultation
     * Based on current time and availability schedule
     */
    isOnlineNow(doctorId: number): Observable<boolean> {
        const today = new Date().toISOString().split('T')[0];
        return this.getAvailableSlots(doctorId, today).pipe(
            map(slots => {
                if (!slots || slots.length === 0) return false;

                // Check if any slot is within the next 10 minutes
                const now = new Date();
                const currentTime = now.getHours() * 60 + now.getMinutes();

                return slots.some(slot => {
                    const [hours, minutes] = slot.start_time.split(':').map(Number);
                    const slotTime = hours * 60 + minutes;
                    const diff = slotTime - currentTime;

                    // Available if slot starts within next 10 minutes or already started
                    return diff >= -10 && diff <= 10;
                });
            })
        );
    }

    getDoctorSuggestions(query: string): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/suggestions`, {
            params: { q: query }
        });
    }
}
