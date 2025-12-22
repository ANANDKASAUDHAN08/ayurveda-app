import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Hospital {
  id: number;
  name: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  phone: string;
  emergency_phone?: string;
  type: 'government' | 'private';
  has_emergency: boolean;
  has_ambulance: boolean;
  has_icu: boolean;
  beds_available: number;
  rating: number;
  distance?: number; // Added by frontend after API call
}

@Injectable({
  providedIn: 'root'
})
export class HospitalsService {
  private apiUrl = 'http://localhost:3000/api/hospitals';

  constructor(private http: HttpClient) { }

  getNearbyHospitals(lat: number, lng: number, radius: number = 10, type?: 'government' | 'private'): Observable<{ count: number, hospitals: Hospital[] }> {
    let url = `${this.apiUrl}/nearby?lat=${lat}&lng=${lng}&radius=${radius}`;
    if (type) {
      url += `&type=${type}`;
    }
    return this.http.get<{ count: number, hospitals: Hospital[] }>(url);
  }

  getHospital(id: number): Observable<Hospital> {
    return this.http.get<Hospital>(`${this.apiUrl}/${id}`);
  }

  getAllHospitals(filters?: { type?: string, city?: string }): Observable<Hospital[]> {
    let url = this.apiUrl;
    const params = new URLSearchParams();
    if (filters?.type) params.append('type', filters.type);
    if (filters?.city) params.append('city', filters.city);
    const queryString = params.toString();
    if (queryString) url += `?${queryString}`;
    return this.http.get<Hospital[]>(url);
  }
}
