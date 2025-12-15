import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-hero-section',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './hero-section.component.html',
    styleUrl: './hero-section.component.css'
})
export class HeroSectionComponent {
    activeTab: string = 'doctors';
    searchTerm: string = '';
    location: string = '';

    @Output() searchRequested = new EventEmitter<{
        searchTerm: string;
        location: string;
        activeTab: string;
    }>();

    setActiveTab(tab: string) {
        this.activeTab = tab;
    }

    search() {
        this.searchRequested.emit({
            searchTerm: this.searchTerm,
            location: this.location,
            activeTab: this.activeTab
        });
    }
}
