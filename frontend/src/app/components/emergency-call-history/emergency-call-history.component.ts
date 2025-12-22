import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { EmergencyService } from '../../shared/services/emergency.service';

interface CallRecord {
  id: number;
  call_type: string;
  called_number: string;
  location_lat?: number;
  location_lng?: number;
  created_at: string;
}

@Component({
  selector: 'app-emergency-call-history',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './emergency-call-history.component.html',
  styleUrl: './emergency-call-history.component.css'
})
export class EmergencyCallHistoryComponent implements OnInit {
  calls: CallRecord[] = [];
  total = 0;
  limit = 20;
  offset = 0;
  loading = false;
  error: string | null = null;

  constructor(
    private emergencyService: EmergencyService,
    private router: Router
  ) { }

  ngOnInit() {
    this.loadCallHistory();
  }

  loadCallHistory() {
    this.loading = true;
    this.error = null;

    this.emergencyService.getCallHistory(this.limit, this.offset).subscribe({
      next: (response) => {
        this.calls = response.calls;
        this.total = response.total;
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Failed to load call history:', error);
        this.error = 'Failed to load call history';
        this.loading = false;
      }
    });
  }

  loadMore() {
    this.offset += this.limit;
    this.loading = true;

    this.emergencyService.getCallHistory(this.limit, this.offset).subscribe({
      next: (response) => {
        this.calls = [...this.calls, ...response.calls];
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Failed to load more calls:', error);
        this.loading = false;
      }
    });
  }

  getCallTypeIcon(callType: string): string {
    switch (callType) {
      case 'ambulance': return 'fa-ambulance';
      case 'hospital': return 'fa-hospital';
      case 'emergency_contact': return 'fa-phone';
      default: return 'fa-phone-volume';
    }
  }

  getCallTypeColor(callType: string): string {
    switch (callType) {
      case 'ambulance': return 'text-red-600 bg-red-100';
      case 'hospital': return 'text-blue-600 bg-blue-100';
      case 'emergency_contact': return 'text-emerald-600 bg-emerald-100';
      default: return 'text-slate-600 bg-slate-100';
    }
  }

  getCallTypeLabel(callType: string): string {
    switch (callType) {
      case 'ambulance': return 'Ambulance';
      case 'hospital': return 'Hospital';
      case 'emergency_contact': return 'Emergency Contact';
      default: return 'Emergency Call';
    }
  }

  getMapLink(lat?: number, lng?: number): string | null {
    if (lat && lng) {
      return `https://maps.google.com/?q=${lat},${lng}`;
    }
    return null;
  }

  exportToCsv() {
    const headers = ['Date', 'Time', 'Type', 'Number', 'Location'];
    const rows = this.calls.map(call => [
      new Date(call.created_at).toLocaleDateString(),
      new Date(call.created_at).toLocaleTimeString(),
      this.getCallTypeLabel(call.call_type),
      call.called_number,
      call.location_lat && call.location_lng ? `${call.location_lat}, ${call.location_lng}` : 'N/A'
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `emergency-calls-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  goBack() {
    this.router.navigate(['/emergency']);
  }
}
