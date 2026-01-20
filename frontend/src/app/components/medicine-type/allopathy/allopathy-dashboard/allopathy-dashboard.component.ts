import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MedicineTypeService } from '../../../../shared/services/medicine-type.service';
import { DoctorService } from '../../../../shared/services/doctor.service';
import { AllopathyPrinciplesComponent } from '../allopathy-principles/allopathy-principles.component';
import { AllopathyBenefitsComponent } from '../allopathy-benefits/allopathy-benefits.component';
import { AllopathyDiagnosticComponent } from '../allopathy-diagnostic/allopathy-diagnostic.component';
import { AllopathyPharmacyComponent } from '../allopathy-pharmacy/allopathy-pharmacy.component';
import { AllopathyRecordsComponent } from '../allopathy-records/allopathy-records.component';
import { AllopathyService } from '../../../../shared/services/allopathy.service';

@Component({
  selector: 'app-allopathy-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    AllopathyPrinciplesComponent,
    AllopathyBenefitsComponent,
    AllopathyDiagnosticComponent,
    AllopathyPharmacyComponent,
    AllopathyRecordsComponent
  ],
  templateUrl: './allopathy-dashboard.component.html',
  styleUrl: './allopathy-dashboard.component.css'
})
export class AllopathyDashboardComponent implements OnInit {
  doctors: any[] = [];
  loading = true;

  // Tab switching state
  activeTab: 'home' | 'principles' | 'benefits' | 'diagnostics' | 'pharmacy' | 'records' = 'home';

  // Real-time Vital Stats (Mock)
  vitals = {
    heartRate: 72,
    bloodPressure: '120/80',
    oxygen: 98,
    status: 'Stable'
  };

  constructor(
    private medicineTypeService: MedicineTypeService,
    private doctorService: DoctorService,
    private allopathyService: AllopathyService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.medicineTypeService.setMedicineType('allopathy');
    this.loadAllopathyDoctors();
    this.loadDashboardStats();
  }

  loadDashboardStats(): void {
    this.allopathyService.getDashboardStats().subscribe({
      next: (res) => {
        if (res.success) {
          // You could update actual vitals if backend provided them, 
          // for now we just show we connected.
          console.log('Dashboard Stats loaded:', res.data);
        }
      }
    });
  }

  loadAllopathyDoctors(): void {
    this.doctorService.getDoctors({ medicine_type: 'allopathy' }).subscribe({
      next: (doctors) => {
        this.doctors = doctors.slice(0, 3);
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load doctors:', err);
        this.loading = false;
      }
    });
  }

  viewAllDoctors(): void {
    this.router.navigate(['/find-doctors']);
  }

  switchTab(tab: 'home' | 'principles' | 'benefits' | 'diagnostics' | 'pharmacy' | 'records'): void {
    this.activeTab = tab;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
