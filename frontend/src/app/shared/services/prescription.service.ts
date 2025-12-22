import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Prescription {
    id: number;
    user_id: number;
    doctor_id?: number;
    doctor_name?: string;
    doctor_specialization?: string;
    appointment_id?: number;
    prescription_type: 'uploaded' | 'digital';
    upload_file_path?: string;
    issue_date: string;
    expiry_date?: string;
    status: 'pending' | 'verified' | 'active' | 'expired' | 'cancelled';
    notes?: string;
    medicine_count?: number;
    medicines?: PrescriptionMedicine[];
    created_at: string;
    updated_at: string;
}

export interface PrescriptionMedicine {
    id: number;
    prescription_id: number;
    medicine_name: string;
    dosage?: string;
    frequency?: string;
    duration?: string;
    quantity?: number;
    instructions?: string;
}

export interface PrescriptionRefill {
    id: number;
    prescription_id: number;
    requested_by: number;
    requested_date: string;
    status: 'pending' | 'approved' | 'rejected';
    approved_by?: number;
    approved_by_name?: string;
    approved_date?: string;
    rejection_reason?: string;
    notes?: string;
}


export interface ShareLinkData {
    recipient_email?: string;
    recipient_name?: string;
    recipient_type: 'pharmacy' | 'doctor' | 'family' | 'other';
    expiry_hours: number;
    send_email?: boolean;
}

export interface ShareLink {
    share_id: number;
    share_token: string;
    share_url: string;
    expires_at: string;
    recipient_type: string;
    access_count?: number;
    is_active?: boolean;
    email_sent?: boolean;
}


export interface SharedPrescription {
    prescription: Partial<Prescription>;
    medicines: PrescriptionMedicine[];
    shared_by: string;
    recipient_type: string;
    recipient_name?: string;
    expires_at: string;
    access_count: number;
}

@Injectable({
    providedIn: 'root'
})
export class PrescriptionService {
    private apiUrl = `${environment.apiUrl}/prescriptions`;

    constructor(private http: HttpClient) { }

    // Get all prescriptions
    getAllPrescriptions(filters?: { status?: string; type?: string; search?: string }): Observable<Prescription[]> {
        let params: any = {};
        if (filters) {
            if (filters.status) params.status = filters.status;
            if (filters.type) params.type = filters.type;
            if (filters.search) params.search = filters.search;
        }
        return this.http.get<Prescription[]>(this.apiUrl, { params });
    }

    // Get prescription by ID
    getPrescriptionById(id: number): Observable<Prescription> {
        return this.http.get<Prescription>(`${this.apiUrl}/${id}`);
    }

    // Upload prescription
    uploadPrescription(formData: FormData): Observable<any> {
        return this.http.post(`${this.apiUrl}/upload`, formData);
    }

    // Create digital prescription (doctor)
    createDigitalPrescription(data: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/digital`, data);
    }

    // Update prescription
    updatePrescription(id: number, data: Partial<Prescription>): Observable<any> {
        return this.http.put(`${this.apiUrl}/${id}`, data);
    }

    // Delete prescription
    deletePrescription(id: number): Observable<any> {
        return this.http.delete(`${this.apiUrl}/${id}`);
    }

    // Generate PDF
    generatePDF(prescriptionId: number): Observable<{ success: boolean; pdf_url: string; filename: string }> {
        return this.http.post<{ success: boolean; pdf_url: string; filename: string }>(
            `${this.apiUrl}/${prescriptionId}/generate-pdf`,
            {}
        );
    }

    // Download PDF directly
    downloadPDF(prescriptionId: number): void {
        window.open(`${environment.apiUrl}/prescriptions/${prescriptionId}/download-pdf`, '_blank');
    }

    // Get download history
    getDownloadHistory(prescriptionId: number): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/${prescriptionId}/download-history`);
    }

    // Create share link
    createShareLink(prescriptionId: number, data: ShareLinkData): Observable<ShareLink> {
        return this.http.post<ShareLink>(`${this.apiUrl}/${prescriptionId}/share`, data);
    }

    // Get shared prescription (public - no auth)
    getSharedPrescription(token: string): Observable<any> {
        return this.http.get<any>(`${environment.apiUrl}/share/rx/${token}`);
    }

    // Get user's shares for a prescription
    getUserShares(prescriptionId: number): Observable<ShareLink[]> {
        return this.http.get<ShareLink[]>(`${this.apiUrl}/${prescriptionId}/shares`);
    }

    // Revoke share
    revokeShare(shareId: number): Observable<any> {
        return this.http.delete(`${this.apiUrl}/shares/${shareId}`);
    }

    // Generate QR code for prescription
    generateQRCode(prescriptionId: number): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/${prescriptionId}/qrcode`, {});
    }

    // Verify prescription using verification code (public - no auth)
    verifyPrescription(verificationCode: string): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/verify/${verificationCode}`);
    }

    // Mark prescription as dispensed
    dispensePrescription(verificationCode: string, data: any): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/verify/${verificationCode}/dispense`, data);
    }

    // Get verification history
    getVerificationHistory(prescriptionId: number): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/${prescriptionId}/verification-history`);
    }

    // Helper: Check if prescription is expired
    isPrescriptionExpired(prescription: Prescription): boolean {
        if (!prescription.expiry_date) return false;
        const expiryDate = new Date(prescription.expiry_date);
        const today = new Date();
        return expiryDate < today;
    }

    // Helper: Get days until expiry
    getDaysUntilExpiry(prescription: Prescription): number {
        if (!prescription.expiry_date) return Infinity;
        const expiryDate = new Date(prescription.expiry_date);
        const today = new Date();
        const diffTime = expiryDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    }

    // Helper: Check if prescription is expiring soon (within 30 days)
    isExpiringSoon(prescription: Prescription): boolean {
        const daysLeft = this.getDaysUntilExpiry(prescription);
        return daysLeft > 0 && daysLeft <= 30;
    }

    // Helper: Get status badge color
    getStatusColor(status: string): string {
        const colors: { [key: string]: string } = {
            'pending': 'yellow',
            'verified': 'blue',
            'active': 'green',
            'expired': 'red',
            'cancelled': 'gray'
        };
        return colors[status] || 'gray';
    }

    // Request prescription refill
    requestRefill(prescriptionId: number, data: any): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/${prescriptionId}/refills`, data);
    }

    // Get all refill requests
    getRefills(params?: any): Observable<any[]> {
        return this.http.get<any[]>(`${environment.apiUrl}/refills`, { params });
    }

    // Get refill details
    getRefillById(refillId: number): Observable<any> {
        return this.http.get<any>(`${environment.apiUrl}/refills/${refillId}`);
    }

    // Get refill history
    getRefillHistory(prescriptionId: number): Observable<PrescriptionRefill[]> {
        return this.http.get<PrescriptionRefill[]>(`${this.apiUrl}/${prescriptionId}/refills`);
    }

    // Approve refill (Doctor)
    approveRefill(refillId: number, data: any): Observable<any> {
        return this.http.post<any>(`${environment.apiUrl}/refills/${refillId}/approve`, data);
    }

    // Reject refill (Doctor)
    rejectRefill(refillId: number, data: any): Observable<any> {
        return this.http.post<any>(`${environment.apiUrl}/refills/${refillId}/reject`, data);
    }
}

