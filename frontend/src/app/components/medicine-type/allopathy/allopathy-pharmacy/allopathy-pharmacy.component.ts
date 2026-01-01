import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AllopathyService } from '../../../../shared/services/allopathy.service';

@Component({
  selector: 'app-allopathy-pharmacy',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './allopathy-pharmacy.component.html',
  styleUrl: './allopathy-pharmacy.component.css'
})
export class AllopathyPharmacyComponent implements OnInit {
  refills = [
    { name: 'Metformin 500mg', daysLeft: 4 },
    { name: 'Atorvastatin 20mg', daysLeft: 7 }
  ];

  categories: any[] = [];
  featuredMedicines: any[] = [];
  orders = [
    { id: 'ORD-9921', status: 'Out for Delivery' }
  ];
  loading = true;

  constructor(private allopathyService: AllopathyService) { }

  ngOnInit(): void {
    this.loadPharmacyData();
  }

  loadPharmacyData(): void {
    this.loading = true;
    this.allopathyService.getPharmacyOverview().subscribe({
      next: (res) => {
        if (res.success) {
          this.categories = res.data.categories.map((cat: string) => ({
            name: cat,
            icon: this.getIconForCategory(cat)
          }));
          this.featuredMedicines = res.data.featuredMedicines;
        }
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  getIconForCategory(cat: string): string {
    const icons: any = {
      'Cardiac': '🫀',
      'Diabetes': '🩸',
      'Vitamins': '💊',
      'Pain Relief': '🩹',
      'Skin Care': '🧴'
    };
    return icons[cat] || '📦';
  }
}
