import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HospitalsService, Hospital } from '../../shared/services/hospitals.service';
import { EmergencyService } from '../../shared/services/emergency.service';

@Component({
  selector: 'app-nearby-hospitals',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './nearby-hospitals.component.html',
  styleUrl: './nearby-hospitals.component.css'
})
export class NearbyHospitalsComponent implements OnInit {
  hospitals: Hospital[] = [];
  filteredHospitals: Hospital[] = [];
  loading = true;
  userLocation: GeolocationCoordinates | null = null;
  selectedType: 'all' | 'government' | 'private' = 'all';
  searchRadius = 10; // km
  errorMessage = '';

  constructor(
    private hospitalsService: HospitalsService,
    private emergencyService: EmergencyService,
    private router: Router
  ) { }

  ngOnInit() {
    this.detectLocationAndLoadHospitals();
  }

  detectLocationAndLoadHospitals() {
    this.loading = true;
    this.emergencyService.getCurrentLocation().then(
      (location: GeolocationCoordinates) => {
        this.userLocation = location;
        this.loadNearbyHospitals();
      },
      (error: any) => {
        console.error('Location error:', error);
        this.errorMessage = 'Unable to detect location. Please enable location services.';
        this.loading = false;
      }
    );
  }

  loadNearbyHospitals() {
    if (!this.userLocation) {
      this.errorMessage = 'Location not available';
      this.loading = false;
      return;
    }

    const type = this.selectedType === 'all' ? undefined : this.selectedType;

    this.hospitalsService.getNearbyHospitals(
      this.userLocation.latitude,
      this.userLocation.longitude,
      this.searchRadius,
      type
    ).subscribe({
      next: (response) => {
        this.hospitals = response.hospitals;
        this.filteredHospitals = this.hospitals;
        this.loading = false;
      },
      error: (error) => {
        console.error('Failed to load hospitals:', error);
        this.errorMessage = 'Failed to load nearby hospitals. Please try again.';
        this.loading = false;
      }
    });
  }

  filterByType(type: 'all' | 'government' | 'private') {
    this.selectedType = type;
    this.loadNearbyHospitals();
  }

  updateRadius() {
    this.loadNearbyHospitals();
  }

  callHospital(phone: string) {
    window.location.href = `tel:${phone}`;
  }

  getDirections(hospital: Hospital) {
    // OpenStreetMap directions link
    const url = `https://www.openstreetmap.org/directions?from=${this.userLocation?.latitude},${this.userLocation?.longitude}&to=${hospital.latitude},${hospital.longitude}`;
    window.open(url, '_blank');
  }

  getTypeColor(type: string): string {
    return type === 'government' ? 'blue' : 'purple';
  }

  getBadgeIcon(type: string): string {
    return type === 'government' ? 'fa-landmark' : 'fa-building';
  }

  goBackToEmergency() {
    this.router.navigate(['/emergency']);
  }
}
