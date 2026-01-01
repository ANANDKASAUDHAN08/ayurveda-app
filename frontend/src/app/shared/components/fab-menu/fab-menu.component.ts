import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { trigger, state, style, transition, animate } from '@angular/animations';

export interface FabAction {
  icon: string;
  label: string;
  action: string;
  color: string;
}

@Component({
  selector: 'app-fab-menu',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './fab-menu.component.html',
  styleUrl: './fab-menu.component.css',
  animations: [
    trigger('fabToggle', [
      state('closed', style({
        transform: 'rotate(0deg) scale(1)'
      })),
      state('open', style({
        transform: 'rotate(135deg) scale(1.1)'
      })),
      transition('closed <=> open', animate('300ms cubic-bezier(0.34, 1.56, 0.64, 1)'))
    ]),
    trigger('menuItem', [
      transition(':enter', [
        style({ transform: 'scale(0) translateY(20px)', opacity: 0 }),
        animate('200ms cubic-bezier(0.34, 1.56, 0.64, 1)', style({ transform: 'scale(1) translateY(0)', opacity: 1 }))
      ]),
      transition(':leave', [
        animate('150ms ease-out', style({ transform: 'scale(0)', opacity: 0 }))
      ])
    ]),
    trigger('backdrop', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('200ms ease-out', style({ opacity: 1 }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ opacity: 0 }))
      ])
    ])
  ]
})
export class FabMenuComponent {
  @Output() actionClicked = new EventEmitter<string>();

  isOpen = false;

  actions: FabAction[] = [
    {
      icon: 'fa-search',
      label: 'Quick Search',
      action: 'search',
      color: 'bg-blue-500'
    },
    {
      icon: 'fa-calendar-check',
      label: 'Book Appointment',
      action: 'book',
      color: 'bg-emerald-500'
    },
    {
      icon: 'fa-pills',
      label: 'Order Medicine',
      action: 'order',
      color: 'bg-purple-500'
    },
    {
      icon: 'fa-hospital',
      label: 'Find Hospital',
      action: 'hospital',
      color: 'bg-red-500'
    },
    {
      icon: 'fa-phone',
      label: 'Call Support',
      action: 'support',
      color: 'bg-orange-500'
    },
    { label: 'Emergency SOS', icon: 'fa-ambulance', color: 'bg-red-500', action: 'emergency' }
  ];

  toggleMenu(): void {
    this.isOpen = !this.isOpen;
    this.triggerHaptic();
  }

  closeMenu(): void {
    this.isOpen = false;
  }

  onActionClick(action: string): void {
    this.actionClicked.emit(action);
    this.triggerHaptic();
    this.closeMenu();
  }

  private triggerHaptic(): void {
    if ('vibrate' in navigator) {
      navigator.vibrate(15);
    }
  }
}
