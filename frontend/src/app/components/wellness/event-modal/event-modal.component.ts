import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-event-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './event-modal.component.html',
  styleUrl: './event-modal.component.css'
})
export class EventModalComponent {
  @Input() isOpen = false;
  @Input() selectedDate: Date = new Date();
  @Input() editEvent: any = null;
  @Input() viewMode: 'allopathy' | 'ayurveda' = 'ayurveda';
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<any>();
  @Output() delete = new EventEmitter<number>();

  eventForm = {
    title: '',
    description: '',
    type: 'ritual',
    sub_type: 'ayurveda',
    category: 'ritual',
    value: '',
    unit: '',
    start_time: '',
    time_slot: 'morning', // morning, afternoon, evening, night
    dose_freq: 'once' // once, twice, thrice, four_times
  };

  ngOnChanges() {
    if (this.editEvent) {
      this.eventForm = { ...this.editEvent };
      this.eventForm.start_time = new Date(this.editEvent.start_time).toISOString().slice(0, 16);
    } else {
      this.resetForm();
    }
  }

  resetForm() {
    this.eventForm = {
      title: '',
      description: '',
      type: this.viewMode === 'allopathy' ? 'activity' : 'ritual',
      sub_type: this.viewMode,
      category: this.viewMode === 'allopathy' ? 'vital' : 'ritual',
      value: '',
      unit: '',
      start_time: new Date(this.selectedDate).toISOString().slice(0, 16),
      time_slot: 'morning',
      dose_freq: 'once'
    };
  }

  onSave() {
    this.save.emit(this.eventForm);
    this.closeModal();
  }

  onDelete() {
    if (this.editEvent && this.editEvent.id) {
      if (confirm('Are you sure you want to delete this entry?')) {
        this.delete.emit(this.editEvent.id);
        this.closeModal();
      }
    }
  }

  closeModal() {
    this.close.emit();
  }
}
