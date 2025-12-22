import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DoctorPrescriptionService {
  private apiUrl = `${environment.apiUrl}/doctor/prescriptions`;

  constructor(private http: HttpClient) { }

  // Get unverified prescriptions with filters
  getUnverifiedPrescriptions(filters: any = {}): Observable<any> {
    let params = new HttpParams();

    if (filters.status) params = params.set('status', filters.status);
    if (filters.patient) params = params.set('patient', filters.patient);
    if (filters.limit) params = params.set('limit', filters.limit.toString());
    if (filters.offset) params = params.set('offset', filters.offset.toString());

    return this.http.get(`${this.apiUrl}/unverified`, { params });
  }

  // Get prescription details for verification
  getPrescriptionDetails(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}/verify-details`);
  }

  // Verify prescription
  verifyPrescription(id: number, notes?: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/verify`, {
      verification_notes: notes
    });
  }

  // Reject prescription verification
  rejectVerification(id: number, reason: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/reject-verification`, {
      rejection_reason: reason
    });
  }
}
