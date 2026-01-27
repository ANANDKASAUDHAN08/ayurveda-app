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
  @ViewChild('filterDrawerContainer') filterDrawerContainer!: ElementRef;
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
  itemsPerPage: number = 12;
  totalItems: number = 0;
  totalPages: number = 0;
  showMobileLegend: boolean = false;
  Math = Math;

  get isMobile(): boolean {
    return window.innerWidth < 1024;
  }

  @HostListener('window:resize')
  onResize() {
    this.updateMapOptions();
  }

  // View Mode
  viewMode: 'list' | 'map' | 'both' = 'both';

  toggleMobileLegend() {
    this.showMobileLegend = !this.showMobileLegend;
  }

  // Advanced Filters
  selectedState = '';
  selectedCityDistrict = '';
  selectedPincodeSubdistrict = '';

  // Modal & Drawer
  showInfoModal = false;
  showFilterDrawer = false;
  selectedItemDetails: any = null;
  userRating = 0;

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
    // Close filter drawer on outside click (desktop both view only)
    if (this.showFilterDrawer && this.filterDrawerContainer) {

      // Check if click is on any filter button (don't close if it is)
      const target = event.target as HTMLElement;
      const isFilterButton = target.closest('.filter-toggle-btn');

      // Only close if click is outside drawer AND not on the filter button
      if (!this.filterDrawerContainer.nativeElement.contains(event.target) && !isFilterButton) {
        this.showFilterDrawer = false;
      }
    }
  }

  ngOnInit() {
    this.viewMode = window.innerWidth < 1024 ? 'list' : 'both';

    this.updateMapOptions();

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
        obs = this.mapService.getNearbyHospitals(lat, lng, 10, this.currentPage, this.itemsPerPage, this.selectedState, this.selectedCityDistrict, this.selectedPincodeSubdistrict, this.searchQuery);
        break;
      case 'pharmacy':
        obs = this.mapService.getNearbyPharmacies(lat, lng, 5, this.currentPage, this.itemsPerPage, this.selectedState, this.selectedCityDistrict, this.selectedPincodeSubdistrict, this.searchQuery);
        break;
      case 'doctor':
        obs = this.mapService.getNearbyDoctors(lat, lng, 5, this.currentPage, this.itemsPerPage, this.selectedState, this.selectedCityDistrict, this.selectedPincodeSubdistrict, this.searchQuery);
        break;
      case 'health-centre':
        if (this.searchMode === 'district' && this.districtQuery) {
          obs = this.mapService.getNearbyHealthCentres(lat, lng, 20, this.districtQuery, this.selectedState, this.selectedPincodeSubdistrict, this.currentPage, this.itemsPerPage);
        } else {
          obs = this.mapService.getNearbyHealthCentres(lat, lng, 15, this.selectedCityDistrict, this.selectedState, this.selectedPincodeSubdistrict, this.currentPage, this.itemsPerPage);
        }
        break;
    }

    obs.subscribe({
      next: (res) => {
        if (res.success) {
          const rawItems = (res.data || res.hospitals || []);
          this.items = rawItems.map((item: any) => ({ ...item, type: this.selectedType }));

          if (res.pagination) {
            this.totalItems = res.pagination.total;
            this.totalPages = res.pagination.pages;
          } else {
            this.totalItems = this.items.length;
            this.totalPages = 1;
          }

          this.filteredItems = this.items; // Directly set filtered items
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
        // Scroll to top to ensure header is visible in both mode
        setTimeout(() => this.scrollToTop(), 50);
      },
      error: (err) => {
        console.error('API Error:', err);
        this.loading = false;
        setTimeout(() => this.scrollToTop(), 50);
      }
    });
  }

  toggleType(type: 'hospital' | 'pharmacy' | 'doctor' | 'health-centre') {
    if (this.selectedType === type) return;
    this.selectedType = type;
    this.searchQuery = '';
    this.districtQuery = '';
    this.districtSuggestions = [];
    this.currentPage = 1; // Reset to page 1
    this.selectedState = '';
    this.selectedCityDistrict = '';
    this.selectedPincodeSubdistrict = '';
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
    this.applyFilters();
  }

  // Pagination computed property - simplified as server handles pagination
  get paginatedItems() {
    return this.filteredItems;
  }

  // Pagination methods
  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadNearby();
      this.scrollToTop();
    }
  }

  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadNearby();
      this.scrollToTop();
    }
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadNearby();
      this.scrollToTop();
    }
  }

  scrollToTop() {
    // In 'both' mode, scroll the sidebar container; in 'list' mode, scroll the list section
    if (this.viewMode === 'both') {
      const sidebar = document.querySelector('.nearby-sidebar');
      if (sidebar) {
        sidebar.scrollTop = 0;
      }
    } else {
      const listSection = document.querySelector('.nearby-list-section');
      if (listSection) {
        listSection.scrollTop = 0;
      }
    }
  }

  private updateMapOptions() {
    const isBothViewDesktop = this.viewMode === 'both' && window.innerWidth >= 1024;

    this.options = {
      disableDefaultUI: isBothViewDesktop,
      zoomControl: false,
      fullscreenControl: false,
      mapTypeControl: true,
      streetViewControl: true,
    };
  }

  private updateMarkers() {
    this.markers = this.items
      .filter(item => {
        const lat = parseFloat(String(item.latitude));
        const lng = parseFloat(String(item.longitude));
        return !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0;
      })
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
    const lat = parseFloat(String(item.latitude));
    const lng = parseFloat(String(item.longitude));

    if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
      this.center = { lat, lng };
      this.zoom = 15;
    }
  }

  getDirections(item: any) {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${item.latitude},${item.longitude}`;
    window.open(url, '_blank');
  }

  callNow(phone: string) {
    window.location.href = `tel:${phone}`;
  }

  // View Mode Toggles
  setViewMode(mode: 'list' | 'map' | 'both') {
    // Restriction: Disable 'both' view on mobile size
    if (window.innerWidth < 1024 && mode === 'both') {
      this.viewMode = 'list';
    } else {
      this.viewMode = mode;
    }

    this.updateMapOptions();

    // Trigger map resize if needed
    if (this.viewMode !== 'list') {
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
      }, 100);
    }
  }

  toggleFilterDrawer() {
    this.showFilterDrawer = !this.showFilterDrawer;
  }

  // Modal Methods
  openInfoModal(item: any) {
    this.selectedItemDetails = item;
    this.showInfoModal = true;
    this.userRating = 0;
  }

  closeInfoModal() {
    this.showInfoModal = false;
    this.selectedItemDetails = null;
  }

  submitRating() {
    if (this.userRating === 0) return;
    // For now, just show a success message or handle as needed
    alert(`Thank you for rating ${this.selectedItemDetails.name}!`);
    this.closeInfoModal();
  }

  applyFilters() {
    this.currentPage = 1;
    this.loadNearby();
  }

  clearFilters() {
    this.selectedState = '';
    this.selectedCityDistrict = '';
    this.selectedPincodeSubdistrict = '';
    this.currentPage = 1;
    this.loadNearby();
  }
}
