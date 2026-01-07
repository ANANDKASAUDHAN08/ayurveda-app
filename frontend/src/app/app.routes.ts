import { Routes } from '@angular/router';
import { DoctorListComponent } from './components/doctor-list/doctor-list.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { ProfileComponent } from './components/profile/profile.component';
import { HomeComponent } from './components/home/home.component';
import { DoctorDashboardComponent } from './components/doctor-dashboard/doctor-dashboard.component';
import { DoctorLandingComponent } from './components/doctor-landing/doctor-landing.component';
import { UserLandingComponent } from './components/user-landing/user-landing.component';
import { HospitalsComponent } from './components/hospitals/hospitals.component';
import { PharmaciesComponent } from './components/pharmacies/pharmacies.component';
import { SlotConfigurationComponent } from './components/slot-configuration/slot-configuration.component';
import { authGuard } from './guards/auth.guard';
import { AdminGuard } from './guards/admin.guard';
import { AdminLayoutComponent } from './admin/admin-layout/admin-layout.component';
import { AdminDashboardComponent } from './admin/admin-dashboard/admin-dashboard.component';
import { FeaturedDoctorsComponent } from './admin/featured-doctors-admin/featured-doctors.component';
import { HealthArticlesComponent } from './admin/health-articles-admin/health-articles.component';
import { HospitalsAdminComponent } from './admin/hospitals-admin/hospitals-admin.component';
import { PharmaciesAdminComponent } from './admin/pharmacies-admin/pharmacies-admin.component';
import { StaticPagesComponent } from './admin/static-pages/static-pages.component';
import { StaticPageComponent } from './components/static-page/static-page.component';
import { AdminLoginComponent } from './admin/admin-login/admin-login.component';
import { DoctorsAdminComponent } from './admin/admin-doctors/doctors-admin.component';
import { NearbyServicesComponent } from './pages/nearby-services/nearby-services.component';

import { StrictLogoutGuard } from './guards/strict-logout.guard';
import { CartComponent } from './pages/cart/cart.component';
import { CheckoutComponent } from './pages/checkout/checkout.component';
import { OrdersComponent } from './pages/orders/orders.component';
import { OrderDetailsComponent } from './pages/order-details/order-details.component';
import { SearchResultsComponent } from './pages/search-results/search-results.component';
import { MedicalDevicesComponent } from './components/medical-devices/medical-devices.component';
import { MedicinesComponent } from './components/medicines/medicines.component';
import { VerifyEmailComponent } from './components/verify-email/verify-email.component';
import { ResetPasswordComponent } from './components/reset-password/reset-password.component';
import { HealthPlansComponent } from './components/health-plans/health-plans.component';
import { LabTestsComponent } from './components/lab-tests/lab-tests.component';
import { CareerComponent } from './components/career/career.component';
import { AboutUsComponent } from './components/about-us/about-us.component';
import { HelpSupportComponent } from './components/help-support/help-support.component';
import { SettingsComponent } from './components/settings/settings.component';
import { ContactComponent } from './components/contact/contact.component';
import { EmergencyHubComponent } from './components/emergency-hub/emergency-hub.component';
import { FirstAidGuideComponent } from './components/first-aid-guide/first-aid-guide.component';
import { NearbyHospitalsComponent } from './components/nearby-hospitals/nearby-hospitals.component';
import { EmergencyCallHistoryComponent } from './components/emergency-call-history/emergency-call-history.component';
import { LandingPageComponent } from './components/medicine-type/landing-page/landing-page.component';
import { MedicineTypeSelectorComponent } from './components/medicine-type/medicine-type-selector/medicine-type-selector.component';
import { AyurvedaDashboardComponent } from './components/medicine-type/ayurveda/ayurveda-dashboard/ayurveda-dashboard.component';
import { HomeopathyDashboardComponent } from './components/medicine-type/homeopathy-dashboard/homeopathy-dashboard.component';
import { AllopathyDashboardComponent } from './components/medicine-type/allopathy/allopathy-dashboard/allopathy-dashboard.component';
import { AyurvedaWellnessComponent } from './components/medicine-type/ayurveda/ayurveda-wellness/ayurveda-wellness.component';
import { YogaComponent } from './components/medicine-type/ayurveda/yoga/yoga.component';
import { AyurvedaArticleComponent } from './components/medicine-type/ayurveda/ayurveda-article/ayurveda-article.component';
import { AyurvedaAboutComponent } from './components/medicine-type/ayurveda/ayurveda-about/ayurveda-about.component';
import { AyurvedaSearchComponent } from './components/medicine-type/ayurveda/ayurveda-search/ayurveda-search.component';
import { PrakritiQuizComponent } from './components/medicine-type/ayurveda/prakriti-quiz/prakriti-quiz.component';
import { HealthArticlesListComponent } from './pages/health-articles/health-articles-list.component';
import { FavoritesPageComponent } from './pages/favorites/favorites-page.component';

export const routes: Routes = [
    // Public routes (accessible to everyone)
    { path: 'home', component: HomeComponent },
    { path: 'articles', component: HealthArticlesListComponent },
    { path: 'favorites', component: FavoritesPageComponent },

    // Guest-only routes (login/registration pages)
    { path: 'for-doctors', component: DoctorLandingComponent, canActivate: [StrictLogoutGuard] },
    { path: 'for-users', component: UserLandingComponent, canActivate: [StrictLogoutGuard] },

    // Public service pages
    { path: 'hospitals', component: HospitalsComponent },
    { path: 'pharmacies', component: PharmaciesComponent },
    { path: 'find-doctors', component: DoctorListComponent },
    { path: 'medicines', component: MedicinesComponent },
    { path: 'medical-devices', component: MedicalDevicesComponent },
    { path: 'health-plans', component: HealthPlansComponent },
    { path: 'lab-tests', component: LabTestsComponent },
    { path: 'career', component: CareerComponent },
    { path: 'about-us', component: AboutUsComponent },
    { path: 'help-support', component: HelpSupportComponent },
    { path: 'contact', component: ContactComponent },
    { path: 'wellness', component: AyurvedaWellnessComponent },
    { path: 'emergency', component: EmergencyHubComponent }, // Emergency services - no auth required for quick access
    { path: 'first-aid', component: FirstAidGuideComponent }, // First Aid Guide - no auth required
    { path: 'nearby-hospitals', component: NearbyHospitalsComponent }, // Nearby Hospitals - no auth required
    { path: 'emergency-history', component: EmergencyCallHistoryComponent }, // Call History - requires auth

    // Medicine Type System (Phase 12)
    { path: 'landing', component: LandingPageComponent }, // Common landing page
    { path: 'choose-type', component: MedicineTypeSelectorComponent }, // Medicine type selector
    { path: 'ayurveda', component: AyurvedaDashboardComponent }, // Ayurveda dashboard
    { path: 'ayurveda/search', component: AyurvedaSearchComponent },
    { path: 'ayurveda/ayurveda-article', component: AyurvedaArticleComponent },
    { path: 'ayurveda/ayurveda-wellness', component: AyurvedaWellnessComponent },
    { path: 'ayurveda/yoga', component: YogaComponent },
    { path: 'ayurveda/about', component: AyurvedaAboutComponent },
    { path: 'ayurveda/prakriti', component: PrakritiQuizComponent },
    { path: 'homeopathy', component: HomeopathyDashboardComponent }, // Homeopathy dashboard
    { path: 'allopathy', component: AllopathyDashboardComponent }, // Allopathy dashboard

    // Email verification (public - no auth required)
    { path: 'verify-email', component: VerifyEmailComponent },
    { path: 'reset-password', component: ResetPasswordComponent },

    // Shared prescription view (public - no auth required)
    {
        path: 'share/rx/:token',
        loadComponent: () => import('./components/prescriptions/shared-prescription-view/shared-prescription-view.component').then(m => m.SharedPrescriptionViewComponent)
    },

    // Static Pages
    { path: 'privacy-policy', component: StaticPageComponent },
    { path: 'terms-of-service', component: StaticPageComponent },
    { path: 'cookie-policy', component: StaticPageComponent },
    { path: 'hipaa-compliance', component: StaticPageComponent },

    // Cart Page
    {
        path: 'cart',
        component: CartComponent,
        canActivate: [authGuard]
    },
    {
        path: 'checkout',
        component: CheckoutComponent,
        canActivate: [authGuard]
    },
    {
        path: 'orders',
        component: OrdersComponent,
        canActivate: [authGuard]
    },
    {
        path: 'orders/:id',
        component: OrderDetailsComponent,
        canActivate: [authGuard]
    },

    {
        path: 'search',
        component: SearchResultsComponent
    },

    // Admin routes
    {
        path: 'admin',
        children: [
            // Login route (public)
            { path: 'login', component: AdminLoginComponent, canActivate: [StrictLogoutGuard] },
            { path: '', redirectTo: 'login', pathMatch: 'full' },

            // Protected admin routes with layout
            {
                path: 'dashboard',
                component: AdminLayoutComponent,
                canActivate: [AdminGuard],
                children: [{ path: '', component: AdminDashboardComponent }]
            },
            {
                path: 'doctors',
                component: AdminLayoutComponent,
                canActivate: [AdminGuard],
                children: [{ path: '', component: DoctorsAdminComponent }]
            },
            {
                path: 'featured-doctors',
                component: AdminLayoutComponent,
                canActivate: [AdminGuard],
                children: [{ path: '', component: FeaturedDoctorsComponent }]
            },
            {
                path: 'articles',
                component: AdminLayoutComponent,
                canActivate: [AdminGuard],
                children: [{ path: '', component: HealthArticlesComponent }]
            },
            {
                path: 'hospitals',
                component: AdminLayoutComponent,
                canActivate: [AdminGuard],
                children: [{ path: '', component: HospitalsAdminComponent }]
            },
            {
                path: 'pharmacies',
                component: AdminLayoutComponent,
                canActivate: [AdminGuard],
                children: [{ path: '', component: PharmaciesAdminComponent }]
            },
            {
                path: 'pages',
                component: AdminLayoutComponent,
                canActivate: [AdminGuard],
                children: [{ path: '', component: StaticPagesComponent }]
            }
        ]
    },

    // Legacy redirects
    { path: 'login', redirectTo: 'for-users', pathMatch: 'full' },
    { path: 'register', redirectTo: 'for-users', pathMatch: 'full' },
    { path: 'doctor-register', redirectTo: 'for-doctors', pathMatch: 'full' },
    { path: 'doctor-login', redirectTo: 'for-doctors', pathMatch: 'full' },

    // User routes
    {
        path: 'user/dashboard',
        component: DashboardComponent,
        canActivate: [authGuard],
        data: { role: 'user' }
    },
    {
        path: 'user/profile',
        component: ProfileComponent,
        canActivate: [authGuard],
        data: { role: 'user' }
    },
    {
        path: 'user/settings',
        component: SettingsComponent,
        canActivate: [authGuard],
        data: { role: 'user' }
    },
    {
        path: 'user/prescriptions',
        loadComponent: () => import('./components/prescriptions/prescriptions-list/prescriptions-list.component').then(m => m.PrescriptionsListComponent),
        canActivate: [authGuard],
        data: { role: 'user' }
    },
    {
        path: 'user/prescriptions/:id',
        loadComponent: () => import('./components/prescriptions/prescription-detail/prescription-detail.component').then(m => m.PrescriptionDetailComponent),
        canActivate: [authGuard],
        data: { role: 'user' }
    },
    {
        path: 'user/find-doctors',
        component: DoctorListComponent,
        canActivate: [],
        data: { role: 'user' }
    },

    // Doctor routes
    {
        path: 'doctor/dashboard',
        component: DoctorDashboardComponent,
        canActivate: [authGuard],
        data: { role: 'doctor' }
    },
    {
        path: 'doctor/availability',
        component: SlotConfigurationComponent,
        canActivate: [authGuard],
        data: { role: 'doctor' }
    },
    {
        path: 'doctor/profile',
        component: ProfileComponent,
        canActivate: [authGuard],
        data: { role: 'doctor' }
    },
    {
        path: 'doctor/settings',
        component: SettingsComponent,
        canActivate: [authGuard],
        data: { role: 'doctor' }
    },

    // Backward compatibility
    {
        path: 'doctor/dashboard',
        canActivate: [authGuard],
        children: []
    },
    {
        path: 'doctor/refills',
        loadComponent: () => import('./components/doctor/refill-dashboard/refill-dashboard.component').then(m => m.RefillDashboardComponent),
        canActivate: [authGuard],
        data: { role: 'doctor' }
    },
    {
        path: 'doctor/verify-prescriptions',
        loadComponent: () => import('./components/doctor/prescription-verification/prescription-verification.component').then(m => m.PrescriptionVerificationComponent),
        canActivate: [authGuard],
        data: { role: 'doctor' }
    },
    {
        path: 'notifications',
        loadComponent: () => import('./components/notifications/notifications-page/notifications-page.component').then(m => m.NotificationsPageComponent),
        canActivate: [authGuard]
    },
    {
        path: 'profile',
        canActivate: [authGuard],
        children: []
    },
    {
        path: 'doctor-dashboard',
        redirectTo: 'doctor/dashboard',
        pathMatch: 'full'
    },

    { path: 'nearby-services', component: NearbyServicesComponent },
    // Default routes
    { path: '', redirectTo: 'home', pathMatch: 'full' },
    { path: '**', redirectTo: 'home' }
];
