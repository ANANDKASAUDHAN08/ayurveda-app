import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AyurvedaService, Exercise, Ritual, Herb } from '../../../../shared/services/ayurveda.service';

@Component({
    selector: 'app-ayurveda-wellness',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './ayurveda-wellness.component.html',
    styleUrl: './ayurveda-wellness.component.css'
})
export class AyurvedaWellnessComponent implements OnInit {
    allExercises: Exercise[] = [];
    rituals: Ritual[] = [];
    herbOfMonth: Herb | null = null;
    sankalpa: string = '';
    completedRituals: Set<number> = new Set();
    filteredExercises: Exercise[] = [];
    activeFilter: string = 'all';
    loading = true;

    filters = [
        { id: 'all', label: 'All', icon: '🌿' },
        { id: 'yoga', label: 'Yoga', icon: '🧘' },
        { id: 'pranayama', label: 'Pranayama', icon: '🌬️' },
        { id: 'meditation', label: 'Meditation', icon: '🧘‍♀️' }
    ];

    dailyRituals = [
        { time: '05:00 - 06:00', title: 'Brahma Muhurta', description: 'Waking up during the ambrosial hours for spiritual practice.', icon: '🧘', color: 'indigo' },
        { time: '06:15 - 07:00', title: 'Danta Dhawana', description: 'Ayurvedic hygiene rituals: tongue scraping and oil pulling.', icon: '✨', color: 'emerald' },
        { time: '07:30 - 08:30', title: 'Abhyanga', description: 'Self-massage with warm oil to nourish the skin and nervous system.', icon: '🧴', color: 'orange' },
        { time: '12:00 - 13:00', title: 'Madhya Anna', description: 'Largest meal of the day when Agni (digestive fire) is peak.', icon: '🍲', color: 'yellow' },
        { time: '21:00 - 22:00', title: 'Nidra', description: 'Deep, healing sleep before 10 PM to align with natural cycles.', icon: '🌙', color: 'teal' }
    ];

    doshaTips = [
        {
            id: 'vata',
            name: 'Vata',
            focus: 'Grounded & Warm',
            description: 'Balance air and space qualities with routine and warm, moist foods.',
            rituals: ['Oil Head Massage', 'Warm Soups', 'Gentle Yoga'],
            color: 'blue'
        },
        {
            id: 'pitta',
            name: 'Pitta',
            focus: 'Cool & Calm',
            description: 'Balance fire and water with cooling activities and moderate exertion.',
            rituals: ['Moon Bathing', 'Refreshing Coconut Water', 'Deep Breathing'],
            color: 'red'
        },
        {
            id: 'kapha',
            name: 'Kapha',
            focus: 'Active & Light',
            description: 'Balance earth and water with movement, variety, and stimulating foods.',
            rituals: ['Dry Brushing', 'Vinyasa Flow', 'Spicy Herbal Teas'],
            color: 'emerald'
        }
    ];

    activeDosha = 'vata';

    selectedSeason = 'summer';
    activeSeasonData: any = null;

    seasons = [
        { id: 'spring', name: 'Spring', sanskrit: 'Vasanta', months: 'Mar - Apr', icon: '🌸', color: 'emerald' },
        { id: 'summer', name: 'Summer', sanskrit: 'Grishma', months: 'May - Jun', icon: '☀️', color: 'orange' },
        { id: 'monsoon', name: 'Monsoon', sanskrit: 'Varsha', months: 'Jul - Aug', icon: '⛈️', color: 'blue' },
        { id: 'autumn', name: 'Autumn', sanskrit: 'Sharad', months: 'Sep - Oct', icon: '🍂', color: 'yellow' },
        { id: 'early-winter', name: 'Early Winter', sanskrit: 'Hemanta', months: 'Nov - Dec', icon: '❄️', color: 'teal' },
        { id: 'late-winter', name: 'Late Winter', sanskrit: 'Shishira', months: 'Jan - Feb', icon: '🌬️', color: 'indigo' }
    ];

    seasonalWisdom: any = {
        spring: {
            energy: "Kapha is melting. Agni (digestive fire) becomes variable.",
            diet: ["Ginger tea", "Bitter greens", "Barley/Honey", "Avoid dairy/cold drinks"],
            activity: ["Vigorous exercise", "Nasal cleansing (Neti)", "Dry massage"],
            focus: "Detoxification & Renewal"
        },
        summer: {
            energy: "Pitta is accumulating. High heat and intensity.",
            diet: ["Sweet juicy fruits", "Coconut water", "Cooling herbs (Mint/Cilantro)", "Avoid spicy/fermented"],
            activity: ["Moon bathing", "Swimming", "Gentle walk at night"],
            focus: "Cooling & Hydration"
        },
        monsoon: {
            energy: "Vata is high. Pitta begins to accumulate.",
            diet: ["Warm cooked food", "Soups with Ghee", "Honey", "Avoid leafy greens"],
            activity: ["Oil massage (Abhyanga)", "Yoga indoors", "Stay dry and warm"],
            focus: "Grounding & Immunity"
        },
        autumn: {
            energy: "Pitta is high. Transition to cooler weather.",
            diet: ["Ghee", "Sweet/Bitter/Astrigent foods", "Pears", "Avoid red meat/curd"],
            activity: ["Pranayama", "Sunbathing (early morning)", "Deep breathing"],
            focus: "Clarification & Balance"
        },
        'early-winter': {
            energy: "Agni is strongest. The body needs more fuel.",
            diet: ["Oils/Ghee", "Hearty grains", "Dairy", "Root vegetables"],
            activity: ["Brisk exercise", "Vigorous Yoga", "Sun exposure"],
            focus: "Nourishment & Strength"
        },
        'late-winter': {
            energy: "Kapha is accumulating. Cold and damp.",
            diet: ["Spices (Pippali)", "Warm/Dry food", "Honey", "Avoid cold water"],
            activity: ["Keep active", "Sun-facing Yoga", "Steam bath"],
            focus: "Warmth & Circulation"
        }
    };

    wellnessStats = [
        { label: 'Sleep Quality', value: '85%', trend: '+5%', icon: '😴' },
        { label: 'Mindfulness', value: '420m', trend: '+12m', icon: '🧠' },
        { label: 'Water Balance', value: '2.4L', trend: 'Target met', icon: '💧' },
        { label: 'Physical Activity', value: '45m', trend: '+10m', icon: '🏃' }
    ];

    wellnessTips = [
        {
            title: 'Morning Routine',
            description: 'Start your day with warm lemon water and light stretching',
            icon: '☀️',
            color: 'emerald'
        },
        {
            title: 'Mindful Eating',
            description: 'Practice eating without distractions for better digestion',
            icon: '🍽️',
            color: 'orange'
        },
        {
            title: 'Evening Wind-Down',
            description: 'Practice light meditation before bedtime for restful sleep',
            icon: '🌙',
            color: 'emerald'
        },
        {
            title: 'Daily Movement',
            description: 'Incorporate 30 minutes of mindful movement daily',
            icon: '🌿',
            color: 'orange'
        }
    ];

    constructor(
        private ayurvedaService: AyurvedaService,
        private router: Router
    ) { }

    ngOnInit(): void {
        this.loadExercises();
        this.loadRituals();
        this.loadHerbOfMonth();
        // Load saved rituals
        const saved = localStorage.getItem('completedRituals');
        if (saved) {
            this.completedRituals = new Set(JSON.parse(saved));
        }
        this.sankalpa = localStorage.getItem('dailySankalpa') || '';
        this.initializeSeason();
    }

    initializeSeason(): void {
        const month = new Date().getMonth(); // 0-11
        let seasonId = 'summer';

        if (month === 2 || month === 3) seasonId = 'spring';
        else if (month === 4 || month === 5) seasonId = 'summer';
        else if (month === 6 || month === 7) seasonId = 'monsoon';
        else if (month === 8 || month === 9) seasonId = 'autumn';
        else if (month === 10 || month === 11) seasonId = 'early-winter';
        else seasonId = 'late-winter';

        this.setSeason(seasonId);
    }

    setSeason(id: string): void {
        this.selectedSeason = id;
        this.activeSeasonData = this.seasonalWisdom[id];
    }

    loadExercises(): void {
        this.ayurvedaService.getExercises().subscribe({
            next: (exercises) => {
                this.allExercises = exercises;
                this.filteredExercises = exercises;
                this.loading = false;
            },
            error: (err) => {
                console.error('Failed to load exercises:', err);
                this.loading = false;
            }
        });
    }

    loadRituals(): void {
        this.ayurvedaService.getRituals().subscribe({
            next: (data) => this.rituals = data,
            error: (err) => console.error('Failed to load rituals:', err)
        });
    }

    loadHerbOfMonth(): void {
        this.ayurvedaService.getHerbs({ herb_of_month: true }).subscribe({
            next: (herbs) => {
                if (herbs.length > 0) this.herbOfMonth = herbs[0];
            },
            error: (err) => console.error('Failed to load herb of month:', err)
        });
    }

    toggleRitual(id: number): void {
        if (this.completedRituals.has(id)) {
            this.completedRituals.delete(id);
        } else {
            this.completedRituals.add(id);
        }
        localStorage.setItem('completedRituals', JSON.stringify(Array.from(this.completedRituals)));
    }

    saveSankalpa(): void {
        localStorage.setItem('dailySankalpa', this.sankalpa);
    }

    filterExercises(type: string): void {
        this.activeFilter = type;
        if (type === 'all') {
            this.filteredExercises = this.allExercises;
        } else {
            this.filteredExercises = this.allExercises.filter(ex => ex.type === type);
        }
    }

    getDifficultyColor(difficulty: string): string {
        switch (difficulty) {
            case 'beginner': return 'emerald';
            case 'intermediate': return 'orange';
            case 'advanced': return 'red';
            default: return 'gray';
        }
    }

    viewExerciseDetails(exercise: Exercise): void {
        // In a real app, navigate to detail page or open modal
        console.log('View exercise:', exercise);
    }

    goToFindDoctors(): void {
        this.router.navigate(['/find-doctors']);
    }

    get currentSeasonName(): string {
        const season = this.seasons.find(s => s.id === this.selectedSeason);
        return season ? season.name : 'Current Season';
    }

    get currentSeasonIcon(): string {
        const season = this.seasons.find(s => s.id === this.selectedSeason);
        return season ? season.icon : '☀️';
    }

    get currentSeasonRecommendations(): string[] {
        if (!this.activeSeasonData) return [];
        return [
            ...(this.activeSeasonData.diet || []),
            ...(this.activeSeasonData.activity || [])
        ];
    }
}