import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ServiceCard } from '../../models/service-card.interface';

@Component({
    selector: 'app-service-card',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './service-card.component.html',
    styleUrl: './service-card.component.css'
})
export class ServiceCardComponent {
    @Input() card!: ServiceCard;
}
