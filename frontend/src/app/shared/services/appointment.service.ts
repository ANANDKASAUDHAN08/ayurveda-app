import { environment } from '@env/environment';

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

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
}
