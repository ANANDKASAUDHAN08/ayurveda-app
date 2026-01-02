import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MapService, Location } from '../../shared/services/map.service';
import { MobileLocationBarComponent } from '../../shared/components/mobile-location-bar/mobile-location-bar.component';
import { GoogleMapsModule } from '@angular/google-maps';
import { LocationService } from '../../shared/services/location.service';

@Component({
  selector: 'app-nearby-services',
  standalone: true,
  imports: [CommonModule, FormsModule, MobileLocationBarComponent, GoogleMapsModule],
  templateUrl: './nearby-services.component.html',
  styleUrl: './nearby-services.component.css'
})
export class NearbyServicesComponent implements OnInit {
  // Map Options
  center: google.maps.LatLngLiteral = { lat: 28.6139, lng: 77.2090 }; // Delhi
  zoom = 13;
  options: google.maps.MapOptions = {
    disableDefaultUI: false,
    zoomControl: true,
  };

  userLocation: { lat: number; lng: number } | null = null;
  items: any[] = [];
  filteredItems: any[] = [];
  selectedType: 'hospital' | 'pharmacy' | 'doctor' = 'hospital';
  selectedItem: any | null = null;
  loading = false;
  searchQuery = '';

  // Markers
  markers: any[] = [];
  userMarkerPosition: google.maps.LatLngLiteral | null = null;
  userMarkerOptions: google.maps.MarkerOptions = {
    icon: {
      path: google.maps.SymbolPath.CIRCLE,
      scale: 10,
      fillColor: '#2563eb',
      fillOpacity: 1,
      strokeWeight: 2,
      strokeColor: '#ffffff',
    },
    title: 'You are here'
  };

  constructor(
    private mapService: MapService,
    private locationService: LocationService
  ) { }

  ngOnInit() {
    this.loading = true;
    this.setupLocationAndData();
  }

  private setupLocationAndData() {
    this.locationService.getCoordinates().then(
      (position) => {
        this.userLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        this.center = this.userLocation;
        this.userMarkerPosition = this.userLocation;
        this.loadNearby();
      },
      (error) => {
        console.error('Location error:', error);
        // Fallback to default (Delhi)
        this.loadNearby();
      }
    );
  }


  loadNearby(forceRefresh: boolean = false) {
    this.loading = true;
    const lat = this.userLocation?.lat || 28.6139;
    const lng = this.userLocation?.lng || 77.2090;

    let obs;
    switch (this.selectedType) {
      case 'hospital':
        obs = this.mapService.getNearbyHospitals(lat, lng);
        break;
      case 'pharmacy':
        obs = this.mapService.getNearbyPharmacies(lat, lng);
        break;
      case 'doctor':
        obs = this.mapService.getNearbyDoctors(lat, lng);
        break;
    }

    obs.subscribe({
      next: (res) => {
        if (res.success) {
          this.items = res.data.map((item: any) => ({ ...item, type: this.selectedType }));
          this.onSearch(); // Apply initial filter
          this.updateMarkers();
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('API Error:', err);
        this.loading = false;
      }
    });
  }

  toggleType(type: 'hospital' | 'pharmacy' | 'doctor') {
    if (this.selectedType === type) return;
    this.selectedType = type;
    this.loadNearby();
  }

  onSearch() {
    if (!this.searchQuery) {
      this.filteredItems = this.items;
    } else {
      const q = this.searchQuery.toLowerCase();
      this.filteredItems = this.items.filter(item =>
        item.name.toLowerCase().includes(q) ||
        (item.address && item.address.toLowerCase().includes(q))
      );
    }
  }

  private updateMarkers() {
    this.markers = this.items
      .filter(item => item.latitude && item.longitude)
      .map(item => {
        const lat = parseFloat(String(item.latitude));
        const lng = parseFloat(String(item.longitude));

        // Assign colors based on type
        const iconUrl = item.type === 'hospital'
          ? 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png'
          : (item.type === 'pharmacy' ? 'http://maps.google.com/mapfiles/ms/icons/green-dot.png' : 'http://maps.google.com/mapfiles/ms/icons/red-dot.png');

        return {
          position: { lat: lat, lng: lng },
          title: item.name,
          options: {
            icon: iconUrl,
            animation: google.maps.Animation.DROP,
            title: item.name
          },
          data: item
        };
      });
  }

  focusOnItem(item: any) {
    this.selectedItem = item;
    this.selectedItem = item;
    this.center = { lat: item.latitude, lng: item.longitude };
    this.zoom = 15;
    // Popup logic is handled in template with *ngIf or similar, 
    // or by referencing the MapMarker component if we want to open it programmatically.
  }

  getDirections(item: any) {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${item.latitude},${item.longitude}`;
    window.open(url, '_blank');
  }

  callNow(phone: string) {
    window.location.href = `tel:${phone}`;
  }
}
