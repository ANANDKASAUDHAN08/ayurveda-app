import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CalendarService } from '../../../shared/services/calendar.service';
import { AyurvedaService, Herb } from '../../../shared/services/ayurveda.service';
import { AuthService } from '../../../shared/services/auth.service';
import { EventModalComponent } from '../event-modal/event-modal.component';

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [CommonModule, FormsModule, EventModalComponent],
  templateUrl: './calendar.component.html',
  styleUrl: './calendar.component.css'
})
export class CalendarComponent implements OnInit {
  currentDate = new Date();
  displayDate = new Date();
  days: Date[] = [];
  events: any[] = [];
  selectedDateEvents: any[] = [];
  selectedDate: Date = new Date();

  // Modal & Interactivity State
  isModalOpen = false;
  editingEvent: any = null;
  isSwitchingMonth = false;
  hoveredDay: Date | null = null;

  // New Advanced State
  currentDosha: 'vata' | 'pitta' | 'kapha' = 'kapha';
  currentMood: 'sunny' | 'rainy' | 'balanced' = 'balanced';
  vitalityScore: number = 75; // 0-100
  currentWeather: any = null;

  // Dinacharya Checklist
  dinacharyaList = [
    { id: 1, title: 'Tongue Scraping', description: 'Clear toxins (Ama) from the tongue.', done: false, category: 'ayurveda' },
    { id: 2, title: 'Oil Pulling', description: 'Strengthen oral health and jaw.', done: false, category: 'ayurveda' },
    { id: 3, title: 'Meditation', description: 'Mental clarity and focus.', done: false, category: 'both' },
    { id: 4, title: 'Abhyanga', description: 'Self-massage with warm oil.', done: false, category: 'ayurveda' },
    { id: 5, title: 'Vitals Check', description: 'Log your morning BP/Sugar.', done: false, category: 'allopathy' }
  ];

  // View Filtering (allopathy | ayurveda)
  viewMode: 'allopathy' | 'ayurveda' = 'allopathy';

  // Heatmap Data
  heatmapData: any[] = [];

  // Herb Scheduler
  availableHerbs: Herb[] = [];
  scheduledHerbs: any[] = [];
  herbSearchQuery: string = '';
  isHerbLoading = false;

  constructor(
    private calendarService: CalendarService,
    private ayurvedaService: AyurvedaService,
    private authService: AuthService
  ) {
    setInterval(() => this.updateDoshaCycles(), 60000);
  }

  // Helper for template
  getNow() { return new Date(); }

  ngOnInit() {
    this.loadPersistence();
    this.generateCalendar();
    this.loadEvents();
    this.loadHeatmap();
    this.loadAvailableHerbs();
    this.updateDoshaCycles();
    setInterval(() => this.updateDoshaCycles(), 60000); // Update every minute
  }

  loadPersistence() {
    const saved = localStorage.getItem('wellnessViewMode');
    if (saved === 'allopathy' || saved === 'ayurveda') {
      this.viewMode = saved;
    } else {
      this.viewMode = 'allopathy';
      localStorage.setItem('wellnessViewMode', 'allopathy');
    }
  }

  loadAvailableHerbs() {
    this.ayurvedaService.getHerbs().subscribe(herbs => {
      this.availableHerbs = herbs;
    });
  }

  loadHeatmap() {
    const start = this.days[0].toISOString();
    const end = this.days[this.days.length - 1].toISOString();
    this.calendarService.getSymptomHeatmap(start, end).subscribe(res => {
      if (res.success) {
        this.heatmapData = res.data;
      }
    });
  }

  updateDoshaCycles() {
    const now = new Date();
    const hour = now.getHours();
    const minutes = now.getMinutes();

    // 24h rotation calculation: 00:00 points to Top (SVG -rotate-90 adjusts coordinate space)
    this.currentHourRotation = ((hour % 24) * 60 + minutes) * (360 / (24 * 60));

    if ((hour >= 6 && hour < 10) || (hour >= 18 && hour < 22)) {
      this.currentDosha = 'kapha';
    } else if ((hour >= 10 && hour < 14) || (hour >= 22 || hour < 2)) {
      this.currentDosha = 'pitta';
    } else {
      this.currentDosha = 'vata';
    }
  }

  currentHourRotation: number = 0;

  getDoshaColor(dosha: string): string {
    if (this.viewMode === 'ayurveda') {
      return '#10b981'; // Emerald for Ayurveda
    }
    return '#3b82f6'; // Blue for Allopathy
  }

  getActiveDoshaOffset(): number {
    const hour = new Date().getHours();
    // Use the 24h cycle offset logic
    // Pitta: 22-02 (Offset -91.66)
    // Vata: 02-06 (Offset -8.33)
    // Kapha: 06-10 (Offset -25)
    // Pitta: 10-14 (Offset -41.66)
    // Vata: 14-18 (Offset -58.33)
    // Kapha: 18-22 (Offset -75)

    if (hour >= 22 || hour < 2) return 91.66;
    if (hour >= 18) return 75;
    if (hour >= 14) return 58.33;
    if (hour >= 10) return 41.66;
    if (hour >= 6) return 25;
    return 8.33;
  }

  getLunarDay(date: Date): number {
    // Approximate Lunar Age (0-29)
    // Reference New Moon: Jan 11, 2024
    const reference = new Date(2024, 0, 11);
    const diff = (date.getTime() - reference.getTime()) / (1000 * 3600 * 24);
    return Math.floor(diff % 29.53);
  }

  getMoonIcon(date: Date): string {
    const day = this.getLunarDay(date);
    if (day === 0) return '🌑';
    if (day === 14 || day === 15) return '🌕';
    return '';
  }

  formatDoseFreq(freq: string): string {
    if (!freq) return '';
    return freq.replace(/_/g, ' ');
  }

  isEkadashi(date: Date): boolean {
    const day = this.getLunarDay(date);
    return day === 11 || day === 26; // Approx Ekadashi
  }

  isSignificantLunarDay(date: Date): boolean {
    const day = this.getLunarDay(date);
    return day === 0 || day === 11 || day === 14 || day === 15 || day === 26;
  }

  getSpecialDayInfo(date: Date): { icon: string, label: string } | null {
    const m = date.getMonth();
    const d = date.getDate();

    // Seasonal Markings
    if (m === 2 && d === 20) return { icon: '🌱', label: 'Spring Equinox' };
    if (m === 5 && d === 21) return { icon: '☀️', label: 'Summer Solstice' };
    if (m === 8 && d === 22) return { icon: '🍂', label: 'Autumn Equinox' };
    if (m === 11 && d === 21) return { icon: '❄️', label: 'Winter Solstice' };

    // Ritucharya Transitions (Approx)
    if (m === 1 && d === 15) return { icon: '🌿', label: 'Shishira -> Vasanta' };
    if (m === 3 && d === 15) return { icon: '🌻', label: 'Vasanta -> Grishma' };
    if (m === 5 && d === 15) return { icon: '🌧️', label: 'Grishma -> Varsha' };

    return null;
  }

  generateCalendar() {
    const year = this.displayDate.getFullYear();
    const month = this.displayDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const endDate = new Date(lastDay);
    endDate.setDate(endDate.getDate() + (6 - lastDay.getDay()));

    this.days = [];
    let curr = new Date(startDate);
    while (curr <= endDate) {
      this.days.push(new Date(curr));
      curr.setDate(curr.getDate() + 1);
    }
  }

  loadEvents() {
    const start = this.days[0].toISOString();
    const end = this.days[this.days.length - 1].toISOString();

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        this.fetchEvents(start, end, pos.coords.latitude, pos.coords.longitude);
      },
      () => {
        this.fetchEvents(start, end);
      }
    );
  }

  fetchEvents(start: string, end: string, lat?: number, lon?: number) {
    this.calendarService.getEvents(start, end, lat, lon).subscribe({
      next: (res) => {
        if (res.success) {
          this.events = res.data;
          this.currentWeather = res.weather;
          this.selectDate(this.selectedDate);
        }
      }
    });
  }

  selectDate(date: Date) {
    this.selectedDate = date;
    const dateStr = date.toDateString();

    this.selectedDateEvents = this.events.filter(e => {
      const eventDate = new Date(e.start_time).toDateString();
      const matchesDate = eventDate === dateStr;

      if (!matchesDate) return false;

      // Filter by philosophy
      return e.sub_type === this.viewMode || e.is_system_generated;
    });
  }

  isToday(date: Date): boolean {
    return date.toDateString() === new Date().toDateString();
  }

  isSelected(date: Date): boolean {
    return date.toDateString() === this.selectedDate.toDateString();
  }

  isDifferentMonth(date: Date): boolean {
    return date.getMonth() !== this.displayDate.getMonth();
  }


  toggleDinacharya(item: any) {
    item.done = !item.done;
    const completedCount = this.dinacharyaList.filter(i => i.done).length;
    this.vitalityScore = 60 + (completedCount * 8); // Dynamic score updates
  }

  getTerminology(): any {
    const mapping = {
      allopathy: {
        header: 'Health Dashboard',
        subtext: 'Clinical Tracking',
        greeting: 'Ready for your clinical check-in?',
        routine: 'Daily Regimen',
        routineSub: 'Your prescribed medical routine.',
        meds: 'Prescription Tracker',
        medsSub: 'Plan your medications and supplements.',
        icon: '🩺'
      },
      ayurveda: {
        header: 'Wellness Calendar',
        subtext: 'Health Intelligence',
        greeting: 'Seeking your daily balance?',
        routine: 'Dinacharya Daily',
        routineSub: 'Synthesized from your current alignment.',
        meds: 'Herb Scheduler',
        medsSub: 'Plan your botanicals and rituals.',
        icon: '🪷'
      },
    };
    return mapping[this.viewMode];
  }

  getBiologicalStatus(): string {
    const hour = new Date().getHours();

    if (hour >= 8 && hour < 12) return "Cognitive Peak";
    if (hour >= 12 && hour < 14) return "Metabolic Peak";
    if (hour >= 15 && hour < 19) return "Physical Peak";
    if (hour >= 23 || hour < 4) return "Deep Recovery";
    return "Maintenance Flow";
  }

  getWeatherInsight(): string {
    const hour = new Date().getHours();

    // In Allopathy mode, focus on physical impact
    if (this.viewMode === 'allopathy') {
      if (this.currentWeather?.temp > 30) {
        return "High UV/Heat detected. Stay hydrated (2-3L) and favor light fabrics.";
      }
      return "Optimal metabolic window. Ensure Vitamin D intake and stay active.";
    }

    // Ayurveda logic
    if (this.currentDosha === 'pitta') {
      return "High solar intensity detected. Favor cooling pomegranate juice and avoid direct peak sun.";
    } else if (this.currentDosha === 'kapha') {
      return "Morning dampness detected. A brisk walk and dry-brushing will clear stagnant Kapha.";
    } else {
      return "Windy transition period. Keep your joints warm and favor cooked, grounding root vegetables.";
    }
  }

  getMoodIcon(): string {
    if (this.viewMode === 'allopathy') return '🩺';
    return this.currentDosha === 'pitta' ? '☀️' : (this.currentDosha === 'kapha' ? '☁️' : '🌬️');
  }

  prevMonth() {
    this.isSwitchingMonth = true;
    const newDate = new Date(this.displayDate);
    newDate.setMonth(newDate.getMonth() - 1);
    this.displayDate = newDate;
    this.generateCalendar();
    this.loadEvents();
    setTimeout(() => this.isSwitchingMonth = false, 500);
  }

  nextMonth() {
    this.isSwitchingMonth = true;
    const newDate = new Date(this.displayDate);
    newDate.setMonth(newDate.getMonth() + 1);
    this.displayDate = newDate;
    this.generateCalendar();
    this.loadEvents();
    setTimeout(() => this.isSwitchingMonth = false, 500);
  }

  setViewMode(mode: 'allopathy' | 'ayurveda') {
    this.viewMode = mode;
    localStorage.setItem('wellnessViewMode', mode);
    this.selectDate(this.selectedDate);
  }

  getEventsForDate(date: Date) {
    const dateStr = date.toDateString();
    return this.events.filter(e => {
      const matchesDate = new Date(e.start_time).toDateString() === dateStr;
      if (!matchesDate) return false;
      return e.sub_type === this.viewMode || e.is_system_generated;
    });
  }

  getDayIntensity(date: Date): number {
    const dateStr = date.toISOString().split('T')[0];
    const dayData = this.heatmapData.find(d => d.date === dateStr);
    return dayData ? dayData.maxIntensity || 0 : 0;
  }

  scheduleHerb(herb: Herb) {
    const eventData = {
      title: `Take ${herb.name}`,
      description: `Scheduled herb: ${herb.name}. ${herb.usage_instructions || ''}`,
      type: 'medication',
      sub_type: 'ayurveda',
      category: 'supplement',
      start_time: this.selectedDate,
      medication_info: {
        herbId: herb.id,
        name: herb.name,
        instructions: herb.usage_instructions
      }
    };

    this.calendarService.createEvent(eventData).subscribe({
      next: (res) => {
        if (res.success) {
          this.events.push(res.data);
          this.selectDate(this.selectedDate);
          this.herbSearchQuery = '';
        }
      }
    });
  }

  getFilteredHerbs() {
    if (!this.herbSearchQuery) return [];
    return this.availableHerbs.filter(h =>
      h.name.toLowerCase().includes(this.herbSearchQuery.toLowerCase())
    ).slice(0, 5);
  }

  openAddModal() {
    this.editingEvent = null;
    this.isModalOpen = true;
  }

  editEvent(event: any) {
    if (event.is_system_generated) return; // Prevent editing system suggestions
    this.editingEvent = event;
    this.isModalOpen = true;
  }

  onSaveEvent(eventData: any) {
    if (eventData.id) {
      this.calendarService.updateEvent(eventData.id, eventData).subscribe({
        next: (res) => {
          if (res.success) {
            const idx = this.events.findIndex(e => e.id === eventData.id);
            this.events[idx] = res.data;
            this.selectDate(this.selectedDate);
          }
        }
      });
    } else {
      this.calendarService.createEvent(eventData).subscribe({
        next: (res) => {
          if (res.success) {
            this.events.push(res.data);
            this.selectDate(this.selectedDate);
          }
        }
      });
    }
  }

  onDeleteEvent(id: number) {
    this.calendarService.deleteEvent(id).subscribe({
      next: (res) => {
        if (res.success) {
          this.events = this.events.filter(e => e.id !== id);
          this.selectDate(this.selectedDate);
        }
      }
    });
  }

  logQuickActivity(type: string, category: string) {
    this.editingEvent = {
      type: type,
      sub_type: this.viewMode,
      category: category,
      title: '',
      description: '',
      start_time: new Date(),
      time_slot: 'morning',
      dose_freq: 'once'
    };
    this.isModalOpen = true;
  }
}
