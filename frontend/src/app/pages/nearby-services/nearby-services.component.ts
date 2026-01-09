import { Component, OnInit, OnDestroy, AfterViewInit, HostListener, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MapService } from '../../shared/services/map.service';
import { MobileLocationBarComponent } from '../../shared/components/mobile-location-bar/mobile-location-bar.component';
import { GoogleMapsModule } from '@angular/google-maps';
import { LocationService } from '../../shared/services/location.service';
import { GoogleMapsLoaderService } from '../../shared/services/google-maps-loader.service';

@Component({
  selector: 'app-nearby-services',
  standalone: true,
  imports: [CommonModule, FormsModule, MobileLocationBarComponent, GoogleMapsModule],
  templateUrl: './nearby-services.component.html',
  styleUrl: './nearby-services.component.css'
})
export class NearbyServicesComponent implements OnInit {
  @ViewChild('districtSearchContainer') districtSearchContainer!: ElementRef;

  // Map Options
  center: google.maps.LatLngLiteral = { lat: 28.6139, lng: 77.2090 }; // Delhi
  zoom = 13;
  options: google.maps.MapOptions = {
    disableDefaultUI: false,
    zoomControl: true,
  };

  userLocation: { lat: number; lng: number } | null = null;
  items: any[] = [];
  filteredItems: any[] = [];
  selectedType: 'hospital' | 'pharmacy' | 'doctor' | 'health-centre' = 'hospital';
  selectedItem: any | null = null;
  loading = false;
  searchQuery = '';
  districtQuery = '';
  districtSuggestions: any[] = [];
  searchMode: 'nearby' | 'district' = 'nearby';
  apiLoaded = false;

  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 10;
  showMobileLegend: boolean = false;
  Math = Math;

  // Markers
  markers: any[] = [];
  userMarkerPosition: google.maps.LatLngLiteral | null = null;
  userMarkerOptions: google.maps.MarkerOptions = {
    title: 'You are here'
  };

  constructor(
    private mapService: MapService,
    private locationService: LocationService,
    private googleLoader: GoogleMapsLoaderService,
    private elementRef: ElementRef
  ) { }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (this.districtSearchContainer && !this.districtSearchContainer.nativeElement.contains(event.target)) {
      this.districtSuggestions = [];
    }
  }

  ngOnInit() {
    this.loading = true;
    this.googleLoader.isLoaded$.subscribe(loaded => {
      this.apiLoaded = loaded;
      if (loaded) {
        this.initUserMarkerOptions();
        this.updateMarkers(); // Refresh markers with google namespace available
      }
    });
    this.setupLocationAndData();
  }

  private initUserMarkerOptions() {
    if (typeof google === 'undefined') return;
    this.userMarkerOptions.icon = {
      path: google.maps.SymbolPath.CIRCLE,
      scale: 10,
      fillColor: '#2563eb',
      fillOpacity: 1,
      strokeWeight: 2,
      strokeColor: '#ffffff'
    };
  }

  private setupLocationAndData() {
    this.locationService.getCoordinates().then(
      (position) => {
        this.userLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        this.center = this.userLocation;
        this.userMarkerPosition = this.userLocation;
        this.loadNearby();
      },
      (error) => {
        console.error('Location error:', error);
        // Fallback to default (Delhi)
        this.loadNearby();
      }
    );
  }


  loadNearby(forceRefresh: boolean = false) {
    this.loading = true;
    const lat = this.userLocation?.lat || 28.6139;
    const lng = this.userLocation?.lng || 77.2090;

    let obs;
    switch (this.selectedType) {
      case 'hospital':
        obs = this.mapService.getNearbyHospitals(lat, lng);
        break;
      case 'pharmacy':
        obs = this.mapService.getNearbyPharmacies(lat, lng);
        break;
      case 'doctor':
        obs = this.mapService.getNearbyDoctors(lat, lng);
        break;
      case 'health-centre':
        if (this.searchMode === 'district' && this.districtQuery) {
          obs = this.mapService.getNearbyHealthCentres(lat, lng, 20, this.districtQuery);
        } else {
          obs = this.mapService.getNearbyHealthCentres(lat, lng);
        }
        break;
    }

    obs.subscribe({
      next: (res) => {
        if (res.success) {
          this.items = res.data.map((item: any) => ({ ...item, type: this.selectedType }));
          this.onSearch(); // Apply initial filter
          this.updateMarkers();

          // Update map center and zoom when district search returns results
          if (this.searchMode === 'district' && this.items.length > 0) {
            // Find the first item with valid coordinates
            const itemWithCoords = this.items.find(item =>
              item.latitude && item.longitude &&
              !isNaN(parseFloat(String(item.latitude))) &&
              !isNaN(parseFloat(String(item.longitude)))
            );

            if (itemWithCoords) {
              this.center = {
                lat: parseFloat(String(itemWithCoords.latitude)),
                lng: parseFloat(String(itemWithCoords.longitude))
              };
              this.zoom = 12; // Zoom to show district area
            }
          } else if (this.searchMode === 'nearby' && this.userLocation) {
            // Reset to user location when switching back to nearby mode
            this.center = this.userLocation;
            this.zoom = 13;
          }
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('API Error:', err);
        this.loading = false;
      }
    });
  }

  toggleType(type: 'hospital' | 'pharmacy' | 'doctor' | 'health-centre') {
    if (this.selectedType === type) return;
    this.selectedType = type;
    this.searchQuery = '';
    this.districtQuery = '';
    this.districtSuggestions = [];
    if (type !== 'health-centre') {
      this.searchMode = 'nearby';
    }
    this.loadNearby();
  }

  onDistrictInput() {
    if (this.districtQuery.length < 2) {
      this.districtSuggestions = [];
      return;
    }
    this.mapService.searchDistricts(this.districtQuery).subscribe(res => {
      if (res.success) {
        this.districtSuggestions = res.data;
      }
    });
  }

  selectDistrict(district: any) {
    this.districtQuery = district.district_name;
    this.districtSuggestions = [];
    this.searchMode = 'district';
    this.loadNearby();
  }

  clearDistrictSearch() {
    this.districtQuery = '';
    this.districtSuggestions = [];
    this.searchMode = 'nearby';
    this.loadNearby();
  }

  onSearch() {
    if (!this.searchQuery) {
      this.filteredItems = this.items;
    } else {
      const q = this.searchQuery.toLowerCase();
      this.filteredItems = this.items.filter(item =>
        item.name.toLowerCase().includes(q) ||
        (item.address && item.address.toLowerCase().includes(q))
      );
    }
    this.currentPage = 1; // Reset to page 1 when searching
  }

  // Pagination computed property
  get paginatedItems() {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredItems.slice(startIndex, endIndex);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredItems.length / this.itemsPerPage);
  }

  // Pagination methods
  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.scrollToTop();
    }
  }

  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.scrollToTop();
    }
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.scrollToTop();
    }
  }

  scrollToTop() {
    const listSection = document.querySelector('.nearby-list-section');
    if (listSection) {
      listSection.scrollTop = 0;
    }
  }

  private updateMarkers() {
    this.markers = this.items
      .filter(item => item.latitude && item.longitude)
      .map(item => {
        const lat = parseFloat(String(item.latitude));
        const lng = parseFloat(String(item.longitude));

        // Assign colors based on type
        const iconUrl = item.type === 'hospital'
          ? 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png'
          : (item.type === 'pharmacy' ? 'http://maps.google.com/mapfiles/ms/icons/green-dot.png' :
            (item.type === 'health-centre' ? 'http://maps.google.com/mapfiles/ms/icons/orange-dot.png' : 'http://maps.google.com/mapfiles/ms/icons/red-dot.png'));

        return {
          position: { lat: lat, lng: lng },
          title: item.name,
          options: {
            icon: iconUrl,
            animation: (typeof google !== 'undefined') ? google.maps.Animation.DROP : 0,
            title: item.name
          },
          data: item
        };
      });
  }

  focusOnItem(item: any) {
    this.selectedItem = item;
    this.selectedItem = item;
    this.center = { lat: item.latitude, lng: item.longitude };
    this.zoom = 15;
    // Popup logic is handled in template with *ngIf or similar, 
    // or by referencing the MapMarker component if we want to open it programmatically.
  }

  getDirections(item: any) {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${item.latitude},${item.longitude}`;
    window.open(url, '_blank');
  }

  callNow(phone: string) {
    window.location.href = `tel:${phone}`;
  }
}
