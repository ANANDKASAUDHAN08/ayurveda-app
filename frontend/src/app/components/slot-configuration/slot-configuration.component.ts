import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AppointmentService, DateException } from '../../services/appointment.service';
import { SnackbarService } from '../../services/snackbar.service';

@Component({
    selector: 'app-slot-configuration',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule],
    templateUrl: './slot-configuration.component.html'
})
export class SlotConfigurationComponent implements OnInit {
    days = [
        { id: 1, name: 'Monday', selected: true, start: '09:00', end: '17:00' },
        { id: 2, name: 'Tuesday', selected: true, start: '09:00', end: '17:00' },
        { id: 3, name: 'Wednesday', selected: true, start: '09:00', end: '17:00' },
        { id: 4, name: 'Thursday', selected: true, start: '09:00', end: '17:00' },
        { id: 5, name: 'Friday', selected: true, start: '09:00', end: '17:00' },
        { id: 6, name: 'Saturday', selected: false, start: '10:00', end: '14:00' },
        { id: 0, name: 'Sunday', selected: false, start: '10:00', end: '14:00' }
    ];

    slotDuration = 30;
    generateDays = 30;
    loading = false;

    // Date Exceptions
    dateExceptions: DateException[] = [];
    newException = {
        date: '',
        type: 'unavailable' as 'unavailable' | 'custom',
        startTime: '09:00',
        endTime: '17:00'
    };

    constructor(
        private appointmentService: AppointmentService,
        private snackbar: SnackbarService,
        private router: Router
    ) { }

    ngOnInit() {
        this.loadAvailability();
        this.loadDateExceptions();
    }

    loadAvailability() {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            const user = JSON.parse(userStr);
            if (user && user.id) {
                this.appointmentService.getDoctorAvailability(user.id).subscribe({
                    next: (data: any) => {
                        if (data && data.length > 0) {
                            data.forEach((item: any) => {
                                const day = this.days.find(d => d.id === item.day_of_week);
                                if (day) {
                                    day.selected = !!item.is_active;
                                    day.start = item.start_time.substring(0, 5);
                                    day.end = item.end_time.substring(0, 5);
                                }
                            });
                        }
                    },
                    error: (err: any) => console.error('Error loading availability:', err)
                });
            }
        }
    }

    saveAvailability() {
        this.loading = true;

        const availabilityPayload = this.days
            .filter(d => d.selected)
            .map(d => ({
                dayOfWeek: d.id,
                startTime: d.start + ':00',
                endTime: d.end + ':00',
                slotDuration: this.slotDuration,
                isActive: true
            }));

        if (availabilityPayload.length === 0) {
            this.snackbar.show('Please select at least one day', 'error');
            this.loading = false;
            return;
        }

        this.appointmentService.setDoctorAvailability(availabilityPayload, this.generateDays)
            .subscribe({
                next: () => {
                    this.loading = false;
                    this.snackbar.show('Availability saved and slots generated successfully!', 'success');
                    this.router.navigate(['/doctor/dashboard']);
                },
                error: (err: any) => {
                    console.error('Error saving availability:', err);
                    this.snackbar.show('Error saving availability', 'error');
                    this.loading = false;
                }
            });
    }

    loadDateExceptions() {
        this.appointmentService.getMyDateExceptions().subscribe({
            next: (data: DateException[]) => {
                this.dateExceptions = data;
            },
            error: (err: any) => {
                console.error('Error loading date exceptions:', err);
            }
        });
    }

    addException() {
        if (!this.newException.date) {
            this.snackbar.show('Please select a date', 'error');
            return;
        }

        const exception: DateException = {
            date: this.newException.date,
            isAvailable: this.newException.type === 'custom',
            startTime: this.newException.type === 'custom' ? this.newException.startTime : null,
            endTime: this.newException.type === 'custom' ? this.newException.endTime : null,
            slotDuration: this.slotDuration
        };

        this.appointmentService.setDateExceptions([exception]).subscribe({
            next: () => {
                this.snackbar.show('Date exception added successfully', 'success');
                this.loadDateExceptions();
                // Reset form
                this.newException = {
                    date: '',
                    type: 'unavailable',
                    startTime: '09:00',
                    endTime: '17:00'
                };
            },
            error: (err: any) => {
                console.error('Error adding exception:', err);
                this.snackbar.show('Error adding exception', 'error');
            }
        });
    }

    deleteException(exceptionDate: string) {
        if (confirm('Are you sure you want to delete this exception?')) {
            this.appointmentService.deleteDateException(exceptionDate).subscribe({
                next: () => {
                    this.snackbar.show('Exception deleted successfully', 'success');
                    this.loadDateExceptions();
                },
                error: (err: any) => {
                    console.error('Error deleting exception:', err);
                    this.snackbar.show('Error deleting exception', 'error');
                }
            });
        }
    }

    formatDate(dateStr: string): string {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    }
}
