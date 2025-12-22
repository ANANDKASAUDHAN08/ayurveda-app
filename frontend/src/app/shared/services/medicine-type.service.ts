import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

export interface MedicineType {
    id: number;
    name: string;
    description: string;
    icon: string;
    color: string;
    is_active: boolean;
}

export interface MedicineTypeStats {
    id: number;
    name: string;
    color: string;
    icon: string;
    doctor_count: number;
    consultation_count: number;
    avg_rating: number;
}

@Injectable({
    providedIn: 'root'
})
export class MedicineTypeService {
    private apiUrl = 'http://localhost:3000/api/medicine-types';

    // Active medicine type (stored in BehaviorSubject for reactivity)
    private activeMedicineTypeSubject = new BehaviorSubject<number | null>(null);
    public activeMedicineType$ = this.activeMedicineTypeSubject.asObservable();

    constructor(private http: HttpClient) {
        // Load from localStorage on init
        const stored = localStorage.getItem('activeMedicineType');
        if (stored) {
            this.activeMedicineTypeSubject.next(parseInt(stored));
        }
    }

    /**
     * Get all medicine types
     */
    getAllMedicineTypes(): Observable<{ success: boolean; data: MedicineType[] }> {
        return this.http.get<{ success: boolean; data: MedicineType[] }>(this.apiUrl);
    }

    /**
     * Get medicine type by ID
     */
    getMedicineTypeById(id: number): Observable<{ success: boolean; data: MedicineType }> {
        return this.http.get<{ success: boolean; data: MedicineType }>(`${this.apiUrl}/${id}`);
    }

    /**
     * Get doctors filtered by medicine type
     */
    getDoctorsByMedicineType(
        medicineTypeId: number,
        filters?: { city?: string; specialization?: string; available?: boolean }
    ): Observable<any> {
        let url = `${this.apiUrl}/${medicineTypeId}/doctors`;
        const params = new URLSearchParams();

        if (filters?.city) {
            params.append('city', filters.city);
        }
        if (filters?.specialization) {
            params.append('specialization', filters.specialization);
        }
        if (filters?.available !== undefined) {
            params.append('available', filters.available.toString());
        }

        if (params.toString()) {
            url += `?${params.toString()}`;
        }

        return this.http.get(url);
    }

    /**
     * Get statistics for all medicine types
     */
    getMedicineTypeStats(): Observable<{ success: boolean; data: MedicineTypeStats[] }> {
        return this.http.get<{ success: boolean; data: MedicineTypeStats[] }>(`${this.apiUrl}/stats`);
    }

    /**
     * Set active medicine type
     */
    setActiveMedicineType(typeId: number | null): void {
        this.activeMedicineTypeSubject.next(typeId);
        if (typeId) {
            localStorage.setItem('activeMedicineType', typeId.toString());
        } else {
            localStorage.removeItem('activeMedicineType');
        }
    }

    /**
     * Get current active medicine type (synchronous)
     */
    getActiveMedicineType(): number | null {
        return this.activeMedicineTypeSubject.value;
    }

    /**
     * Clear active medicine type filter
     */
    clearFilter(): void {
        this.setActiveMedicineType(null);
    }

    /**
     * Filter doctors array by medicine type
     */
    filterDoctorsByType(doctors: any[], typeId: number | null): any[] {
        if (!typeId) {
            return doctors; // No filter, return all
        }
        return doctors.filter(doctor => doctor.medicine_type_id === typeId);
    }
}
