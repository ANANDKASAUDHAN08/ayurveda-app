import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LocationService } from '../../services/location.service';

@Component({
    selector: 'app-location-bottom-sheet',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './location-bottom-sheet.component.html',
    styleUrl: './location-bottom-sheet.component.css'
})
export class LocationBottomSheetComponent {
    @Input() isOpen = false;
    @Output() closeRequested = new EventEmitter<void>();

    popularCities = ['Delhi NCR', 'Mumbai', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata'];

    constructor(private locationService: LocationService) { }

    close() {
        this.closeRequested.emit();
    }

    selectCity(city: string) {
        this.locationService.setLocation({
            city,
            state: '',
            latitude: 0,
            longitude: 0
        });
        this.close();
    }

    detectLocation() {
        this.locationService.detectLocation();
        this.close();
    }

    openMap() {
        this.locationService.toggleMap(true);
        this.close();
    }
}
