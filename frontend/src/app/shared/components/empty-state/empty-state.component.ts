import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './empty-state.component.html',
  styleUrl: './empty-state.component.css'
})
export class EmptyStateComponent {
  @Input() icon: string = 'fas fa-inbox';
  @Input() title: string = 'No items found';
  @Input() message: string = 'Try adjusting your search or filter criteria';
  @Input() actionText?: string;
  @Input() secondaryActionText?: string;

  @Output() action = new EventEmitter<void>();
  @Output() secondaryAction = new EventEmitter<void>();
  onAction() {
    this.action.emit();
  }
  onSecondaryAction() {
    this.secondaryAction.emit();
  }
}