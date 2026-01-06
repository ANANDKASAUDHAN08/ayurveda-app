import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { SnackbarService } from './snackbar.service';

export interface UserLocation {
    city: string;
    state: string;
    displayName: string;
    formattedAddress: string;
    latitude: number;
    longitude: number;
    isEstimated?: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class LocationService {
    private locationSubject = new BehaviorSubject<UserLocation | null>(null);
    public location$ = this.locationSubject.asObservable();

    // UI Interaction Subjects
    private openMapSubject = new BehaviorSubject<boolean>(false);
    public openMap$ = this.openMapSubject.asObservable();

    private dropdownOpenSubject = new BehaviorSubject<boolean>(false);
    public dropdownOpen$ = this.dropdownOpenSubject.asObservable();

    private isDetectingSubject = new BehaviorSubject<boolean>(false);
    public isDetecting$ = this.isDetectingSubject.asObservable();

    private sheetOpenSubject = new BehaviorSubject<boolean>(false);
    public sheetOpen$ = this.sheetOpenSubject.asObservable();

    private http = inject(HttpClient);
    private snackbar = inject(SnackbarService);

    constructor() {
        // Load from localStorage on service init
        const stored = this.getStoredLocation();
        if (stored) {
            this.locationSubject.next(stored);
        }
    }

    detectLocation(useGoogle: boolean = false): void {
        this.isDetectingSubject.next(true);
        this.getCoordinates().then(
            (position) => {
                this.reverseGeocode(position.coords.latitude, position.coords.longitude, useGoogle);
                this.isDetectingSubject.next(false);
            },
            (errorMsg) => {
                this.isDetectingSubject.next(false);
                this.snackbar.show(errorMsg, 'error');
                this.setDefaultLocation();
            }
        );
    }

    public getCoordinates(): Promise<GeolocationPosition> {
        return new Promise((resolve, reject) => {
            if (!('geolocation' in navigator)) {
                reject('Geolocation is not supported by your browser');
                return;
            }

            navigator.geolocation.getCurrentPosition(
                (position) => resolve(position),
                (error) => {
                    let msg = 'Could not detect location';
                    if (error.code === error.PERMISSION_DENIED) {
                        msg = 'Location access denied. Please allow it in settings.';
                    } else if (error.code === error.POSITION_UNAVAILABLE) {
                        msg = 'Location information is unavailable.';
                    } else if (error.code === error.TIMEOUT) {
                        msg = 'Location request timed out.';
                    }
                    reject(msg);
                },
                {
                    enableHighAccuracy: true,
                    timeout: 20000,
                    maximumAge: 0
                }
            );
        });
    }

    public getLocationFromCoordinates(lat: number, lng: number): Observable<UserLocation> {
        const coordsCity = `Loc: ${lat.toFixed(3)}, ${lng.toFixed(3)}`;

        return this.http.get<any>(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
        ).pipe(
            map(data => {
                if (data) {
                    const address = data.address || {};
                    const city = address.city || address.town || address.village || address.state_district || address.county || coordsCity;
                    const state = address.state || '';
                    const displayName = data.display_name || city;
                    const formattedAddress = data.display_name || city;

                    return {
                        city,
                        state,
                        displayName,
                        formattedAddress,
                        latitude: lat,
                        longitude: lng
                    };
                }
                throw new Error('No data found');
            }),
            catchError(() => {
                // Return basic coordinates location if lookup fails
                return of({
                    city: coordsCity,
                    state: '',
                    displayName: coordsCity,
                    formattedAddress: coordsCity,
                    latitude: lat,
                    longitude: lng
                });
            })
        );
    }

    public getLocationFromCoordinatesGoogle(lat: number, lng: number): Observable<UserLocation> {
        return new Observable<UserLocation>(observer => {
            const geocoder = new google.maps.Geocoder();
            geocoder.geocode({ location: { lat, lng } }, (results, status) => {
                const coordsCity = `Loc: ${lat.toFixed(3)}, ${lng.toFixed(3)}`;

                if (status === 'OK' && results && results[0]) {
                    const result = results[0];
                    const components = result.address_components;

                    // Extract city (locality) or fallbacks
                    const cityComp = components.find(c => c.types.includes('locality')) ||
                        components.find(c => c.types.includes('administrative_area_level_2')) ||
                        components.find(c => c.types.includes('sublocality'));

                    const stateComp = components.find(c => c.types.includes('administrative_area_level_1'));

                    const city = cityComp ? cityComp.long_name : coordsCity;
                    const state = stateComp ? stateComp.long_name : '';

                    observer.next({
                        city,
                        state,
                        displayName: result.formatted_address,
                        formattedAddress: result.formatted_address,
                        latitude: lat,
                        longitude: lng
                    });
                } else {
                    // Fallback if geocoding fails
                    observer.next({
                        city: coordsCity,
                        state: '',
                        displayName: coordsCity,
                        formattedAddress: coordsCity,
                        latitude: lat,
                        longitude: lng
                    });
                }
                observer.complete();
            });
        });
    }

    private reverseGeocode(lat: number, lng: number, useGoogle: boolean = false): void {
        const coordsCity = `Loc: ${lat.toFixed(3)}, ${lng.toFixed(3)}`;

        // IMMEDIATELY set location with coordinates for feedback
        this.setLocation({
            city: coordsCity,
            state: '',
            displayName: 'Getting address...',
            formattedAddress: 'Getting address...',
            latitude: lat,
            longitude: lng,
            isEstimated: true // Initial detection is always considered estimated
        }, true);

        // Upgrade to city name
        setTimeout(() => {
            const observable = useGoogle
                ? this.getLocationFromCoordinatesGoogle(lat, lng)
                : this.getLocationFromCoordinates(lat, lng);

            observable.subscribe({
                next: (location) => {
                    location.isEstimated = true; // Still marked as estimated if came from auto-detect
                    this.setLocation(location, true); // Save detected location
                }
            });
        }, 500);
    }

    private setDefaultLocation(): void {
        // No longer auto-setting a default location on error to keep it blank as requested
        this.isDetectingSubject.next(false);
    }

    setLocation(location: UserLocation, save: boolean = false): void {
        // If location is manually selected (e.g. from search or popular cities), mark it as NOT estimated
        if (!save && !location.isEstimated) {
            // Internal call might not set it, but if it comes from a UI component manual action, 
            // the component should ideally set isEstimated: false
        }

        this.locationSubject.next(location);

        if (save) {
            localStorage.setItem('userLocation', JSON.stringify(location));
        }
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

    // UI Methods
    toggleMap(open: boolean): void {
        this.openMapSubject.next(open);
    }

    toggleBottomSheet(open: boolean): void {
        this.sheetOpenSubject.next(open);
    }

    // Search Methods
    searchPlaces(query: string): Observable<google.maps.places.AutocompletePrediction[]> {
        return new Observable(observer => {
            if (!query || query.length < 3) {
                observer.next([]);
                observer.complete();
                return;
            }

            const autocompleteService = new google.maps.places.AutocompleteService();
            autocompleteService.getPlacePredictions(
                { input: query, componentRestrictions: { country: 'in' } },
                (predictions, status) => {
                    if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
                        observer.next(predictions);
                    } else {
                        observer.next([]);
                    }
                    observer.complete();
                }
            );
        });
    }

    resolvePlaceId(placeId: string, useGoogle: boolean = false): Observable<UserLocation> {
        return new Observable<google.maps.GeocoderResult>(observer => {
            const geocoder = new google.maps.Geocoder();
            geocoder.geocode({ placeId: placeId }, (results, status) => {
                if (status === 'OK' && results && results[0]) {
                    observer.next(results[0]);
                    observer.complete();
                } else {
                    observer.error('Could not resolve place details');
                }
            });
        }).pipe(
            map(result => {
                const loc = result.geometry.location;
                return { lat: loc.lat(), lng: loc.lng() };
            }),
            // Chain to our standardized lookup (Google for mobile, OSM for desktop)
            switchMap(coords => {
                if (useGoogle) {
                    return this.getLocationFromCoordinatesGoogle(coords.lat, coords.lng);
                }
                return this.getLocationFromCoordinates(coords.lat, coords.lng);
            })
        );
    }
}

