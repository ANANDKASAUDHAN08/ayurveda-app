import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';

@Injectable({
    providedIn: 'root'
})
export class VideoSessionService {
    private apiUrl = environment.apiUrl + '/video-consultancy';

    constructor(private http: HttpClient) { }

    /**
     * Get or create video session for appointment
     * @param appointmentId - Appointment ID
     */
    getVideoSession(appointmentId: number): Observable<any> {
        return this.http.get(`${this.apiUrl}/video-session/${appointmentId}`);
    }

    /**
     * Start video call
     * @param appointmentId - Appointment ID
     */
    startVideoCall(appointmentId: number): Observable<any> {
        return this.http.post(`${this.apiUrl}/video-session/${appointmentId}/start`, {});
    }

    /**
     * End video call
     * @param appointmentId - Appointment ID
     */
    endVideoCall(appointmentId: number): Observable<any> {
        return this.http.post(`${this.apiUrl}/video-session/${appointmentId}/start`, {});
    }

    /**
     * Get session status
     * @param appointmentId - Appointment ID
     */
    getSessionStatus(appointmentId: number): Observable<any> {
        return this.http.get(`${this.apiUrl}/video-session/${appointmentId}/status`);
    }

    /**
     * Save recording URL
     * @param appointmentId - Appointment ID
     * @param recordingUrl - URL of the recording
     */
    saveRecording(appointmentId: number, recordingUrl: string): Observable<any> {
        return this.http.post(`${this.apiUrl}/video-session/${appointmentId}/recording`, {
            recording_url: recordingUrl
        });
    }
}
