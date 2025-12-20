import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-career',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule],
  templateUrl: './career.component.html',
  styleUrl: './career.component.css'
})
export class CareerComponent {
  selectedDepartment: string = 'All';
  departments = ['All', 'Medical', 'Engineering', 'Operations', 'Marketing'];

  jobs = [
    {
      id: 1,
      title: 'Senior Medical Consultant',
      department: 'Medical',
      location: 'Remote / Bangalore',
      type: 'Full-time',
      experience: '8+ years',
      description: 'Lead clinical strategy and provide expert consultations.'
    },
    {
      id: 2,
      title: 'Full Stack Engineer',
      department: 'Engineering',
      location: 'Remote',
      type: 'Full-time',
      experience: '3+ years',
      description: 'Build scalable healthcare platforms using modern tech stacks.'
    },
    {
      id: 3,
      title: 'Operations Manager',
      department: 'Operations',
      location: 'Mumbai',
      type: 'Full-time',
      experience: '5+ years',
      description: 'Manage logistics for lab tests and medicine delivery.'
    },
    {
      id: 4,
      title: 'UI/UX Designer',
      department: 'Engineering',
      location: 'Remote',
      type: 'Contract',
      experience: '2+ years',
      description: 'Create intuitive and accessible medical interfaces.'
    },
    {
      id: 5,
      title: 'Resident Doctor',
      department: 'Medical',
      location: 'Delhi',
      type: 'Full-time',
      experience: '1+ years',
      description: 'Handle patient inquiries and support clinical operations.'
    }
  ];

  get filteredJobs() {
    return this.jobs.filter(job =>
      this.selectedDepartment === 'All' || job.department === this.selectedDepartment
    );
  }

  applyNow(job: any) {
    console.log('Applying for job:', job.title);
    // TODO: Open application modal
  }
}
