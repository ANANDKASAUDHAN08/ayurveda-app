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
    isEstimated: boolean = false;
    private locationSubscription?: Subscription;

    constructor(private locationService: LocationService) { }

    ngOnInit() {
        this.locationSubscription = this.locationService.location$.subscribe(location => {
            this.selectedLocation = location ? (location.displayName || location.city) : 'Select Location';
            this.isEstimated = !!location?.isEstimated;
        });

        const stored = this.locationService.getStoredLocation();
        if (stored) {
            this.selectedLocation = stored.displayName || stored.city;
            this.isEstimated = !!stored.isEstimated;
        } else {
            this.selectedLocation = 'Select Location';
            this.isEstimated = false;
        }
    }

    ngOnDestroy() {
        this.locationSubscription?.unsubscribe();
    }

    openLocationSheet() {
        this.locationService.toggleBottomSheet(true);
    }
}
