import { Component, Input, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrderService } from '../../services/order.service';
import { GoogleMapsModule } from '@angular/google-maps';
import { interval, Subscription } from 'rxjs';
import { GoogleMapsLoaderService } from '../../services/google-maps-loader.service';

@Component({
  selector: 'app-order-tracking-map',
  standalone: true,
  imports: [CommonModule, GoogleMapsModule],
  templateUrl: './order-tracking-map.component.html',
  styleUrl: './order-tracking-map.component.css'
})
export class OrderTrackingMapComponent implements OnInit, OnDestroy, AfterViewInit {
  @Input() orderId!: number;

  // Google Maps State
  center: google.maps.LatLngLiteral = { lat: 28.6139, lng: 77.2090 };
  zoom = 13;
  options: google.maps.MapOptions = {
    disableDefaultUI: false,
    zoomControl: true,
  };

  driverPosition: google.maps.LatLngLiteral | null = null;
  customerPosition: google.maps.LatLngLiteral | null = null;

  driverMarkerOptions: google.maps.MarkerOptions = {
    icon: {
      url: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
      scaledSize: { width: 40, height: 40 } as any // Using simple icon for now
    }
  };

  customerMarkerOptions: google.maps.MarkerOptions = {
    icon: {
      url: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png',
      scaledSize: { width: 40, height: 40 } as any
    }
  };

  trackingSub?: Subscription;

  trackingData: any = null;
  loading = true;
  apiLoaded = false;

  constructor(
    private orderService: OrderService,
    private googleLoader: GoogleMapsLoaderService
  ) { }

  ngOnInit() {
    this.googleLoader.isLoaded$.subscribe(loaded => {
      this.apiLoaded = loaded;
      if (loaded) {
        this.driverMarkerOptions.animation = google.maps.Animation.DROP;
      }
    });
  }

  ngAfterViewInit() {
    this.startTracking();
  }

  ngOnDestroy() {
    if (this.trackingSub) this.trackingSub.unsubscribe();
  }

  // initMap is handled by <google-map> component

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

    const driverLat = parseFloat(this.trackingData.driver_lat) || 28.6139;
    const driverLng = parseFloat(this.trackingData.driver_lng) || 77.2090;

    const customerLat = parseFloat(this.trackingData.customer_lat) || 28.6239;
    const customerLng = parseFloat(this.trackingData.customer_lng) || 77.2190;

    // Update positions which automatically updates markers via template binding
    this.driverPosition = { lat: driverLat, lng: driverLng };
    this.customerPosition = { lat: customerLat, lng: customerLng };

    // Simply center map on driver for tracking
    this.center = { lat: driverLat, lng: driverLng };
  }
}
