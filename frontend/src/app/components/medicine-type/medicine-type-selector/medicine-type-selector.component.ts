import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MedicineTypeService, MedicineType } from '../../../shared/services/medicine-type.service';

@Component({
  selector: 'app-medicine-type-selector',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './medicine-type-selector.component.html',
  styleUrl: './medicine-type-selector.component.css'
})
export class MedicineTypeSelectorComponent implements OnInit {
  medicineTypes: { id: MedicineType; name: string; tagline: string; icon: string; color: string; gradient: string; route: string; }[] = [];
  loading = true;

  constructor(
    private medicineTypeService: MedicineTypeService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    // Get all medicine types from service
    this.medicineTypes = this.medicineTypeService.getAllTypes();
    console.log('📊 Medicine Types:', this.medicineTypes);
    this.loading = false;
  }

  selectType(typeId: MedicineType): void {
    console.log('✅ Selected medicine type:', typeId);

    // Save selection to service (persists to localStorage)
    this.medicineTypeService.setMedicineType(typeId);

    // Navigate to the appropriate dashboard
    this.router.navigate([`/${typeId}`]);
  }

  getColorForType(typeId: MedicineType): string {
    return this.medicineTypeService.getColor(typeId);
  }

  getGradientForType(typeId: MedicineType): string {
    return this.medicineTypeService.getGradient(typeId);
  }
}
