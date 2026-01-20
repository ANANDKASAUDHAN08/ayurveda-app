import { environment } from '@env/environment';

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface TimeSlot {
    id: number;
    slot_date: string;
    start_time: string;
    end_time: string;
    is_booked: boolean;
}

export interface Appointment {
    id: number;
    doctor_id: number;
    user_id: number;
    slot_id: number;
    slot_date?: string;
    appointment_date: string;
    start_time: string;
    end_time: string;
    status: string;
    notes?: string;
    created_at?: string;
    doctor_name?: string;
    specialty?: string;
    clinic_name?: string;
    clinic_address?: string;
    doctor_phone?: string;
}

export interface DateException {
    id?: number;
    exception_date?: string;
    date?: string;
    is_available?: boolean;
    isAvailable?: boolean;
    start_time?: string | null;
    startTime?: string | null;
    end_time?: string | null;
    endTime?: string | null;
    slot_duration?: number;
    slotDuration?: number;
}

@Injectable({
    providedIn: 'root'
})
export class AppointmentService {
    private apiUrl = environment.apiUrl;

    constructor(private http: HttpClient) { }

    //Get available slots for a doctor on a specific date
    getAvailableSlots(doctorId: number, date: string): Observable<TimeSlot[]> {
        return this.http.get<TimeSlot[]>(`${this.apiUrl}/doctors/${doctorId}/slots?date=${date}`);
    }

    // Get slots for a date range (for calendar indicators)
    getSlotsByDateRange(doctorId: number, startDate: string, endDate: string): Observable<TimeSlot[]> {
        return this.http.get<TimeSlot[]>(`${this.apiUrl}/doctors/${doctorId}/slots/range?startDate=${startDate}&endDate=${endDate}`);
    }

    // Book an appointment (new endpoint)
    bookAppointment(slotId: number, notes?: string): Observable<any> {
        return this.http.post(`${this.apiUrl}/appointments/book`, { slotId, notes });
    }

    // Legacy booking (keep for compatibility)
    bookAppointmentLegacy(bookingData: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/appointments`, bookingData);
    }

    // Get user's appointments
    getMyAppointments(): Observable<Appointment[]> {
        return this.http.get<Appointment[]>(`${this.apiUrl}/appointments/user`);
    }

    // Get doctor's appointments
    getDoctorAppointments(): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/appointments/doctor`);
    }

    // Cancel an appointment
    cancelAppointment(appointmentId: number): Observable<any> {
        return this.http.put(`${this.apiUrl}/appointments/${appointmentId}/cancel`, {});
    }

    // Get doctor's availability
    getDoctorAvailability(doctorId: number): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/doctors/${doctorId}/availability`);
    }

    // Set doctor availability (for doctor registration)
    setDoctorAvailability(availability: any[], generateDays: number = 30): Observable<any> {
        return this.http.post(`${this.apiUrl}/doctors/availability`, { availability, generateDays });
    }

    // Date Exception Management
    setDateExceptions(exceptions: DateException[]): Observable<any> {
        const payload = exceptions.map(ex => ({
            date: ex.exception_date || ex.date,
            isAvailable: ex.is_available ?? ex.isAvailable ?? false,
            startTime: ex.start_time || ex.startTime || null,
            endTime: ex.end_time || ex.endTime || null,
            slotDuration: ex.slot_duration || ex.slotDuration || 30
        }));
        return this.http.post(`${this.apiUrl}/doctors/availability/exceptions`, { exceptions: payload });
    }

    getMyDateExceptions(): Observable<DateException[]> {
        return this.http.get<DateException[]>(`${this.apiUrl}/doctors/my-availability/exceptions`);
    }

    getDateExceptions(doctorId: number): Observable<DateException[]> {
        return this.http.get<DateException[]>(`${this.apiUrl}/doctors/${doctorId}/availability/exceptions`);
    }

    deleteDateException(date: string): Observable<any> {
        return this.http.delete(`${this.apiUrl}/doctors/availability/exceptions/${date}`);
    }

    // =============================================
    // Video Consultancy Methods
    // =============================================

    /**
     * Create Razorpay payment order for consultation
     * @param doctor_id - Doctor ID
     * @param amount - Consultation fee amount
     */
    createPaymentOrder(doctor_id: number, amount: number): Observable<any> {
        return this.http.post(`${this.apiUrl}/video-consultancy/payment/create-order`, {
            doctor_id,
            amount
        });
    }

    /**
     * Book video consultation appointment
     * @param appointmentData - Complete appointment data including payment details
     */
    bookVideoConsultation(appointmentData: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/video-consultancy/appointments/book`, appointmentData);
    }

    /**
     * Get user's video consultation appointments
     * @param filters - Optional filters (type: upcoming/past, status, page, limit)
     */
    getMyVideoAppointments(filters?: any): Observable<any> {
        let params = new HttpParams();
        if (filters?.type) params = params.set('type', filters.type);
        if (filters?.status) params = params.set('status', filters.status);
        if (filters?.page) params = params.set('page', filters.page.toString());
        if (filters?.limit) params = params.set('limit', filters.limit.toString());

        return this.http.get(`${this.apiUrl}/video-consultancy/appointments`, { params });
    }

    /**
     * Get single video appointment details
     * @param appointmentId - Appointment ID
     */
    getVideoAppointmentById(appointmentId: number): Observable<any> {
        return this.http.get(`${this.apiUrl}/video-consultancy/appointments/${appointmentId}`);
    }

    /**
     * Cancel video consultation appointment  
     * @param appointmentId - Appointment ID
     * @param reason - Cancellation reason
     */
    cancelVideoAppointment(appointmentId: number, reason: string): Observable<any> {
        return this.http.put(
            `${this.apiUrl}/video-consultancy/appointments/${appointmentId}/cancel`,
            { reason }
        );
    }

    /**
     * Add review after consultation
     * @param appointmentId - Appointment ID
     * @param doctorId - Doctor ID
     * @param rating - Rating (1-5)
     * @param review - Review text
     */
    addReview(appointmentId: number, doctorId: number, rating: number, review: string): Observable<any> {
        return this.http.post(`${this.apiUrl}/video-consultancy/reviews`, {
            appointment_id: appointmentId,
            doctor_id: doctorId,
            rating,
            review
        });
    }

    /**
     * Check if user is first-time (for free consultation)
     */
    isFirstTimeUser(): Observable<boolean> {
        return this.getMyVideoAppointments({ limit: 1 }).pipe(
            map((res: any) => res.pagination && res.pagination.total === 0)
        );
    }
}
