import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppointmentService, TimeSlot } from '../../shared/services/appointment.service';
import { SnackbarService } from '../../shared/services/snackbar.service';

interface CalendarDay {
  date: Date;
  dateString: string;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isPast: boolean;
  hasSlots?: boolean;
}

@Component({
  selector: 'app-booking-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './booking-modal.component.html'
})
export class BookingModalComponent implements OnInit {
  @Input() doctor: any;
  @Input() isOpen = false;
  @Input() isInline = false;
  @Output() close = new EventEmitter<void>();
  @Output() bookingConfirmed = new EventEmitter<any>();

  selectedDate: string = '';
  availableSlots: TimeSlot[] = [];
  selectedSlot: TimeSlot | null = null;
  notes: string = '';
  loading = false;
  error: string = '';
  step: 'calendar' | 'time' | 'confirm' = 'calendar';

  // Calendar properties
  currentMonth: Date = new Date();
  calendarDays: CalendarDay[] = [];
  monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  constructor(
    private appointmentService: AppointmentService,
    private snackbar: SnackbarService
  ) { }

  ngOnInit() {
    this.generateCalendar();
  }

  generateCalendar() {
    const year = this.currentMonth.getFullYear();
    const month = this.currentMonth.getMonth();

    // Get first day of month
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // Get starting day (Sunday of the week containing the 1st)
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    // Get ending day (Saturday of the week containing the last day)
    const endDate = new Date(lastDay);
    endDate.setDate(endDate.getDate() + (6 - lastDay.getDay()));

    // Generate all days
    this.calendarDays = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let current = new Date(startDate);
    while (current <= endDate) {
      const dateString = current.toISOString().split('T')[0];
      const isPast = current < today;

      this.calendarDays.push({
        date: new Date(current),
        dateString,
        dayNumber: current.getDate(),
        isCurrentMonth: current.getMonth() === month,
        isToday: current.getTime() === today.getTime(),
        isPast,
        hasSlots: false
      });

      current.setDate(current.getDate() + 1);
    }

    // Fetch slots for the visible range to show indicators
    if (this.doctor) {
      const startStr = startDate.toISOString().split('T')[0];
      const endStr = endDate.toISOString().split('T')[0];

      this.appointmentService.getSlotsByDateRange(this.doctor.id, startStr, endStr)
        .subscribe({
          next: (slots) => {
            // Create a set of dates that have available slots
            const availableDates = new Set(
              slots.filter(s => !s.is_booked).map(s => s.slot_date.split('T')[0])
            );

            // Update calendar days
            this.calendarDays.forEach(day => {
              if (availableDates.has(day.dateString)) {
                day.hasSlots = true;
              }
            });
          },
          error: (err) => console.error('Error fetching monthly slots:', err)
        });
    }
  }

  previousMonth() {
    this.currentMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() - 1, 1);
    this.generateCalendar();
  }

  nextMonth() {
    this.currentMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() + 1, 1);
    this.generateCalendar();
  }

  selectDate(day: CalendarDay) {
    if (day.isPast || !day.isCurrentMonth) return;

    this.selectedDate = day.dateString;
    this.selectedSlot = null;
    this.error = '';
    this.loadAvailableSlots();
    this.step = 'time';
  }

  loadAvailableSlots() {
    if (!this.doctor || !this.selectedDate) return;

    this.loading = true;
    this.error = '';

    this.appointmentService.getAvailableSlots(this.doctor.id, this.selectedDate)
      .subscribe({
        next: (slots) => {
          this.availableSlots = slots;
          this.loading = false;

          if (slots.length === 0) {
            this.error = 'No available slots for this date. Please select another date.';
          }
        },
        error: (err) => {
          console.error('Error loading slots:', err);
          this.error = 'Failed to load available slots. Please try again.';
          this.loading = false;
        }
      });
  }

  selectSlot(slot: TimeSlot) {
    this.selectedSlot = slot;
    this.step = 'confirm';
  }

  confirmBooking() {
    if (!this.selectedSlot) return;

    this.loading = true;
    this.error = '';

    this.appointmentService.bookAppointment(this.selectedSlot.id, this.notes)
      .subscribe({
        next: (response) => {
          this.loading = false;
          this.snackbar.success('Appointment booked successfully!');
          this.bookingConfirmed.emit(response);
          this.onClose();
        },
        error: (err) => {
          console.error('Error booking appointment:', err);
          this.error = err.error?.message || 'Failed to book appointment. Please try again.';
          this.snackbar.error(this.error);
          this.loading = false;
        }
      });
  }

  onClose() {
    this.isOpen = false;
    this.selectedDate = '';
    this.selectedSlot = null;
    this.availableSlots = [];
    this.notes = '';
    this.error = '';
    this.step = 'calendar';
    this.currentMonth = new Date();
    this.generateCalendar();
    this.close.emit();
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  }

  formatTime(timeString: string): string {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  }

  goBack() {
    if (this.step === 'time') {
      this.step = 'calendar';
      this.selectedSlot = null;
      this.availableSlots = [];
    } else if (this.step === 'confirm') {
      this.step = 'time';
    }
  }

  get currentMonthYear(): string {
    return `${this.monthNames[this.currentMonth.getMonth()]} ${this.currentMonth.getFullYear()}`;
  }
}
