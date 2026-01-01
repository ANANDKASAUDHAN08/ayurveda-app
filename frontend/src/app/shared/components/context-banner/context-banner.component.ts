import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MedicineType, FilterMode } from '../../services/medicine-type.service';

@Component({
  selector: 'app-context-banner',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './context-banner.component.html',
  styleUrl: './context-banner.component.css'
})
export class ContextBannerComponent {
  @Input() currentType: MedicineType | 'all' = 'all';
  @Input() filterMode: FilterMode = 'strict';
  @Input() resultCount: number = 0;
  @Input() itemName: string = 'items'; // e.g., 'doctors', 'medicines', 'hospitals'

  @Output() toggleFilter = new EventEmitter<void>();
  @Output() clearFilter = new EventEmitter<void>();
  @Output() switchType = new EventEmitter<MedicineType>();

  getTypeIcon(type: MedicineType): string {
    const icons: { [key: string]: string } = {
      ayurveda: '🌿',
      homeopathy: '💊',
      allopathy: '⚕️',
      all: '🏥'
    };
    return icons[type] || icons['all'];
  }

  getTypeName(type: MedicineType): string {
    const names: { [key: string]: string } = {
      ayurveda: 'Ayurveda',
      homeopathy: 'Homeopathy',
      allopathy: 'Allopathy',
      all: 'All Types'
    };
    return names[type] || names['all'];
  }

  onToggleFilter(): void {
    this.toggleFilter.emit();
  }

  onClearFilter(): void {
    this.clearFilter.emit();
  }

  onSwitchType(type: MedicineType): void {
    this.switchType.emit(type);
  }
}
