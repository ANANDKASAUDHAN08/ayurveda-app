import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-location-selector',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './location-selector.component.html',
  styleUrl: './location-selector.component.css'
})
export class LocationSelectorComponent {
  selectedLocation: string = 'Delhi NCR';
  showDropdown: boolean = false;

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

  toggleDropdown() {
    this.showDropdown = !this.showDropdown;
  }

  selectLocation(location: string) {
    this.selectedLocation = location;
    this.showDropdown = false;
  }

  closeDropdown() {
    this.showDropdown = false;
  }
}
