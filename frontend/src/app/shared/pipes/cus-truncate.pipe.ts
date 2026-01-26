import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'cusTruncate',
    standalone: true
})
export class CusTruncatePipe implements PipeTransform {
    /**
     * Truncates text based on character limit
     * @param value The string to truncate
     * @param limit Number of characters to keep (default 20)
     * @param suffix Suffix to add if truncated (default '...')
     */
    transform(value: string, limit: number = 20, suffix: string = '...'): string {
        if (!value) return '';
        if (typeof value !== 'string') return value;

        return value.length > limit
            ? value.substring(0, limit).trim() + suffix
            : value;
    }
}
