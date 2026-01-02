import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { LocationService } from '../../services/location.service';

@Component({
    selector: 'app-mobile-location-bar',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './mobile-location-bar.component.html',
    styleUrl: './mobile-location-bar.component.css'
})
export class MobileLocationBarComponent implements OnInit, OnDestroy {
    selectedLocation: string = '';
    private locationSubscription?: Subscription;

    constructor(private locationService: LocationService) { }

    ngOnInit() {
        this.locationSubscription = this.locationService.location$.subscribe(location => {
            this.selectedLocation = location ? (location.displayName || location.city) : 'Select Location';
        });

        const stored = this.locationService.getStoredLocation();
        if (stored) {
            this.selectedLocation = stored.displayName || stored.city;
        } else {
            this.selectedLocation = 'Select Location';
        }
    }

    ngOnDestroy() {
        this.locationSubscription?.unsubscribe();
    }

    openLocationSheet() {
        this.locationService.toggleBottomSheet(true);
    }
}
