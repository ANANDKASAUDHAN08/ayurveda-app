import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { FavoritesService, FavoriteItem, FavoriteType } from '../../shared/services/favorites.service';
import { ContentService } from '../../shared/services/content.service';
import { DoctorService } from '../../shared/services/doctor.service';
import { Subject, forkJoin, of } from 'rxjs';
import { takeUntil, map } from 'rxjs/operators';
import { DoctorCardComponent } from '../../components/doctor-card/doctor-card.component';
import { ArticleDetailsComponent } from '../../components/article-details/article-details.component';
import { DoctorDetailModalComponent } from '../../components/doctor-detail-modal/doctor-detail-modal.component';
import { BookingModalComponent } from '../../components/booking-modal/booking-modal.component';

@Component({
    selector: 'app-favorites-page',
    standalone: true,
    imports: [CommonModule, RouterModule, FormsModule, DoctorCardComponent, ArticleDetailsComponent, DoctorDetailModalComponent, BookingModalComponent],
    templateUrl: './favorites-page.component.html',
    styleUrl: './favorites-page.component.css'
})
export class FavoritesPageComponent implements OnInit, OnDestroy {
    favoriteArticles: any[] = [];
    favoriteDoctors: any[] = [];
    favoriteHospitals: any[] = [];
    favoritePharmacies: any[] = [];

    selectedDoctorForDetails: any = null;
    selectedDoctorForBooking: any = null;

    loading = true;
    activeTab: 'all' | 'article' | 'doctor' | 'hospital' | 'pharmacy' = 'all';
    searchQuery = '';

    // Original lists for filtering
    allArticles: any[] = [];
    allDoctors: any[] = [];
    allHospitals: any[] = [];
    allPharmacies: any[] = [];

    private destroy$ = new Subject<void>();

    // For article modal
    showArticleModal = false;
    selectedArticle: any = null;

    constructor(
        private favoritesService: FavoritesService,
        private contentService: ContentService,
        private doctorService: DoctorService
    ) { }

    ngOnInit(): void {
        this.favoritesService.favorites$
            .pipe(takeUntil(this.destroy$))
            .subscribe(favorites => {
                this.loadFavoriteDetails(favorites);
            });
    }

    private loadFavoriteDetails(favorites: FavoriteItem[]) {
        this.loading = true;

        // Group by type
        const articles = favorites.filter(f => f.itemType === 'article');
        const doctors = favorites.filter(f => f.itemType === 'doctor');
        const hospitals = favorites.filter(f => f.itemType === 'hospital');
        const pharmacies = favorites.filter(f => f.itemType === 'pharmacy');

        const requests = {
            articles: this.fetchArticles(articles),
            doctors: this.fetchDoctors(doctors),
            hospitals: this.fetchHospitals(hospitals),
            pharmacies: this.fetchPharmacies(pharmacies)
        };

        forkJoin(requests).subscribe({
            next: (res) => {
                this.allArticles = res.articles;
                this.allDoctors = res.doctors;
                this.allHospitals = res.hospitals;
                this.allPharmacies = res.pharmacies;
                this.applyFilters();
                this.loading = false;
            },
            error: (err) => {
                console.error('Error loading favorite details', err);
                this.loading = false;
            }
        });
    }

    applyFilters() {
        const query = this.searchQuery.toLowerCase().trim();

        this.favoriteArticles = this.allArticles.filter(a =>
            a.title.toLowerCase().includes(query) || a.category.toLowerCase().includes(query)
        );
        this.favoriteDoctors = this.allDoctors.filter(d =>
            d.name.toLowerCase().includes(query) || (d.specialty && d.specialty.toLowerCase().includes(query))
        );
        this.favoriteHospitals = this.allHospitals.filter(h =>
            h.name.toLowerCase().includes(query) || h.city.toLowerCase().includes(query)
        );
        this.favoritePharmacies = this.allPharmacies.filter(p =>
            p.name.toLowerCase().includes(query) || p.city.toLowerCase().includes(query)
        );
    }

    setActiveTab(tab: any) {
        this.activeTab = tab;
    }

    onSearch() {
        this.applyFilters();
    }

    clearCategory(type: FavoriteType) {
        if (confirm(`Are you sure you want to remove all ${type}s from favorites?`)) {
            const items = this.favoritesService.getFavoritesByType(type);
            items.forEach(item => {
                this.favoritesService.toggleFavorite(item.itemId, type).subscribe();
            });
        }
    }

    private fetchArticles(items: FavoriteItem[]) {
        if (items.length === 0) return of([]);
        return this.contentService.getHealthArticles().pipe(
            map(res => (res.articles || []).filter((a: any) => items.some(f => f.itemId == a.id)))
        );
    }

    private fetchDoctors(items: FavoriteItem[]) {
        if (items.length === 0) return of([]);
        return this.doctorService.getDoctors({}).pipe(
            map(res => (res || []).filter((d: any) => items.some(f => f.itemId == d.id)))
        );
    }

    private fetchHospitals(items: FavoriteItem[]) {
        if (items.length === 0) return of([]);
        return this.contentService.getHospitals().pipe(
            map(res => (res.hospitals || []).filter((h: any) => items.some(f => f.itemId == h.id)))
        );
    }

    private fetchPharmacies(items: FavoriteItem[]) {
        if (items.length === 0) return of([]);
        return this.contentService.getPharmacies().pipe(
            map(res => (res.pharmacies || []).filter((p: any) => items.some(f => f.itemId == p.id)))
        );
    }

    toggleFavorite(event: Event, item: any, type: FavoriteType) {
        event.stopPropagation();
        this.favoritesService.toggleFavorite(item.id, type).subscribe();
    }

    openArticle(article: any) {
        this.selectedArticle = article;
        this.showArticleModal = true;
    }

    closeArticle() {
        this.showArticleModal = false;
        this.selectedArticle = null;
    }

    // Doctor Details & Booking
    openDetails(doctor: any) {
        this.selectedDoctorForDetails = doctor;
    }

    closeDetails() {
        this.selectedDoctorForDetails = null;
    }

    openBooking(doctor: any) {
        this.selectedDoctorForDetails = null;
        this.selectedDoctorForBooking = doctor;
    }

    closeBooking() {
        this.selectedDoctorForBooking = null;
    }

    onBookingConfirmed(bookingData: any) {
        console.log('Booking confirmed in favorites:', bookingData);
        // Maybe show a success snackbar here
        this.closeBooking();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }
}
