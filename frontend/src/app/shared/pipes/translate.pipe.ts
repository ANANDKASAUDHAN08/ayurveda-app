import { Pipe, PipeTransform } from '@angular/core';
import { TranslationService } from '../services/translation.service';

@Pipe({
    name: 'translate',
    pure: false, // Set to false so it updates when language changes
    standalone: true
})
export class TranslatePipe implements PipeTransform {
    constructor(private translationService: TranslationService) { }

    transform(key: string): string {
        return this.translationService.translate(key);
    }
}
