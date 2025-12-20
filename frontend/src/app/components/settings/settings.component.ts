import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css'
})
export class SettingsComponent {
  activeTab: string = 'account';

  user = {
    name: 'Ashish Ji',
    email: 'ashish@example.com',
    phone: '+91 9876543210',
    role: 'User'
  };

  notifications = {
    email: true,
    sms: true,
    promotions: false,
    appUpdates: true
  };

  privacy = {
    publicProfile: false,
    shareData: true,
    twoFactor: true
  };

  saveSettings() {
    console.log('Saving settings:', { notifications: this.notifications, privacy: this.privacy });
    // TODO: Integrate with backend API
  }
}
