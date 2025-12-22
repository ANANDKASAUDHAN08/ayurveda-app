import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MedicineTypeService, MedicineType } from '../../services/medicine-type.service';

@Component({
  selector: 'app-medicine-type-selector',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './medicine-type-selector.component.html',
  styleUrl: './medicine-type-selector.component.css'
})
export class MedicineTypeSelectorComponent implements OnInit {
  medicineTypes: MedicineType[] = [];
  activeMedicineTypeId: number | null = null;
  isLoading = false;

  @Output() medicineTypeSelected = new EventEmitter<number | null>();

  constructor(private medicineTypeService: MedicineTypeService) { }

  ngOnInit(): void {
    this.loadMedicineTypes();

    // Subscribe to active medicine type changes
    this.medicineTypeService.activeMedicineType$.subscribe(typeId => {
      this.activeMedicineTypeId = typeId;
    });
  }

  loadMedicineTypes(): void {
    this.isLoading = true;
    this.medicineTypeService.getAllMedicineTypes().subscribe({
      next: (response) => {
        if (response.success) {
          this.medicineTypes = response.data;
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading medicine types:', error);
        this.isLoading = false;
      }
    });
  }

  selectMedicineType(typeId: number): void {
    // Toggle: if clicking the same type, clear filter
    if (this.activeMedicineTypeId === typeId) {
      this.clearFilter();
    } else {
      this.medicineTypeService.setActiveMedicineType(typeId);
      this.medicineTypeSelected.emit(typeId);
    }
  }

  clearFilter(): void {
    this.medicineTypeService.clearFilter();
    this.medicineTypeSelected.emit(null);
  }

  isActive(typeId: number): boolean {
    return this.activeMedicineTypeId === typeId;
  }
}
