import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type Theme = 'light' | 'dark' | 'system';

@Injectable({
    providedIn: 'root'
})
export class ThemeService {
    private readonly THEME_KEY = 'app_theme';
    private themeSubject = new BehaviorSubject<Theme>(this.getSavedTheme());
    public theme$ = this.themeSubject.asObservable();

    constructor() {
        this.applyTheme(this.themeSubject.value);

        // Listen for system theme changes if 'system' is selected
        if (typeof window !== 'undefined') {
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
                if (this.themeSubject.value === 'system') {
                    this.applySystemTheme();
                }
            });
        }
    }

    private getSavedTheme(): Theme {
        if (typeof window === 'undefined') return 'light';
        const saved = localStorage.getItem(this.THEME_KEY);
        return (saved as Theme) || 'light';
    }

    private applySystemTheme(): void {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const htmlElement = document.documentElement;

        if (prefersDark) {
            htmlElement.classList.add('dark');
        } else {
            htmlElement.classList.remove('dark');
        }
    }

    private applyTheme(theme: Theme): void {
        if (typeof window === 'undefined') return;

        const htmlElement = document.documentElement;

        if (theme === 'system') {
            this.applySystemTheme();
        } else if (theme === 'dark') {
            htmlElement.classList.add('dark');
        } else {
            htmlElement.classList.remove('dark');
        }
    }

    setTheme(theme: Theme): void {
        this.themeSubject.next(theme);
        localStorage.setItem(this.THEME_KEY, theme);
        this.applyTheme(theme);
    }

    getCurrentTheme(): Theme {
        return this.themeSubject.value;
    }

    isDarkMode(): boolean {
        if (this.themeSubject.value === 'system') {
            return window.matchMedia('(prefers-color-scheme: dark)').matches;
        }
        return this.themeSubject.value === 'dark';
    }
}

