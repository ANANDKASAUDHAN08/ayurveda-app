import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface DoctorRefillFilters {
  status?: string;
  patient?: string;
  sortBy?: string;
  order?: string;
  limit?: number;
  offset?: number;
}

export interface DashboardStats {
  total: number;
  pending_count: number;
  approved_today: number;
  rejected_today: number;
  urgent_count: number;
}

export interface RefillResponse {
  refills: any[];
  total: number;
  pending_count: number;
  approved_today: number;
  rejected_today: number;
}

@Injectable({
  providedIn: 'root'
})
export class DoctorRefillService {
  private apiUrl = `${environment.apiUrl}/doctor`;

  constructor(private http: HttpClient) { }

  /**
   * Get all refills for the doctor with filters
   */
  getDoctorRefills(filters?: DoctorRefillFilters): Observable<RefillResponse> {
    let params = new HttpParams();

    if (filters) {
      if (filters.status) params = params.set('status', filters.status);
      if (filters.patient) params = params.set('patient', filters.patient);
      if (filters.sortBy) params = params.set('sortBy', filters.sortBy);
      if (filters.order) params = params.set('order', filters.order);
      if (filters.limit) params = params.set('limit', filters.limit.toString());
      if (filters.offset) params = params.set('offset', filters.offset.toString());
    }

    return this.http.get<RefillResponse>(`${this.apiUrl}/refills`, { params });
  }

  /**
   * Get detailed refill information with patient history
   */
  getRefillDetails(refillId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/refills/${refillId}/details`);
  }

  /**
   * Get dashboard statistics
   */
  getStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.apiUrl}/refills/stats`);
  }

  /**
   * Bulk approve refills
   */
  bulkApproveRefills(refillIds: number[], doctorNotes?: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/refills/bulk-approve`, {
      refill_ids: refillIds,
      doctor_notes: doctorNotes
    });
  }

  /**
   * Bulk reject refills
   */
  bulkRejectRefills(refillIds: number[], rejectionReason: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/refills/bulk-reject`, {
      refill_ids: refillIds,
      rejection_reason: rejectionReason
    });
  }

  /**
   * Single approve refill (using bulk with single ID)
   */
  approveRefill(refillId: number, doctorNotes?: string): Observable<any> {
    return this.bulkApproveRefills([refillId], doctorNotes);
  }

  /**
   * Single reject refill (using bulk with single ID)
   */
  rejectRefill(refillId: number, rejectionReason: string): Observable<any> {
    return this.bulkRejectRefills([refillId], rejectionReason);
  }
}
