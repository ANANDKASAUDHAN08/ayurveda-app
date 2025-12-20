import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-health-plans',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './health-plans.component.html',
  styleUrl: './health-plans.component.css'
})
export class HealthPlansComponent {
  plans = [
    {
      name: 'Essential Care',
      price: '499',
      period: 'month',
      description: 'Perfect for individuals starting their health journey.',
      icon: 'fas fa-heartbeat',
      features: [
        '2 Online Doctor Consultations',
        'Basic Health Checkup (10 parameters)',
        '24/7 Helpline Support',
        'Digital Medical Records'
      ],
      color: 'emerald',
      popular: false
    },
    {
      name: 'Family Shield',
      price: '1299',
      period: 'month',
      description: 'Complete protection for your entire family.',
      icon: 'fas fa-shield-alt',
      features: [
        'Unlimited Doctor Consultations',
        'Comprehensive Health Checkup for 4',
        'Priority Home Sample Collection',
        'Dental & Vision Discounts',
        'Emergency Support'
      ],
      color: 'teal',
      popular: true
    },
    {
      name: 'Corporate Wellness',
      price: 'Custom',
      period: '',
      description: 'Dedicated solutions for your business team.',
      icon: 'fas fa-building',
      features: [
        'Employee Health Screening',
        'Mental Wellness Workshops',
        'Dedicated Care Manager',
        'On-site Health Camps',
        'Insurance Integration'
      ],
      color: 'cyan',
      popular: false
    }
  ];
}
