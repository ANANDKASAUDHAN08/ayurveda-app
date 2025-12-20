import { Component, EventEmitter, Input, Output, AfterViewInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as maplibregl from 'maplibre-gl';
import { UserLocation, LocationService } from '../../services/location.service';
import { HttpClient } from '@angular/common/http';

@Component({
    selector: 'app-location-map-modal',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './location-map-modal.component.html',
    styleUrl: './location-map-modal.component.css'
})
export class LocationMapModalComponent implements AfterViewInit, OnChanges {
    @Input() isOpen: boolean = false;
    @Input() initialLocation: UserLocation | null = null;
    @Output() locationSelected = new EventEmitter<UserLocation>();
    @Output() modalClosed = new EventEmitter<void>();

    private map?: maplibregl.Map;
    private marker?: maplibregl.Marker;
    selectedAddress: string = 'Loading address...';
    selectedCoords: { lat: number, lng: number } = { lat: 28.6139, lng: 77.2090 };
    isGeocoding: boolean = false;
    isDetectingLocation: boolean = false;

    constructor(private locationService: LocationService, private http: HttpClient) { }

    ngAfterViewInit() {
        if (this.isOpen) {
            setTimeout(() => this.initializeMap(), 100);
        }
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['isOpen'] && this.isOpen && !this.map) {
            setTimeout(() => this.initializeMap(), 100);
        }
    }

    private initializeMap() {
        const container = document.getElementById('location-map');
        if (!container) return;

        // Use initial location or default to Delhi
        const center: [number, number] = this.initialLocation
            ? [this.initialLocation.longitude, this.initialLocation.latitude]
            : [77.2090, 28.6139];

        this.selectedCoords = {
            lat: center[1],
            lng: center[0]
        };

        this.map = new maplibregl.Map({
            container: 'location-map',
            style: 'https://demotiles.maplibre.org/style.json',
            center: center,
            zoom: 13
        });

        // CRITICAL: Wait for map to load before adding OSM tiles
        this.map.on('load', () => {
            // Add OSM raster tiles
            this.map!.addSource('osm', {
                type: 'raster',
                tiles: ['https://a.tile.openstreetmap.org/{z}/{x}/{y}.png'],
                tileSize: 256,
                attribution: '© OpenStreetMap Contributors'
            });

            this.map!.addLayer({
                id: 'osm-layer',
                type: 'raster',
                source: 'osm'
            });

            // Add marker AFTER tiles are loaded
            this.marker = new maplibregl.Marker({
                draggable: true,
                color: '#10b981'
            })
                .setLngLat(center)
                .addTo(this.map!);

            // Get initial address
            this.reverseGeocode(this.selectedCoords.lat, this.selectedCoords.lng);

            // Handle marker drag
            this.marker.on('dragend', () => {
                const lngLat = this.marker!.getLngLat();
                this.selectedCoords = { lat: lngLat.lat, lng: lngLat.lng };
                this.reverseGeocode(lngLat.lat, lngLat.lng);
            });

            // Handle map click
            this.map!.on('click', (e) => {
                this.selectedCoords = { lat: e.lngLat.lat, lng: e.lngLat.lng };
                this.marker?.setLngLat([e.lngLat.lng, e.lngLat.lat]);
                this.reverseGeocode(e.lngLat.lat, e.lngLat.lng);
            });
        });
    }

    detectMyLocation() {
        this.isDetectingLocation = true;

        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const lat = position.coords.latitude;
                    const lng = position.coords.longitude;

                    this.selectedCoords = { lat, lng };
                    this.marker?.setLngLat([lng, lat]);
                    this.map?.flyTo({ center: [lng, lat], zoom: 15 });
                    this.reverseGeocode(lat, lng);
                    this.isDetectingLocation = false;
                },
                (error) => {
                    console.error('Location detection failed:', error);
                    this.isDetectingLocation = false;
                },
                {
                    enableHighAccuracy: false,
                    timeout: 10000
                }
            );
        }
    }

    private reverseGeocode(lat: number, lng: number): void {
        this.isGeocoding = true;
        const coordsText = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;

        // Set coordinates immediately as fallback
        this.selectedAddress = coordsText;

        // Try to get readable address
        this.http.get<any>(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
        ).subscribe({
            next: (data) => {
                if (data && data.address) {
                    const city = data.address.city ||
                        data.address.town ||
                        data.address.village ||
                        data.address.state_district ||
                        'Unknown';

                    const state = data.address.state || '';
                    const road = data.address.road || '';

                    this.selectedAddress = road
                        ? `${road}, ${city}, ${state}`
                        : `${city}, ${state}`;
                }
                this.isGeocoding = false;
            },
            error: () => {
                // Keep coordinates on CORS error
                this.selectedAddress = coordsText;
                this.isGeocoding = false;
            }
        });
    }

    confirmLocation() {
        const parts = this.selectedAddress.split(',');
        const city = parts.length > 1 ? parts[parts.length - 2].trim() : this.selectedAddress;

        this.locationSelected.emit({
            city,
            state: parts.length > 0 ? parts[parts.length - 1].trim() : '',
            latitude: this.selectedCoords.lat,
            longitude: this.selectedCoords.lng
        });

        this.closeModal();
    }

    closeModal() {
        this.modalClosed.emit();
        if (this.map) {
            this.map.remove();
            this.map = undefined;
            this.marker = undefined;
        }
    }
}
