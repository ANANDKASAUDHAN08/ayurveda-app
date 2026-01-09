import { Component, EventEmitter, Input, Output, OnInit, ViewChild, OnChanges, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { GoogleMapsModule, GoogleMap, MapMarker } from '@angular/google-maps';
import { UserLocation, LocationService } from '../../services/location.service';
import { HttpClient } from '@angular/common/http';
import { GoogleMapsLoaderService } from '../../services/google-maps-loader.service';

@Component({
    selector: 'app-location-map-modal',
    standalone: true,
    imports: [CommonModule, GoogleMapsModule, FormsModule],
    templateUrl: './location-map-modal.component.html',
    styleUrl: './location-map-modal.component.css'
})
export class LocationMapModalComponent implements OnInit, OnChanges {
    @Input() isOpen: boolean = false;
    @Input() initialLocation: UserLocation | null = null;
    @Output() locationSelected = new EventEmitter<UserLocation>();
    @Output() modalClosed = new EventEmitter<void>();

    @ViewChild(GoogleMap) map!: GoogleMap;

    center: google.maps.LatLngLiteral = { lat: 20.5937, lng: 78.9629 }; // India Center
    zoom = 5;
    markerPosition: google.maps.LatLngLiteral = { lat: 20.5937, lng: 78.9629 };
    markerOptions: google.maps.MarkerOptions = { draggable: true };
    mapOptions: google.maps.MapOptions = {
        mapTypeControl: true,
        fullscreenControl: true,
        streetViewControl: false,
        zoomControl: true
    };

    selectedAddress: string = 'Click on map to select location';
    hasLocation: boolean = false;
    isGeocoding: boolean = false;
    isDetectingLocation: boolean = false;

    // Search properties
    searchQuery: string = '';
    predictions: any[] = []; // Using any to avoid issues if types or namespace not yet ready
    apiLoaded: boolean = false;



    constructor(
        private locationService: LocationService,
        private http: HttpClient,
        private googleLoader: GoogleMapsLoaderService
    ) { }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['isOpen'] && changes['isOpen'].currentValue === true) {
            this.initializeMap();
        }
    }

    ngOnInit() {
        this.googleLoader.isLoaded$.subscribe(loaded => {
            this.apiLoaded = loaded;
        });

        if (this.isOpen) {
            this.initializeMap();
        }
    }

    private initializeMap() {
        if (this.initialLocation) {
            this.hasLocation = true;
            this.zoom = 15;
            this.center = {
                lat: this.initialLocation.latitude,
                lng: this.initialLocation.longitude
            };
            this.markerPosition = { ...this.center };
            this.reverseGeocode(this.center.lat, this.center.lng);
        } else {
            this.hasLocation = false;
            this.zoom = 5;
            this.center = { lat: 20.5937, lng: 78.9629 }; // India
            this.selectedAddress = 'Click on map to select location';

            // Auto-detect on open
            this.detectMyLocation();
        }
    }

    onMapClick(event: google.maps.MapMouseEvent) {
        if (event.latLng) {
            this.hasLocation = true;
            this.markerPosition = event.latLng.toJSON();
            this.reverseGeocode(this.markerPosition.lat, this.markerPosition.lng);
        }
    }

    onMarkerDragEnd(event: google.maps.MapMouseEvent) {
        if (event.latLng) {
            this.markerPosition = event.latLng.toJSON();
            this.reverseGeocode(this.markerPosition.lat, this.markerPosition.lng);
        }
    }

    detectMyLocation() {
        this.isDetectingLocation = true;
        this.locationService.getCoordinates().then(
            (position) => {
                this.hasLocation = true;
                this.zoom = 15;
                this.center = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                this.markerPosition = { ...this.center };
                this.reverseGeocode(this.center.lat, this.center.lng);
                this.isDetectingLocation = false;
            },
            (error) => {
                console.error('Error detecting location:', error);
                this.isDetectingLocation = false;
            }
        );
    }

    private reverseGeocode(lat: number, lng: number): void {
        this.isGeocoding = true;
        this.selectedAddress = 'Getting address...';

        this.locationService.getLocationFromCoordinates(lat, lng).subscribe({
            next: (location) => {
                this.selectedAddress = location.formattedAddress;
                this.isGeocoding = false;
            },
            error: () => {
                this.selectedAddress = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
                this.isGeocoding = false;
            }
        });
    }

    confirmLocation() {
        if (!this.hasLocation) return;

        // Use the standardized address from the service which is already in selectedAddress
        // We re-fetch details to ensure we emit the full UserLocation object structure
        const lat = this.markerPosition.lat;
        const lng = this.markerPosition.lng;

        this.locationService.getLocationFromCoordinates(lat, lng).subscribe(location => {
            this.locationSelected.emit(location);
            this.closeModal();
        });
    }

    closeModal() {
        this.modalClosed.emit();
        this.searchQuery = '';
        this.predictions = [];
    }

    clearSearch() {
        this.searchQuery = '';
        this.predictions = [];
    }

    onSearchInput() {
        if (this.searchQuery.length < 3) {
            this.predictions = [];
            return;
        }

        this.locationService.searchPlaces(this.searchQuery).subscribe(predictions => {
            this.predictions = predictions;
        });
    }

    selectPrediction(prediction: google.maps.places.AutocompletePrediction) {
        this.locationService.resolvePlaceId(prediction.place_id).subscribe({
            next: (location) => {
                // Update map
                this.zoom = 15;
                this.center = { lat: location.latitude, lng: location.longitude };
                this.markerPosition = { ...this.center };
                this.hasLocation = true;
                this.selectedAddress = location.formattedAddress;

                // Clear search
                this.searchQuery = '';
                this.predictions = [];
            },
            error: (err) => console.error('Error resolving place:', err)
        });
    }
}
