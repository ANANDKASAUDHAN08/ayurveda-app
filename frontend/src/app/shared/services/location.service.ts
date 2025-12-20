import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface UserLocation {
    city: string;
    state: string;
    latitude: number;
    longitude: number;
}

@Injectable({
    providedIn: 'root'
})
export class LocationService {
    private locationSubject = new BehaviorSubject<UserLocation | null>(null);
    public location$ = this.locationSubject.asObservable();
    private http = inject(HttpClient);

    constructor() {
        // Load from localStorage on service init
        const stored = this.getStoredLocation();
        if (stored) {
            this.locationSubject.next(stored);
        }
    }

    detectLocation(): void {
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    this.reverseGeocode(position.coords.latitude, position.coords.longitude);
                },
                (error) => {
                    console.warn('Location detection failed:', error.message);
                    // Fallback to default location
                    this.setDefaultLocation();
                },
                {
                    enableHighAccuracy: false, // Changed to false for faster response
                    timeout: 30000, // Increased to 30 seconds
                    maximumAge: 300000 // Cache for 5 minutes
                }
            );
        } else {
            this.setDefaultLocation();
        }
    }

    private reverseGeocode(lat: number, lng: number): void {
        const coordsCity = `Loc: ${lat.toFixed(3)}, ${lng.toFixed(3)}`;

        // IMMEDIATELY set location with coordinates - works on mobile & desktop
        this.setLocation({
            city: coordsCity,
            state: '',
            latitude: lat,
            longitude: lng
        });

        // Try to upgrade to city name in background (desktop usually works)
        // Use timeout to avoid rate limiting
        setTimeout(() => {
            this.http.get<any>(
                `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
            ).subscribe({
                next: (data) => {
                    if (data && data.address) {
                        const city = data.address.city ||
                            data.address.town ||
                            data.address.village ||
                            data.address.state_district ||
                            coordsCity;

                        const state = data.address.state || '';

                        // Update with real city name if we got it
                        this.setLocation({
                            city,
                            state,
                            latitude: lat,
                            longitude: lng
                        });
                    }
                },
                error: () => {
                    // Keep the coordinates we already set - no problem!
                }
            });
        }, 500); // 500ms delay to avoid rate limiting
    }

    private setDefaultLocation(): void {
        this.setLocation({
            city: 'Delhi NCR',
            state: 'Delhi',
            latitude: 28.6139,
            longitude: 77.2090
        });
    }

    setLocation(location: UserLocation): void {
        this.locationSubject.next(location);
        localStorage.setItem('userLocation', JSON.stringify(location));
    }

    getStoredLocation(): UserLocation | null {
        const stored = localStorage.getItem('userLocation');
        return stored ? JSON.parse(stored) : null;
    }

    clearLocation(): void {
        this.locationSubject.next(null);
        localStorage.removeItem('userLocation');
    }

    getCurrentLocation(): UserLocation | null {
        return this.locationSubject.value;
    }
}
