import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Laboratory } from '../types';
import { ContentService } from '../../../shared/services/content.service';

@Component({
    selector: 'app-laboratory-card',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './laboratory-card.component.html',
    styleUrl: './laboratory-card.component.css'
})
export class LaboratoryCardComponent implements OnInit {
    @Input() lab!: Laboratory;
    @Output() openDetails = new EventEmitter<Laboratory>();

    specialtyKeys: string[] = [];

    constructor(
        private contentService: ContentService,
        private router: Router
    ) { }

    ngOnInit(): void {
        this.contentService.getSpecialtyEncyclopedia().subscribe(data => {
            this.specialtyKeys = Object.keys(data);
        });
    }

    getServices(): string[] {
        if (Array.isArray(this.lab.services)) return this.lab.services;
        if (typeof this.lab.services === 'string') {
            try {
                return JSON.parse(this.lab.services);
            } catch {
                return this.lab.services.split(',').map(s => s.trim());
            }
        }
        return [];
    }

    isSpecialtyAvailable(service: string): boolean {
        return this.specialtyKeys.some(key =>
            key.toLowerCase() === service.toLowerCase() ||
            service.toLowerCase().includes(key.toLowerCase())
        );
    }

    getSpecialtyKey(service: string): string | null {
        return this.specialtyKeys.find(key =>
            key.toLowerCase() === service.toLowerCase() ||
            service.toLowerCase().includes(key.toLowerCase())
        ) || null;
    }

    navigateToSpecialty(event: Event, service: string): void {
        event.stopPropagation();
        const key = this.getSpecialtyKey(service);
        if (key) {
            this.router.navigate(['/specialties', key]);
        }
    }

    onOpenDetails() {
        this.openDetails.emit(this.lab);
    }
}
