import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MedicineTypeService, MedicineType, MedicineTypeInfo } from '../../services/medicine-type.service';

@Component({
  selector: 'app-medicine-type-selector',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './medicine-type-selector.component.html',
  styleUrl: './medicine-type-selector.component.css'
})
export class MedicineTypeSelectorComponent implements OnInit {
  medicineTypes: MedicineTypeInfo[] = [];
  activeMedicineType: MedicineType | 'all' = 'all';
  isLoading = false;

  @Output() medicineTypeSelected = new EventEmitter<MedicineType | 'all'>();

  constructor(private medicineTypeService: MedicineTypeService) { }

  ngOnInit(): void {
    this.loadMedicineTypes();

    // Subscribe to active medicine type changes
    this.medicineTypeService.getCurrentType().subscribe(type => {
      this.activeMedicineType = type;
    });
  }

  loadMedicineTypes(): void {
    this.medicineTypes = this.medicineTypeService.getAllTypes();
  }

  selectMedicineType(type: MedicineType | 'all'): void {
    // Toggle: if clicking the same type, clear filter
    if (this.activeMedicineType === type) {
      this.clearFilter();
    } else {
      this.medicineTypeService.setMedicineType(type);
      this.medicineTypeSelected.emit(type);
    }
  }

  clearFilter(): void {
    this.medicineTypeService.setMedicineType('all');
    this.medicineTypeSelected.emit('all');
  }

  isActive(type: MedicineType | 'all'): boolean {
    return this.activeMedicineType === type;
  }
}
