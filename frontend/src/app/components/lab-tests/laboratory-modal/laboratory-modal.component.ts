import { Component, Input, Output, EventEmitter, OnInit, Renderer2, Inject, OnDestroy } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { Router } from '@angular/router';
import { Laboratory } from '../types';
import { ContentService } from '../../../shared/services/content.service';

@Component({
    selector: 'app-laboratory-modal',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './laboratory-modal.component.html',
    styleUrl: './laboratory-modal.component.css'
})
export class LaboratoryModalComponent implements OnInit, OnDestroy {
    @Input() lab!: Laboratory;
    @Output() close = new EventEmitter<void>();

    specialtyKeys: string[] = [];

    constructor(
        private contentService: ContentService,
        private router: Router,
        private renderer: Renderer2,
        @Inject(DOCUMENT) private document: Document
    ) { }

    ngOnInit(): void {
        this.contentService.getSpecialtyEncyclopedia().subscribe(data => {
            this.specialtyKeys = Object.keys(data);
        });

        // Prevent background scrolling
        this.renderer.addClass(this.document.body, 'overflow-hidden');
    }

    ngOnDestroy() {
        // Restore background scrolling
        this.renderer.removeClass(this.document.body, 'overflow-hidden');
    }

    onClose() {
        this.close.emit();
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

    navigateToSpecialty(service: string): void {
        const key = this.getSpecialtyKey(service);
        if (key) {
            this.router.navigate(['/specialties', key]);
            this.onClose();
        }
    }

    onGetDirections() {
        window.open(`https://www.google.com/maps/dir/?api=1&destination=${this.lab.latitude},${this.lab.longitude}`, '_blank');
    }
}
