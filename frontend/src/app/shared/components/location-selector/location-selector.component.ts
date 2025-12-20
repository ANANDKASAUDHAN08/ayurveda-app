import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { LocationService, UserLocation } from '../../services/location.service';
import { LocationMapModalComponent } from '../location-map-modal/location-map-modal.component';

@Component({
  selector: 'app-location-selector',
  standalone: true,
  imports: [CommonModule, LocationMapModalComponent],
  templateUrl: './location-selector.component.html',
  styleUrl: './location-selector.component.css'
})
export class LocationSelectorComponent implements OnInit, OnDestroy {
  selectedLocation: string = 'Delhi NCR';
  showDropdown: boolean = false;
  isDetecting: boolean = false;
  showMapModal: boolean = false;
  private locationSubscription?: Subscription;

  locations: string[] = [
    'Delhi NCR',
    'Mumbai',
    'Bangalore',
    'Hyderabad',
    'Chennai',
    'Kolkata',
    'Pune',
    'Ahmedabad',
    'Jaipur',
    'Lucknow'
  ];

  constructor(private locationService: LocationService) { }

  ngOnInit() {
    // Subscribe to location updates
    this.locationSubscription = this.locationService.location$.subscribe(location => {
      if (location) {
        this.selectedLocation = location.city;
      }
    });

    // Load stored location
    const stored = this.locationService.getStoredLocation();
    if (stored) {
      this.selectedLocation = stored.city;
    }
  }

  ngOnDestroy() {
    if (this.locationSubscription) {
      this.locationSubscription.unsubscribe();
    }
  }

  toggleDropdown() {
    this.showDropdown = !this.showDropdown;
  }

  selectLocation(location: string) {
    this.selectedLocation = location;
    this.showDropdown = false;

    // Update the location service
    this.locationService.setLocation({
      city: location,
      state: '',
      latitude: 0,
      longitude: 0
    });
  }

  detectMyLocation() {
    this.isDetecting = true;
    this.showDropdown = false;
    this.locationService.detectLocation();

    // Reset detecting state after 3 seconds
    setTimeout(() => {
      this.isDetecting = false;
    }, 3000);
  }

  openMapModal() {
    this.showMapModal = true;
    this.showDropdown = false;
  }

  onLocationFromMap(location: UserLocation) {
    this.selectedLocation = location.city;
    this.showMapModal = false;
    this.locationService.setLocation(location);
  }

  closeMapModal() {
    this.showMapModal = false;
  }

  getCurrentLocation(): UserLocation {
    return this.locationService.getCurrentLocation() || {
      city: 'Delhi NCR',
      state: 'Delhi',
      latitude: 28.6139,
      longitude: 77.2090
    };
  }

  closeDropdown() {
    this.showDropdown = false;
  }
}
