import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
    selector: 'app-ayurveda-about',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './ayurveda-about.component.html',
    styleUrl: './ayurveda-about.component.css'
})
export class AyurvedaAboutComponent implements OnInit {
    selectedHour = 0;
    activeClockSlice: any = null;

    clockData = [
        { hourStart: 2, hourEnd: 6, dosha: "Vata", title: "Movement & Alertness", desc: "The energy of movement. Best for meditation, prayer, and waking up before sunrise.", activities: ["Meditation", "Journaling", "Deep breathing"], icon: "🌬️" },
        { hourStart: 6, hourEnd: 10, dosha: "Kapha", title: "Structure & Stability", desc: "Early morning heaviness. Characterized by stability. Ideal for invigorating physical activity.", activities: ["Vigorous exercise", "Planning your day", "Brisk walking"], icon: "⛰️" },
        { hourStart: 10, hourEnd: 14, dosha: "Pitta", title: "Transformation & Focus", desc: "The peak of digestive fire (Agni). Focus is at its highest.", activities: ["Eat main meal", "High-focus work", "Problem solving"], icon: "🔥" },
        { hourStart: 14, hourEnd: 18, dosha: "Vata", title: "Creativity & Flow", desc: "Communication and creativity are heightened as nervous system activity increases.", activities: ["Creative writing", "Socializing", "Learning new skills"], icon: "🎨" },
        { hourStart: 18, hourEnd: 22, dosha: "Kapha", title: "Rest & Repair", desc: "Nature begins to slow down. The body prepares for rest and repair.", activities: ["Light dinner", "Relaxation", "Family time"], icon: "🌙" },
        { hourStart: 22, hourEnd: 2, dosha: "Pitta", title: "Internal Cleansing", desc: "Internal metabolism and cleansing. High energy if you stay up, but best for deep sleep repair.", activities: ["Deep sleep", "Cellular repair", "Detoxification"], icon: "✨" }
    ];

    elementsData = [
        { name: 'Akasha', english: 'Space', icon: '🌌', desc: 'The most subtle element. It represents the container for all things.', qualities: ['Vast', 'Subtle', 'Soft'], color: 'indigo-400' },
        { name: 'Vayu', english: 'Air', icon: '🌬️', desc: 'The element of movement. It represents the gaseous state of matter.', qualities: ['Mobile', 'Light', 'Cold'], color: 'blue-300' },
        { name: 'Tejas', english: 'Fire', icon: '🔥', desc: 'The element of transformation. Light and heat are its manifestations.', qualities: ['Hot', 'Sharp', 'Bright'], color: 'orange-500' },
        { name: 'Jala', english: 'Water', icon: '💧', desc: 'The element of cohesion and flow. It represents the liquid state.', qualities: ['Fluid', 'Cool', 'Lush'], color: 'blue-500' },
        { name: 'Prithvi', english: 'Earth', icon: '⛰️', desc: 'The element of structure and stability. The solid state of matter.', qualities: ['Heavy', 'Hard', 'Static'], color: 'amber-700' }
    ];

    activeElement = this.elementsData[0];

    constructor(private router: Router) { }

    ngOnInit(): void {
        this.initializeClock();
    }

    initializeClock(): void {
        this.selectedHour = new Date().getHours();
        this.updateClock(this.selectedHour);
    }

    updateClock(hour: number | any): void {
        if (typeof hour === 'object' && hour.target) {
            hour = parseInt(hour.target.value);
        }

        this.selectedHour = hour;

        let slice = this.clockData.find(s => {
            if (s.hourStart > s.hourEnd) {
                return hour >= s.hourStart || hour < s.hourEnd;
            }
            return hour >= s.hourStart && hour < s.hourEnd;
        });

        this.activeClockSlice = slice || this.clockData[0];
    }

    goToFindDoctors(): void {
        this.router.navigate(['/find-doctors']);
    }
}
