import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { SnackbarService } from './snackbar.service';

export interface ShareData {
    title: string;
    text?: string;
    url: string;
}

@Injectable({
    providedIn: 'root'
})
export class ShareService {
    private shareModalSubject = new Subject<ShareData>();
    public shareModal$ = this.shareModalSubject.asObservable();

    constructor(private snackbar: SnackbarService) { }

    async share(data: ShareData) {
        // Use native Share API if available
        if (navigator.share) {
            try {
                await navigator.share(data);
                this.snackbar.success('Shared successfully!');
                return;
            } catch (error: any) {
                // If user cancelled, don't show error but don't fallback either
                if (error.name === 'AbortError') {
                    return;
                }
                // If it's another error, we might want to fallback
                console.warn('Native share failed, falling back to modal:', error);
            }
        }

        // Fallback to custom modal
        this.openShareModal(data);
    }

    private openShareModal(data: ShareData) {
        this.shareModalSubject.next(data);
    }

    copyToClipboard(text: string) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(() => {
                this.snackbar.success('Link copied to clipboard!');
            }).catch(err => {
                console.error('Could not copy text: ', err);
                this.fallbackCopyToClipboard(text);
            });
        } else {
            this.fallbackCopyToClipboard(text);
        }
    }

    private fallbackCopyToClipboard(text: string) {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
            this.snackbar.success('Link copied to clipboard!');
        } catch (err) {
            console.error('Fallback copy failed', err);
            this.snackbar.error('Failed to copy link.');
        }
        document.body.removeChild(textArea);
    }

    getSocialLinks(data: ShareData) {
        const encodedUrl = encodeURIComponent(data.url);
        const encodedText = encodeURIComponent(`${data.text || data.title}\n\n${data.url}`);
        const encodedTitle = encodeURIComponent(data.title);

        return {
            whatsapp: `https://wa.me/?text=${encodedText}`,
            facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
            twitter: `https://twitter.com/intent/tweet?text=${encodedText}`,
            linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
            email: `mailto:?subject=${encodedTitle}&body=${encodedText}`
        };
    }
}
