import { environment } from '@env/environment';

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import * as maplibregl from 'maplibre-gl';

export interface Location {
    latitude: number;
    longitude: number;
}

@Injectable({
    providedIn: 'root'
})
export class MapService {
    private apiUrl = environment.apiUrl + '/nearby';

    constructor(private http: HttpClient) { }

    // Get user's current location from browser
    getCurrentLocation(): Promise<Location> {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject('Geolocation is not supported by your browser');
                return;
            }

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    resolve({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude
                    });
                },
                (error) => {
                    reject(error.message);
                },
                { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
            );
        });
    }

    // Nearby API Calls
    getNearbyHospitals(lat: number, lng: number, radius: number = 10, page: number = 1, limit: number = 20, state?: string, city?: string, pincode?: string, search?: string): Observable<any> {
        let params = new HttpParams()
            .set('lat', lat.toString())
            .set('lng', lng.toString())
            .set('radius', radius.toString())
            .set('page', page.toString())
            .set('limit', limit.toString());
        if (state) params = params.set('state', state);
        if (city) params = params.set('city', city);
        if (pincode) params = params.set('pincode', pincode);
        if (search) params = params.set('search', search);
        return this.http.get(`${this.apiUrl}/hospitals`, { params });
    }

    getNearbyPharmacies(lat: number, lng: number, radius: number = 5, page: number = 1, limit: number = 20, state?: string, city?: string, pincode?: string, search?: string): Observable<any> {
        let params = new HttpParams()
            .set('lat', lat.toString())
            .set('lng', lng.toString())
            .set('radius', radius.toString())
            .set('page', page.toString())
            .set('limit', limit.toString());
        if (state) params = params.set('state', state);
        if (city) params = params.set('city', city);
        if (pincode) params = params.set('pincode', pincode);
        if (search) params = params.set('search', search);
        return this.http.get(`${this.apiUrl}/pharmacies`, { params });
    }

    getNearbyDoctors(lat: number, lng: number, radius: number = 5, page: number = 1, limit: number = 20, state?: string, city?: string, pincode?: string, search?: string): Observable<any> {
        let params = new HttpParams()
            .set('lat', lat.toString())
            .set('lng', lng.toString())
            .set('radius', radius.toString())
            .set('page', page.toString())
            .set('limit', limit.toString());
        if (state) params = params.set('state', state);
        if (city) params = params.set('city', city);
        if (pincode) params = params.set('pincode', pincode);
        if (search) params = params.set('search', search);
        return this.http.get(`${this.apiUrl}/doctors`, { params });
    }

    getNearbyHealthCentres(lat?: number, lng?: number, radius: number = 15, district?: string, state?: string, subdistrict?: string, page: number = 1, limit: number = 20): Observable<any> {
        let params = new HttpParams()
            .set('radius', radius.toString())
            .set('page', page.toString())
            .set('limit', limit.toString());
        if (district) params = params.set('district', district);
        if (state) params = params.set('state', state);
        if (subdistrict) params = params.set('subdistrict', subdistrict);
        if (lat && lng) {
            params = params.set('lat', lat.toString()).set('lng', lng.toString());
        }
        return this.http.get(`${this.apiUrl}/health-centres`, { params });
    }

    searchDistricts(query: string): Observable<any> {
        const params = new HttpParams().set('query', query);
        return this.http.get(`${this.apiUrl}/search-districts`, { params });
    }

    getNearbyLaboratories(lat: number, lng: number, radius: number = 50, page: number = 1, limit: number = 20, city?: string, search?: string): Observable<any> {
        let params = new HttpParams()
            .set('lat', lat.toString())
            .set('lng', lng.toString())
            .set('radius', radius.toString())
            .set('page', page.toString())
            .set('limit', limit.toString());
        if (city) params = params.set('city', city);
        if (search) params = params.set('search', search);

        // API endpoint for private labs is /labs/nearby
        return this.http.get(`${environment.apiUrl}/labs/nearby`, { params });
    }

    // Distance calculation (Haversine)
    calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
        const R = 6371; // km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
}
