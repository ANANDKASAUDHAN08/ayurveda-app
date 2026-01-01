import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AllopathyService } from '../../../../shared/services/allopathy.service';

@Component({
  selector: 'app-allopathy-diagnostic',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './allopathy-diagnostic.component.html',
  styleUrl: './allopathy-diagnostic.component.css'
})
export class AllopathyDiagnosticComponent implements OnInit {
  packages: any[] = [];
  individualTests: any[] = [];
  loading = true;

  constructor(private allopathyService: AllopathyService) { }

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;

    // Load Health Packages
    this.allopathyService.getDiagnosticPackages().subscribe({
      next: (res: any) => {
        if (res.success) {
          this.packages = res.data.map((pkg: any) => ({
            ...pkg,
            tags: pkg.includes_tests ? pkg.includes_tests.split(',') : []
          }));
        }
      }
    });

    // Load Individual Tests (Top 4 for preview)
    this.allopathyService.getLabTests({ limit: 4 }).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.individualTests = res.data.results;
        }
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }
}
