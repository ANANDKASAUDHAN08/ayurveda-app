import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AllopathyService } from '../../../../shared/services/allopathy.service';

@Component({
  selector: 'app-allopathy-records',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './allopathy-records.component.html',
  styleUrl: './allopathy-records.component.css'
})
export class AllopathyRecordsComponent implements OnInit {
  filters = [
    { name: 'All', count: 0, type: 'all', icon: 'fas fa-th-large' },
    { name: 'Prescriptions', count: 0, type: 'prescription', icon: 'fas fa-file-medical' },
    { name: 'Lab Reports', count: 0, type: 'lab_report', icon: 'fas fa-flask' },
    { name: 'Radiology', count: 0, type: 'radiology', icon: 'fas fa-x-ray' }
  ];

  documents: any[] = [];
  activeFilter = 'all';
  loading = true;

  constructor(private allopathyService: AllopathyService) { }

  ngOnInit(): void {
    this.loadRecords();
  }

  loadRecords(type: string = 'all'): void {
    this.loading = true;
    this.activeFilter = type;
    this.allopathyService.getMedicalRecords(type).subscribe({
      next: (res) => {
        if (res.success) {
          this.documents = res.data.map((doc: any) => ({
            ...doc,
            name: doc.document_name,
            provider: doc.provider_name,
            date: new Date(doc.record_date).toLocaleDateString(),
            icon: this.getIconForType(doc.type)
          }));

          // Update counts (simple mock update for now based on total)
          if (type === 'all') {
            this.filters[0].count = this.documents.length;
          }
        }
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  getIconForType(type: string): string {
    switch (type) {
      case 'prescription': return 'fas fa-file-medical';
      case 'lab_report': return 'fas fa-flask';
      case 'radiology': return 'fas fa-x-ray';
      default: return 'fas fa-file-alt';
    }
  }

  setFilter(type: string): void {
    this.loadRecords(type);
  }
}
