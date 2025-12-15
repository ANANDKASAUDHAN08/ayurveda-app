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

import { StrictLogoutGuard } from './guards/strict-logout.guard';
import { CartComponent } from './pages/cart/cart.component';
import { CheckoutComponent } from './pages/checkout/checkout.component';
import { OrdersComponent } from './pages/orders/orders.component';
import { OrderDetailsComponent } from './pages/order-details/order-details.component';

export const routes: Routes = [
    // Public routes
    { path: 'home', component: HomeComponent, canActivate: [StrictLogoutGuard] },
    { path: 'for-doctors', component: DoctorLandingComponent, canActivate: [StrictLogoutGuard] },
    { path: 'for-users', component: UserLandingComponent, canActivate: [StrictLogoutGuard] },
    { path: 'hospitals', component: HospitalsComponent, canActivate: [StrictLogoutGuard] },
    { path: 'pharmacies', component: PharmaciesComponent, canActivate: [StrictLogoutGuard] },
    { path: 'find-doctors', component: DoctorListComponent, canActivate: [StrictLogoutGuard] },

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

    // Backward compatibility
    {
        path: 'dashboard',
        canActivate: [authGuard],
        children: []
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

    // Default routes
    { path: '', redirectTo: 'home', pathMatch: 'full' },
    { path: '**', redirectTo: 'home' }
];
