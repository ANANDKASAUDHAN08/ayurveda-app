import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-about-us',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './about-us.component.html',
  styleUrl: './about-us.component.css'
})
export class AboutUsComponent {
  stats = [
    { label: 'Happy Patients', value: '1M+' },
    { label: 'Partner Hospitals', value: '500+' },
    { label: 'Expert Doctors', value: '10,000+' },
    { label: 'Cities Covered', value: '50+' }
  ];

  values = [
    {
      title: 'Integrity',
      description: 'We prioritize medical ethics and patient trust above everything else.',
      icon: 'fas fa-balance-scale'
    },
    {
      title: 'Innovation',
      description: 'Using technology to solve real-world healthcare challenges.',
      icon: 'fas fa-lightbulb'
    },
    {
      title: 'Accessibility',
      description: 'Making quality healthcare available to everyone, everywhere.',
      icon: 'fas fa-globe-asia'
    }
  ];

  milestones = [
    { year: '2021', title: 'The Vision', description: 'HealthConnect was founded with a mission to digitize Indian healthcare.' },
    { year: '2022', title: 'Expansion Phase', description: 'Partnered with 200+ hospitals across 5 major metro cities.' },
    { year: '2023', title: 'Tech Excellence', description: 'Launched AI-driven medicine search and lab test booking.' },
    { year: '2024', title: 'National Impact', description: 'Reached 1 million users and expanded to 50+ cities.' }
  ];
}
