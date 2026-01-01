import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AllopathyService } from '../../../../shared/services/allopathy.service';

@Component({
  selector: 'app-allopathy-principles',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './allopathy-principles.component.html',
  styleUrl: './allopathy-principles.component.css'
})
export class AllopathyPrinciplesComponent implements OnInit {
  pillars: any[] = [];
  timeline: any[] = [];
  ethics: any[] = [];

  activeMilestoneIndex = 0;
  loading = true;

  constructor(private allopathyService: AllopathyService) { }

  ngOnInit(): void {
    this.loadPrinciples();
  }

  loadPrinciples(): void {
    this.loading = true;
    this.allopathyService.getPrinciplesContent().subscribe({
      next: (res) => {
        if (res.success) {
          this.pillars = res.data.pillars.map((p: any) => {
            let parsedTags = [];
            try {
              parsedTags = typeof p.tags === 'string' ? JSON.parse(p.tags) : p.tags;
            } catch (e) {
              console.error('Error parsing tags:', e);
              parsedTags = [];
            }
            return {
              ...p,
              tags: Array.isArray(parsedTags) ? parsedTags : []
            };
          });
          this.timeline = res.data.timeline;
          this.ethics = res.data.ethics;
        }
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  setActiveMilestone(index: number): void {
    this.activeMilestoneIndex = index;
  }
}
