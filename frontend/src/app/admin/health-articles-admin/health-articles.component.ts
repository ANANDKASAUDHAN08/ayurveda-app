import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../shared/services/admin.service';
import { SnackbarService } from '../../shared/services/snackbar.service';

@Component({
    selector: 'app-health-articles',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './health-articles.component.html',
    styleUrl: './health-articles.component.css'
})
export class HealthArticlesComponent implements OnInit {
    articles: any[] = [];
    loading = true;
    showModal = false;
    modalMode: 'add' | 'edit' = 'add';

    selectedArticle = {
        id: 0,
        title: '',
        excerpt: '',
        content: '',
        image_url: '',
        author: '',
        category: '',
        is_published: false
    };

    constructor(
        private adminService: AdminService,
        private snackbarService: SnackbarService
    ) { }

    ngOnInit() {
        this.loadArticles();
    }

    loadArticles() {
        this.loading = true;
        this.adminService.getHealthArticles().subscribe({
            next: (response) => {
                this.articles = response.articles || [];
                this.loading = false;
            },
            error: (error) => {
                console.error('Error loading articles:', error);
                this.snackbarService.show('Failed to load articles', 'error');
                this.loading = false;
            }
        });
    }

    openAddModal() {
        this.modalMode = 'add';
        this.selectedArticle = {
            id: 0,
            title: '',
            excerpt: '',
            content: '',
            image_url: '',
            author: '',
            category: '',
            is_published: false
        };
        this.showModal = true;
    }

    openEditModal(article: any) {
        this.modalMode = 'edit';
        this.selectedArticle = { ...article };
        this.showModal = true;
    }

    closeModal() {
        this.showModal = false;
    }

    save() {
        if (this.modalMode === 'add') {
            this.adminService.addHealthArticle(this.selectedArticle).subscribe({
                next: () => {
                    this.snackbarService.show('Article added successfully', 'success');
                    this.loadArticles();
                    this.closeModal();
                },
                error: (error) => {
                    console.error('Error adding article:', error);
                    this.snackbarService.show('Failed to add article', 'error');
                }
            });
        } else {
            this.adminService.updateHealthArticle(this.selectedArticle.id, this.selectedArticle).subscribe({
                next: () => {
                    this.snackbarService.show('Article updated successfully', 'success');
                    this.loadArticles();
                    this.closeModal();
                },
                error: (error) => {
                    console.error('Error updating article:', error);
                    this.snackbarService.show('Failed to update article', 'error');
                }
            });
        }
    }

    delete(id: number) {
        if (confirm('Are you sure you want to delete this article?')) {
            this.adminService.deleteHealthArticle(id).subscribe({
                next: () => {
                    this.snackbarService.show('Article deleted successfully', 'success');
                    this.loadArticles();
                },
                error: (error) => {
                    console.error('Error deleting article:', error);
                    this.snackbarService.show('Failed to delete article', 'error');
                }
            });
        }
    }

    togglePublished(article: any) {
        const updated = { ...article, is_published: !article.is_published };
        this.adminService.updateHealthArticle(article.id, updated).subscribe({
            next: () => {
                this.loadArticles();
                this.snackbarService.show(updated.is_published ? 'Article published' : 'Article unpublished', 'success');
            },
            error: (error) => {
                console.error('Error toggling published status:', error);
                this.snackbarService.show('Failed to update status', 'error');
            }
        });
    }
}
