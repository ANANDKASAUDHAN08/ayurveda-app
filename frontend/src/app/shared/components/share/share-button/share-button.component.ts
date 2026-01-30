import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ShareData, ShareService } from '../../../services/share.service';

@Component({
  selector: 'app-share-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button (click)="onShare($event)" 
            [class]="customClass" 
            title="Share">
      <i [class]="iconClass"></i>
      <span *ngIf="showLabel" class="ml-2">{{label}}</span>
    </button>
  `,
  styles: [`
    :host { display: inline-block; }
  `]
})
export class ShareButtonComponent {
  @Input() shareData!: ShareData;
  @Input() showLabel = false;
  @Input() label = 'Share';
  @Input() iconClass = 'fas fa-share-alt';
  @Input() customClass = 'w-9 h-9 flex items-center justify-center rounded-full bg-slate-50 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 transition-all shadow-sm border border-slate-100';

  constructor(private shareService: ShareService) { }

  onShare(event: MouseEvent) {
    event.stopPropagation();
    event.preventDefault();
    this.shareService.share(this.shareData);
  }
}
