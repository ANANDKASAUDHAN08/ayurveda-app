import { Component, OnInit, OnDestroy, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { LocationService, UserLocation } from '../../services/location.service';

@Component({
  selector: 'app-location-selector',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './location-selector.component.html',
  styleUrl: './location-selector.component.css'
})
export class LocationSelectorComponent implements OnInit, OnDestroy {
  selectedLocation: string = '';
  searchQuery: string = '';
  showDropdown: boolean = false;
  isDetecting: boolean = false;
  predictions: google.maps.places.AutocompletePrediction[] = [];
  private locationSubscription?: Subscription;
  private detectionSubscription?: Subscription;

  popularCities = [
    { name: 'Mumbai', lat: 19.0760, lng: 72.8777 },
    { name: 'Delhi', lat: 28.6139, lng: 77.2090 },
    { name: 'Bangalore', lat: 12.9716, lng: 77.5946 },
    { name: 'Hyderabad', lat: 17.3850, lng: 78.4867 },
    { name: 'Chennai', lat: 13.0827, lng: 80.2707 },
    { name: 'Kolkata', lat: 22.5726, lng: 88.3639 },
    { name: 'Pune', lat: 18.5204, lng: 73.8567 },
    { name: 'Ahmedabad', lat: 23.0225, lng: 72.5714 }
  ];

  constructor(private locationService: LocationService, private el: ElementRef) { }

  ngOnInit() {
    // Subscribe to location updates
    this.locationSubscription = this.locationService.location$.subscribe(location => {
      this.selectedLocation = location ? (location.displayName || location.city) : '';
    });

    this.detectionSubscription = this.locationService.isDetecting$.subscribe(isDetecting => {
      this.isDetecting = isDetecting;
    });

    // Load stored location
    const stored = this.locationService.getStoredLocation();
    if (stored) {
      this.selectedLocation = stored.displayName || stored.city;
    }
  }

  ngOnDestroy() {
    if (this.locationSubscription) {
      this.locationSubscription.unsubscribe();
    }
    if (this.detectionSubscription) {
      this.detectionSubscription.unsubscribe();
    }
  }

  toggleDropdown() {
    this.showDropdown = !this.showDropdown;
  }

  selectCity(city: any) {
    this.selectedLocation = city.name;
    this.showDropdown = false;
    this.locationService.setLocation({
      city: city.name,
      state: '',
      displayName: city.name,
      formattedAddress: city.name,
      latitude: city.lat,
      longitude: city.lng
    }); // Popular cities are persistent when clicked
    this.searchQuery = '';
  }

  onSearchInput() {
    if (this.searchQuery.length < 3) return;

    this.locationService.searchPlaces(this.searchQuery).subscribe(predictions => {
      this.predictions = predictions;
    });
  }

  selectPrediction(prediction: google.maps.places.AutocompletePrediction) {
    this.locationService.resolvePlaceId(prediction.place_id).subscribe({
      next: (location) => {
        this.selectedLocation = location.formattedAddress;
        this.showDropdown = false;
        this.searchQuery = '';
        this.predictions = [];
        this.locationService.setLocation(location, true); // Search selection is persistent
      },
      error: (err) => console.error('Error selecting location:', err)
    });
  }



  detectMyLocation() {
    this.locationService.detectLocation();
    this.showDropdown = false;
  }

  openMapModal() {
    this.locationService.toggleMap(true);
    this.showDropdown = false;
  }

  getCurrentLocation(): UserLocation | null {
    return this.locationService.getCurrentLocation();
  }

  closeDropdown() {
    this.showDropdown = false;
    this.searchQuery = '';
    this.predictions = [];
  }

  // Click outside to close
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (this.showDropdown && !this.el.nativeElement.contains(target)) {
      this.closeDropdown();
    }
  }
}
