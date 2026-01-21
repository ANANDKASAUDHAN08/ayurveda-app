import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ServiceCard } from '../../shared/models/service-card.interface';

@Component({
    selector: 'app-service-card',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './user-service-card.component.html',
    styleUrl: './user-service-card.component.css'
})
export class UserServiceCardComponent {
    @Input() card!: ServiceCard;

    // Add this inside class UserServiceCardComponent {
    getGradientClasses(): string {
        const colorMap: { [key: string]: string } = {
            'emerald': 'from-emerald-500 to-emerald-600',
            'blue': 'from-blue-500 to-blue-600',
            'red': 'from-red-500 to-red-600',
            'green': 'from-green-500 to-green-600',
            'purple': 'from-purple-500 to-purple-600',
            'orange': 'from-orange-500 to-orange-600',
            'teal': 'from-teal-500 to-teal-600',
            'pink': 'from-pink-500 to-pink-600',
            'indigo': 'from-indigo-500 to-indigo-600',
            'slate': 'from-slate-500 to-slate-600'
        };
        return colorMap[this.card.color] || 'from-slate-500 to-slate-600';
    }

    // Hover borders
    getHoverBorderClass(): string {
        const borders: { [key: string]: string } = {
            emerald: 'hover:border-emerald-400',
            blue: 'hover:border-blue-400',
            red: 'hover:border-red-400',
            purple: 'hover:border-purple-400',
            slate: 'hover:border-slate-400',
            teal: 'hover:border-teal-400',
            orange: 'hover:border-orange-400',
            green: 'hover:border-green-400',
            pink: 'hover:border-pink-400',
            indigo: 'hover:border-indigo-400'
        };
        return borders[this.card.color] || 'hover:border-slate-400';
    }

    // Text color for the "Open" button at bottom
    getTextColorClass(): string {
        const colors: { [key: string]: string } = {
            emerald: 'text-emerald-600',
            blue: 'text-blue-600',
            red: 'text-red-600',
            purple: 'text-purple-600',
            slate: 'text-slate-600',
            teal: 'hover:border-teal-400',
            orange: 'hover:border-orange-400',
            green: 'hover:border-green-400',
            pink: 'hover:border-pink-400',
            indigo: 'hover:border-indigo-400'
        };
        return colors[this.card.color] || 'text-slate-600';
    }
}
