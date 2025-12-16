import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../shared/services/admin.service';

@Component({
    selector: 'app-static-pages',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './static-pages.component.html',
    styleUrl: './static-pages.component.css'
})
export class StaticPagesComponent implements OnInit {
    pages: any[] = [];
    loading = true;
    showModal = false;

    selectedPage = {
        id: 0,
        slug: '',
        title: '',
        content: '',
        meta_description: ''
    };

    constructor(private adminService: AdminService) { }

    ngOnInit() {
        this.loadPages();
    }

    loadPages() {
        this.loading = true;
        this.adminService.getStaticPages().subscribe({
            next: (response) => {
                this.pages = response.pages || [];
                this.loading = false;
            },
            error: (error) => {
                console.error('Error loading static pages:', error);
                alert('Failed to load static pages');
                this.loading = false;
            }
        });
    }

    openEditModal(page: any) {
        this.selectedPage = { ...page };
        this.showModal = true;
    }

    closeModal() {
        this.showModal = false;
    }

    save() {
        this.adminService.updateStaticPage(this.selectedPage.id, this.selectedPage).subscribe({
            next: () => {
                alert('Page updated successfully');
                this.loadPages();
                this.closeModal();
            },
            error: (error) => {
                console.error('Error updating page:', error);
                alert('Failed to update page');
            }
        });
    }
}
