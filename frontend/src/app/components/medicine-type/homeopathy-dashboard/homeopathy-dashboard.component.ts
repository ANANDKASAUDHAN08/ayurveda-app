import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MedicineTypeService } from '../../../shared/services/medicine-type.service';
import { DoctorService } from '../../../shared/services/doctor.service';

@Component({
  selector: 'app-homeopathy-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './homeopathy-dashboard.component.html',
  styleUrl: './homeopathy-dashboard.component.css'
})
export class HomeopathyDashboardComponent implements OnInit {
  doctors: any[] = [];
  loading = true;

  constructor(
    private medicineTypeService: MedicineTypeService,
    private doctorService: DoctorService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.medicineTypeService.setMedicineType('homeopathy');
    this.loadHomeopathyDoctors();
  }

  loadHomeopathyDoctors(): void {
    this.doctorService.getDoctors({ medicine_type: 'homeopathy' }).subscribe({
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
    this.router.navigate(['/user/doctors']);
  }
}
