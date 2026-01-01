import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { OfflineService } from './offline.service';

export interface EmergencyContact {
    id?: number;
    user_id?: number;
    name: string;
    relationship?: string;
    phone_number: string;
    is_primary?: boolean;
    priority_order?: number;
}

export interface MedicalInformation {
    blood_type?: string;
    allergies: string[];
    medical_conditions: string[];
    current_medications: string[];
    emergency_instructions?: string;
    primary_doctor_name?: string;
    primary_doctor_phone?: string;
    insurance_provider?: string;
    insurance_policy_number?: string;
}

export interface EmergencyCallLog {
    call_type: 'ambulance' | 'hospital' | 'contact';
    called_number: string;
    location_lat?: number;
    location_lng?: number;
}

@Injectable({
    providedIn: 'root'
})
export class EmergencyService {
    private apiUrl = `${environment.apiUrl}/emergency`;

    constructor(
        private http: HttpClient,
        private offlineService: OfflineService
    ) { }

    // Emergency Contacts
    getEmergencyContacts(): Observable<EmergencyContact[]> {
        // Try to fetch from network, cache on success, fallback to cache if offline
        if (!this.offlineService.checkOnline()) {
            const cached = this.offlineService.getCachedData('emergency_contacts');
            if (cached) {
                return of(cached);
            }
        }

        return this.http.get<EmergencyContact[]>(`${this.apiUrl}/contacts`).pipe(
            tap(contacts => {
                // Cache the successful response
                this.offlineService.cacheData('emergency_contacts', contacts);
            }),
            catchError(() => {
                // If network fails, try to return cached data
                const cached = this.offlineService.getCachedData('emergency_contacts');
                return of(cached || []);
            })
        );
    }

    addEmergencyContact(contact: EmergencyContact): Observable<any> {
        return this.http.post(`${this.apiUrl}/contacts`, contact);
    }

    updateEmergencyContact(id: number, contact: EmergencyContact): Observable<any> {
        return this.http.put(`${this.apiUrl}/contacts/${id}`, contact);
    }

    deleteEmergencyContact(id: number): Observable<any> {
        return this.http.delete(`${this.apiUrl}/contacts/${id}`);
    }

    // Batch update contacts order
    updateContactsOrder(contacts: EmergencyContact[]): Observable<any> {
        return this.http.put(`${this.apiUrl}/contacts/reorder`, { contacts });
    }

    // Medical Information
    getMedicalInfo(): Observable<any> {
        // Try to fetch from network, cache on success, fallback to cache if offline
        if (!this.offlineService.checkOnline()) {
            const cached = this.offlineService.getCachedData('medical_info');
            if (cached) {
                return of(cached);
            }
        }

        return this.http.get(`${this.apiUrl}/medical-info`).pipe(
            tap(medicalInfo => {
                // Cache the successful response
                this.offlineService.cacheData('medical_info', medicalInfo);
            }),
            catchError(() => {
                // If network fails, try to return cached data
                const cached = this.offlineService.getCachedData('medical_info');
                return of(cached || null);
            })
        );
    }

    updateMedicalInfo(medicalInfo: MedicalInformation): Observable<any> {
        return this.http.put(`${this.apiUrl}/medical-info`, medicalInfo);
    }

    deleteMedicalInfo(): Observable<any> {
        return this.http.delete(`${this.apiUrl}/medical-info`);
    }

    // Emergency Call Logging
    logEmergencyCall(callData: EmergencyCallLog): Observable<any> {
        return this.http.post(`${this.apiUrl}/log-call`, callData);
    }

    // Helper: Call emergency number
    callEmergencyNumber(number: string, location?: GeolocationCoordinates) {
        // Log the call (optional)
        if (location) {
            this.logEmergencyCall({
                call_type: 'ambulance',
                called_number: number,
                location_lat: location.latitude,
                location_lng: location.longitude
            }).subscribe({
                next: () => console.log('Emergency call logged'),
                error: (err) => console.error('Failed to log call:', err)
            });
        }

        // Initiate phone call
        window.location.href = `tel:${number}`;
    }

    // Helper: Get current location
    getCurrentLocation(): Promise<GeolocationCoordinates> {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation is not supported by your browser'));
                return;
            }

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    resolve(position.coords);
                },
                (error) => {
                    reject(error);
                },
                {
                    enableHighAccuracy: true,
                    timeout: 15000,
                    maximumAge: 0
                }
            );
        });
    }


    // Get emergency call history
    getCallHistory(limit: number = 50, offset: number = 0): Observable<any> {
        return this.http.get(`${this.apiUrl}/call-history`, {
            params: { limit: limit.toString(), offset: offset.toString() }
        });
    }
}
