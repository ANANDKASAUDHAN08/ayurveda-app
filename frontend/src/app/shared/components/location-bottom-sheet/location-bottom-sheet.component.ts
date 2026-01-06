import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LocationService } from '../../services/location.service';

@Component({
    selector: 'app-location-bottom-sheet',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './location-bottom-sheet.component.html',
    styleUrl: './location-bottom-sheet.component.css'
})
export class LocationBottomSheetComponent {
    @Input() isOpen = false;
    @Output() closeRequested = new EventEmitter<void>();

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

    // Search properties
    searchQuery: string = '';
    predictions: google.maps.places.AutocompletePrediction[] = [];

    constructor(private locationService: LocationService) { }

    getCurrentLocation() {
        return this.locationService.getCurrentLocation();
    }

    close() {
        this.closeRequested.emit();
        this.searchQuery = '';
        this.predictions = [];
    }

    selectCity(city: any) {
        this.locationService.setLocation({
            city: city.name,
            state: '',
            displayName: city.name,
            formattedAddress: city.name,
            latitude: city.lat,
            longitude: city.lng
        });
        this.close();
    }

    detectLocation() {
        this.locationService.detectLocation(true); // Use Google for mobile
        this.close();
    }

    openMap() {
        this.locationService.toggleMap(true);
        this.close();
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
        this.locationService.resolvePlaceId(prediction.place_id, true).subscribe({ // Use Google for mobile
            next: (location) => {
                this.locationService.setLocation(location, true);
                this.searchQuery = '';
                this.predictions = [];
                this.close();
            },
            error: (err) => console.error('Error selecting location:', err)
        });
    }
}
