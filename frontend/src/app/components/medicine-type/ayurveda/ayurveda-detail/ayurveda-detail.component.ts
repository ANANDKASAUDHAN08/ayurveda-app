import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AyurvedaKnowledgeItem } from '../../../../shared/services/ayurveda-knowledge.service';
import { AyurvedaService, Herb } from '../../../../shared/services/ayurveda.service';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
    selector: 'app-ayurveda-detail',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './ayurveda-detail.component.html',
    styleUrl: './ayurveda-detail.component.css'
})
export class AyurvedaDetailComponent implements OnInit, OnChanges {
    @Input() item!: AyurvedaKnowledgeItem;
    @Output() close = new EventEmitter<void>();

    herbs: Herb[] = [];
    showHerbQuickView = false;
    selectedHerb: Herb | null = null;
    formattedTreatmentText: SafeHtml = '';

    activeTab: 'medical' | 'treatment' | 'lifestyle' | 'profile' = 'medical';
    tabs: ('medical' | 'treatment' | 'lifestyle' | 'profile')[] = ['medical', 'treatment', 'lifestyle', 'profile'];

    constructor(
        private ayurvedaService: AyurvedaService,
        private sanitizer: DomSanitizer
    ) { }

    ngOnInit(): void {
        this.loadHerbs();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['item']) {
            this.updateFormattedText();
        }
    }

    loadHerbs(): void {
        this.ayurvedaService.getHerbs().subscribe({
            next: (data) => {
                this.herbs = data;
                this.updateFormattedText();
            },
            error: (err) => console.error('Failed to load herbs for linking:', err)
        });
    }

    updateFormattedText(): void {
        if (!this.item) return;
        const text = this.item.ayurvedic_herbal_remedies || this.item.ayurvedic_herbs || this.item.herbal_remedies || 'Personalized blend required';
        this.formattedTreatmentText = this.getFormattedText(text);
    }

    getFormattedText(text: string | null | undefined): SafeHtml {
        if (!text || !this.herbs.length) return this.sanitizer.bypassSecurityTrustHtml(text || '');

        let formattedText = text;

        // Sort herbs by length descending
        const sortedHerbs = [...this.herbs].sort((a, b) => b.name.length - a.name.length);

        // Escape herb names for regex and join into one master regex for speed
        const herbNames = sortedHerbs.map(h => h.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
        const masterRegex = new RegExp(`\\b(${herbNames.join('|')})\\b`, 'gi');

        formattedText = formattedText.replace(masterRegex, (match) => {
            const herb = sortedHerbs.find(h => h.name.toLowerCase() === match.toLowerCase());
            if (herb) {
                return `<span class="herb-link text-emerald-600 font-black cursor-pointer hover:underline underline-offset-4" 
                               data-herb-id="${herb.id}">${match}</span>`;
            }
            return match;
        });

        return this.sanitizer.bypassSecurityTrustHtml(formattedText);
    }

    handleContentClick(event: MouseEvent): void {
        const target = event.target as HTMLElement;
        const herbLink = target.closest('.herb-link');

        if (herbLink) {
            const herbId = herbLink.getAttribute('data-herb-id');
            if (herbId) {
                const herb = this.herbs.find(h => h.id === +herbId);
                if (herb) {
                    this.openHerbQuickView(herb);
                }
            }
        }
    }

    openHerbQuickView(herb: Herb): void {
        this.selectedHerb = herb;
        this.showHerbQuickView = true;
    }

    closeHerbQuickView(): void {
        this.showHerbQuickView = false;
    }

    setTab(tab: any): void {
        this.activeTab = tab;
    }

    onClose(): void {
        this.close.emit();
    }
}
