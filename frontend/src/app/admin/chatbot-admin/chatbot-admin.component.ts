import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../shared/services/admin.service';

@Component({
    selector: 'app-chatbot-admin',
    standalone: true,
    imports: [CommonModule, RouterModule, FormsModule],
    templateUrl: './chatbot-admin.component.html',
    styleUrl: './chatbot-admin.component.css'
})
export class ChatbotAdminComponent implements OnInit {
    stats: any = null;
    loading = true;
    error: string | null = null;

    constructor(private adminService: AdminService) { }

    ngOnInit() {
        this.loadStats();
    }

    loadStats() {
        this.loading = true;
        this.error = null;
        this.adminService.getChatbotStats().subscribe({
            next: (res) => {
                this.stats = res.stats;
                this.loading = false;
            },
            error: (err) => {
                console.error('Error loading chatbot stats:', err);
                this.error = 'Failed to load chatbot statistics. Please try again later.';
                this.loading = false;
            }
        });
    }

    getTierClass(tier: string): string {
        switch (tier?.toLowerCase()) {
            case 'premium_plus': return 'bg-purple-100 text-purple-700 border-purple-200';
            case 'premium': return 'bg-blue-100 text-blue-700 border-blue-200';
            default: return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    }

    formatDate(dateStr: string): string {
        return new Date(dateStr).toLocaleDateString() + ' ' + new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
}
