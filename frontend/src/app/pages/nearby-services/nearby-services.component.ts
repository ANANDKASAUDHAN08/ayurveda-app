import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MapService, Location } from '../../shared/services/map.service';
import * as maplibregl from 'maplibre-gl';

@Component({
  selector: 'app-nearby-services',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './nearby-services.component.html',
  styleUrl: './nearby-services.component.css'
})
export class NearbyServicesComponent implements OnInit, OnDestroy, AfterViewInit {
  map!: maplibregl.Map;
  userLocation: Location | null = null;
  items: any[] = [];
  filteredItems: any[] = [];
  selectedType: 'hospital' | 'pharmacy' | 'doctor' = 'hospital';
  selectedItem: any | null = null;
  loading = false;
  searchQuery = '';
  markers: maplibregl.Marker[] = [];

  constructor(private mapService: MapService) { }

  ngOnInit() {
    this.loading = true;
  }

  ngAfterViewInit() {
    this.initializeMap();
  }

  ngOnDestroy() {
    if (this.map) {
      this.map.remove();
    }
  }

  private initializeMap() {
    this.map = new maplibregl.Map({
      container: 'map',
      style: 'https://demotiles.maplibre.org/style.json', // Default demo style
      center: [77.2090, 28.6139], // Delhi
      zoom: 12
    });

    // Use OSM tiles for better detail
    this.map.on('load', () => {
      this.map.addSource('osm', {
        type: 'raster',
        tiles: ['https://a.tile.openstreetmap.org/{z}/{x}/{y}.png'],
        tileSize: 256,
        attribution: '&copy; OpenStreetMap Contributors',
      });
      this.map.addLayer({
        id: 'osm-layer',
        type: 'raster',
        source: 'osm',
      });

      this.setupLocationAndData();
    });

    this.map.addControl(new maplibregl.NavigationControl(), 'top-right');
  }

  private async setupLocationAndData() {
    try {
      this.userLocation = await this.mapService.getCurrentLocation();
      this.map.flyTo({
        center: [this.userLocation.longitude, this.userLocation.latitude],
        zoom: 13
      });

      // Add a special marker for the user
      new maplibregl.Marker({ color: '#2563eb' })
        .setLngLat([this.userLocation.longitude, this.userLocation.latitude])
        .setPopup(new maplibregl.Popup().setHTML('<b>You are here</b>'))
        .addTo(this.map);

      this.loadNearby();
    } catch (error) {
      console.error('Location error:', error);
      // Fallback to default location
      this.loadNearby();
    }
  }

  loadNearby(forceRefresh: boolean = false) {
    this.loading = true;
    const lat = this.userLocation?.latitude || 28.6139;
    const lng = this.userLocation?.longitude || 77.2090;

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
    // Clear old markers
    this.markers.forEach(m => m.remove());
    this.markers = [];

    // Add new markers
    this.items.forEach(item => {
      if (item.latitude && item.longitude) {
        const color = item.type === 'hospital' ? '#2562eb' : (item.type === 'pharmacy' ? '#059669' : '#dc2626');

        const popup = new maplibregl.Popup({ offset: 25 })
          .setHTML(`
            <div style="padding: 10px; min-width: 150px;">
              <h4 style="margin: 0 0 5px; font-weight: bold; color: #1e293b;">${item.name}</h4>
              <p style="margin: 0 0 8px; font-size: 11px; color: #64748b;">${item.address || 'Address not available'}</p>
              <div style="display: flex; gap: 5px; align-items: center;">
                <span style="font-size: 10px; font-weight: bold; color: #059669; background: #ecfdf5; padding: 2px 6px; rounded: 4px;">
                  ${parseFloat(item.distance).toFixed(1)} km
                </span>
                <button onclick="window.open('https://www.google.com/maps/dir/?api=1&destination=${item.latitude},${item.longitude}', '_blank')" 
                        style="border: none; background: #059669; color: white; padding: 2px 8px; font-size: 10px; border-radius: 4px; cursor: pointer;">
                  Directions
                </button>
              </div>
            </div>
          `);

        const marker = new maplibregl.Marker({ color: color })
          .setLngLat([item.longitude, item.latitude])
          .setPopup(popup)
          .addTo(this.map);

        this.markers.push(marker);
      }
    });
  }

  focusOnItem(item: any) {
    this.selectedItem = item;
    this.map.flyTo({
      center: [item.longitude, item.latitude],
      zoom: 15,
      essential: true
    });

    // Find the marker and open its popup
    const marker = this.markers.find(m => m.getLngLat().lng === item.longitude && m.getLngLat().lat === item.latitude);
    if (marker) {
      marker.togglePopup();
    }
  }

  getDirections(item: any) {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${item.latitude},${item.longitude}`;
    window.open(url, '_blank');
  }

  callNow(phone: string) {
    window.location.href = `tel:${phone}`;
  }
}
