import { Component, Input, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrderService } from '../../services/order.service';
import * as maplibregl from 'maplibre-gl';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-order-tracking-map',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './order-tracking-map.component.html',
  styleUrl: './order-tracking-map.component.css'
})
export class OrderTrackingMapComponent implements OnInit, OnDestroy, AfterViewInit {
  @Input() orderId!: number;

  map!: maplibregl.Map;
  driverMarker!: maplibregl.Marker;
  customerMarker!: maplibregl.Marker;
  trackingSub?: Subscription;

  trackingData: any = null;
  loading = true;

  constructor(private orderService: OrderService) { }

  ngOnInit() { }

  ngAfterViewInit() {
    this.initMap();
  }

  ngOnDestroy() {
    if (this.trackingSub) this.trackingSub.unsubscribe();
    if (this.map) this.map.remove();
  }

  private initMap() {
    this.map = new maplibregl.Map({
      container: 'order-map',
      style: 'https://demotiles.maplibre.org/style.json',
      center: [77.2090, 28.6139], // Default Delhi
      zoom: 13
    });

    this.map.on('load', () => {
      // Add OSM layer
      this.map.addSource('osm', {
        type: 'raster',
        tiles: ['https://a.tile.openstreetmap.org/{z}/{x}/{y}.png'],
        tileSize: 256,
        attribution: '&copy; OpenStreetMap Contributors'
      });
      this.map.addLayer({ id: 'osm-layer', type: 'raster', source: 'osm' });

      this.startTracking();
    });
  }

  private startTracking() {
    // Initial fetch
    this.updateTrackingData();

    // Poll every 5 seconds for simulation
    this.trackingSub = interval(5000).subscribe(() => {
      this.updateTrackingData();
    });
  }

  private updateTrackingData() {
    this.orderService.getOrderTracking(this.orderId).subscribe({
      next: (res) => {
        if (res.success) {
          this.trackingData = res.data;
          this.loading = false;
          this.syncMarkers();
        }
      },
      error: (err) => {
        console.error('Tracking error:', err);
        this.loading = false;
      }
    });
  }

  private syncMarkers() {
    if (!this.trackingData) return;

    const driverPos: [number, number] = [
      parseFloat(this.trackingData.driver_lng) || 77.2090,
      parseFloat(this.trackingData.driver_lat) || 28.6139
    ];

    const customerPos: [number, number] = [
      parseFloat(this.trackingData.customer_lng) || 77.2190,
      parseFloat(this.trackingData.customer_lat) || 28.6239
    ];

    // Customer Marker
    if (!this.customerMarker) {
      this.customerMarker = new maplibregl.Marker({ color: '#10b981' }) // Emerald
        .setLngLat(customerPos)
        .setPopup(new maplibregl.Popup().setHTML('<b>Delivery Location</b>'))
        .addTo(this.map);
    } else {
      this.customerMarker.setLngLat(customerPos);
    }

    // Driver Marker
    if (!this.driverMarker) {
      const el = document.createElement('div');
      el.className = 'driver-marker';
      el.innerHTML = '<i class="fas fa-motorcycle text-white bg-blue-600 p-2 rounded-full shadow-lg border-2 border-white"></i>';

      this.driverMarker = new maplibregl.Marker(el)
        .setLngLat(driverPos)
        .setPopup(new maplibregl.Popup().setHTML(`<b>Driver: ${this.trackingData.driver_name || 'Assigned'}</b>`))
        .addTo(this.map);
    } else {
      // Smoothly move the marker if supported, otherwise just set it
      this.driverMarker.setLngLat(driverPos);
    }

    // Fit bounds
    const bounds = new maplibregl.LngLatBounds()
      .extend(driverPos)
      .extend(customerPos);

    this.map.fitBounds(bounds, { padding: 50, maxZoom: 15 });
  }
}
