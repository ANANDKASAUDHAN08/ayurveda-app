import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { ThemeService, Theme } from '../../shared/services/theme.service';
import { SettingsService, UserSettings } from '../../shared/services/settings.service';
import { AuthService } from '../../shared/services/auth.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css'
})
export class SettingsComponent implements OnInit {
  activeTab: 'appearance' | 'notifications' | 'language' | 'preferences' = 'appearance';

  settings = {
    theme: 'light' as Theme,
    fontSize: 14,
    compactMode: false,
    reduceMotion: false
  };

  notifications = {
    email: true,
    sms: true,
    push: false,
    promotions: false,
    quietStart: '22:00',
    quietEnd: '08:00'
  };

  language = {
    selected: 'en',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '12h',
    timezone: 'Asia/Kolkata',
    currency: 'INR'
  };

  preferences = {
    autoRefresh: true,
    rememberSearch: true,
    searchRadius: 10,
    shareData: false,
    locationTracking: true
  };

  constructor(
    private themeService: ThemeService,
    private settingsService: SettingsService,
    private authService: AuthService
  ) { }

  ngOnInit() {
    // Load current theme
    this.settings.theme = this.themeService.getCurrentTheme();

    // Load settings from localStorage
    this.loadSettings();
  }

  setTheme(theme: Theme) {
    this.settings.theme = theme;
    this.themeService.setTheme(theme);
  }

  loadSettings() {
    // Load from backend if user is logged in
    if (this.authService.isLoggedIn()) {
      this.loadSettingsFromBackend();
    } else {
      // Load from localStorage if not logged in
      this.loadSettingsFromLocalStorage();
    }
  }

  loadSettingsFromBackend() {
    this.settingsService.getUserSettings().subscribe({
      next: (data: UserSettings) => {
        this.settings = { ...this.settings, ...data.settings };
        this.notifications = { ...this.notifications, ...data.notifications };
        this.language = { ...this.language, ...data.language };
        this.preferences = { ...this.preferences, ...data.preferences };

        // Apply theme
        this.themeService.setTheme(this.settings.theme);
      },
      error: (error) => {
        console.error('Failed to load settings from backend:', error);
        // Fallback to localStorage
        this.loadSettingsFromLocalStorage();
      }
    });
  }

  loadSettingsFromLocalStorage() {
    const saved = localStorage.getItem('app_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.settings) this.settings = { ...this.settings, ...parsed.settings };
        if (parsed.notifications) this.notifications = { ...this.notifications, ...parsed.notifications };
        if (parsed.language) this.language = { ...this.language, ...parsed.language };
        if (parsed.preferences) this.preferences = { ...this.preferences, ...parsed.preferences };
      } catch (e) {
        console.error('Failed to load settings from localStorage:', e);
      }
    }
  }

  saveSettings() {
    const allSettings: UserSettings = {
      settings: this.settings,
      notifications: this.notifications,
      language: this.language,
      preferences: this.preferences
    };

    // Always save to localStorage
    localStorage.setItem('app_settings', JSON.stringify(allSettings));

    // Save to backend if logged in
    if (this.authService.isLoggedIn()) {
      this.settingsService.updateUserSettings(allSettings).subscribe({
        next: (response) => {
          console.log('Settings saved to backend:', response);
          alert('Settings saved successfully!');
        },
        error: (error) => {
          console.error('Failed to save settings to backend:', error);
          alert('Settings saved locally, but failed to sync with server.');
        }
      });
    } else {
      console.log('Settings saved to localStorage (user not logged in)');
      alert('Settings saved locally!');
    }
  }
}
