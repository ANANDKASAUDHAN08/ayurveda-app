import { Component, OnDestroy, OnInit } from '@angular/core';
import { ShareData, ShareService } from '../../../services/share.service';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-share-modal',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './share-modal.component.html',
    styleUrls: ['./share-modal.component.css']
})
export class ShareModalComponent implements OnInit, OnDestroy {
    isOpen = false;
    data: ShareData | null = null;
    links: any = {};
    private sub: Subscription | null = null;

    constructor(private shareService: ShareService) { }

    ngOnInit(): void {
        this.sub = this.shareService.shareModal$.subscribe(data => {
            this.data = data;
            this.links = this.shareService.getSocialLinks(data);
            this.isOpen = true;
        });
    }

    ngOnDestroy(): void {
        if (this.sub) {
            this.sub.unsubscribe();
        }
    }

    close() {
        this.isOpen = false;
    }

    copyLink() {
        if (this.data) {
            this.shareService.copyToClipboard(this.data.url);
            this.close();
        }
    }
}
