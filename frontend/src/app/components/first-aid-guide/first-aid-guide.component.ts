import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { FirstAidService, FirstAidGuide } from '../../shared/services/first-aid.service';

@Component({
  selector: 'app-first-aid-guide',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './first-aid-guide.component.html',
  styleUrl: './first-aid-guide.component.css'
})
export class FirstAidGuideComponent implements OnInit {
  allGuides: FirstAidGuide[] = [];
  filteredGuides: FirstAidGuide[] = [];
  searchQuery = '';
  selectedCategory: 'all' | 'critical' | 'serious' | 'common' = 'all';
  selectedGuide: FirstAidGuide | null = null;

  constructor(
    private firstAidService: FirstAidService,
    private router: Router
  ) { }

  ngOnInit() {
    this.allGuides = this.firstAidService.getAllGuides();
    this.filteredGuides = this.allGuides;
  }

  onSearch() {
    if (this.searchQuery.trim()) {
      this.filteredGuides = this.firstAidService.searchGuides(this.searchQuery);
    } else {
      this.applyFilter();
    }
  }

  filterByCategory(category: 'all' | 'critical' | 'serious' | 'common') {
    this.selectedCategory = category;
    this.searchQuery = '';
    this.applyFilter();
  }

  private applyFilter() {
    if (this.selectedCategory === 'all') {
      this.filteredGuides = this.allGuides;
    } else {
      this.filteredGuides = this.firstAidService.getGuidesByCategory(this.selectedCategory);
    }
  }

  viewGuideDetail(guide: FirstAidGuide) {
    this.selectedGuide = guide;
  }

  closeDetail() {
    this.selectedGuide = null;
  }

  getCategoryColor(category: string): string {
    switch (category) {
      case 'critical': return 'red';
      case 'serious': return 'orange';
      case 'common': return 'blue';
      default: return 'slate';
    }
  }

  callAmbulance() {
    if (confirm('⚠️ EMERGENCY CALL\n\nThis will dial 108 for emergency ambulance service.\n\nProceed?')) {
      window.location.href = 'tel:108';
    }
  }

  printGuide() {
    window.print();
  }

  goBackToEmergency() {
    this.router.navigate(['/emergency']);
  }
}
