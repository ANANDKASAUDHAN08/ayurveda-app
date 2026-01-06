import { environment } from '@env/environment';
import { Component, OnInit, HostListener, ChangeDetectorRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SnackbarService } from '../../shared/services/snackbar.service';
import { HttpClient } from '@angular/common/http';
import { ProfileService } from '../../shared/services/profile.service';
import { AuthService } from '../../shared/services/auth.service';
import { PhoneVerificationModalComponent } from '../phone-verification-modal/phone-verification-modal.component';
import { PasswordStrengthIndicatorComponent } from 'src/app/shared/components/password-strength-indicator/password-strength-indicator.component';
import { ProfileExportService } from '../../shared/services/profile-export.service';

interface ActivityItem {
  type: 'appointment' | 'profile_update' | 'account';
  title: string;
  description: string;
  date: Date;
  icon: string;
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    PhoneVerificationModalComponent,
    PasswordStrengthIndicatorComponent
  ],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  environment = environment;
  user: any = null;
  isEditing = false;
  isDoctor = false;
  profileForm: FormGroup;
  isLoading = false;
  isLoadingProfile = false;
  showExportMenu = false;

  showPasswordModal = false;
  show2FAModal = false;
  showDeleteModal = false;
  newPassword = '';
  isPasswordValid: boolean = false;
  showPassword: boolean = false;
  isPasswordFocused: boolean = false;

  selectedFile: File | null = null;
  imagePreview: string | null = null;

  @ViewChild(PhoneVerificationModalComponent) phoneModal!: PhoneVerificationModalComponent;

  // Tab navigation
  activeTab: 'profile' | 'activity' | 'security' = 'profile';

  // Profile completion
  profileCompletion = 0;
  memberSince: Date | null = null;

  // Activity timeline
  activities: ActivityItem[] = [];

  // Stats for doctors
  stats = {
    totalConsultations: 0,
    upcomingAppointments: 0,
    monthlyEarnings: 0,
    rating: 0
  };

  // Scroll to top
  showScrollToTop = false;

  constructor(
    private fb: FormBuilder,
    private snackbar: SnackbarService,
    private http: HttpClient,
    private profileService: ProfileService,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private profileExportService: ProfileExportService
  ) {
    this.profileForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      // New User Fields
      gender: [''],
      dob: [''],
      blood_group: [''],
      address: [''],
      emergency_contact_name: [''],
      emergency_contact_phone: [''],
      height: [''],
      weight: [''],
      allergies: ['']
    });
  }

  ngOnInit() {
    this.loadUser();
    this.loadActivityFeed(); // Load real activity feed
    this.loadStats(); // Load real stats
  }

  loadUser() {
    this.isLoadingProfile = true;
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      return;
    }

    const localUser = JSON.parse(userStr);
    this.isDoctor = localUser.role === 'doctor';

    if (this.isDoctor) {
      // Add doctor specific controls
      this.profileForm.addControl('specialization', this.fb.control('', Validators.required));
      this.profileForm.addControl('experience', this.fb.control(0));
      this.profileForm.addControl('consultationFee', this.fb.control(500));
      this.profileForm.addControl('about', this.fb.control(''));
      this.profileForm.addControl('qualifications', this.fb.control(''));
      this.profileForm.addControl('languages', this.fb.control(''));
      this.profileForm.addControl('mode', this.fb.control('both'));
      this.profileForm.addControl('image', this.fb.control(''));

      // New Doctor Fields
      this.profileForm.addControl('registration_number', this.fb.control(''));
      this.profileForm.addControl('title', this.fb.control(''));
      this.profileForm.addControl('awards', this.fb.control(''));
      this.profileForm.addControl('clinic_name', this.fb.control(''));
      this.profileForm.addControl('clinic_address', this.fb.control(''));
      this.profileForm.addControl('clinic_timings', this.fb.control(''));
      this.profileForm.addControl('website', this.fb.control(''));
      this.profileForm.addControl('linkedin', this.fb.control(''));

      // Fetch doctor profile from API
      this.profileService.getProfile(true).subscribe({
        next: (doctors) => {
          const myProfile = doctors.find((d: any) => d.userId === localUser.id);
          if (myProfile) {
            // Update user data
            this.user = {
              id: localUser.id,
              name: myProfile.name,
              email: localUser.email,
              phone: myProfile.phone,
              role: localUser.role
            };

            // Update localStorage
            localStorage.setItem('user', JSON.stringify(this.user));

            // Populate form with doctor profile data
            this.profileForm.patchValue({
              name: myProfile.name,
              email: localUser.email,
              phone: myProfile.phone || '',
              // Doctor specific
              specialization: myProfile.specialization,
              experience: myProfile.experience,
              consultationFee: myProfile.consultationFee,
              about: myProfile.about,
              qualifications: myProfile.qualifications,
              languages: myProfile.languages,
              mode: myProfile.mode,
              image: myProfile.image,
              // New Doctor Fields
              registration_number: myProfile.registration_number,
              title: myProfile.title,
              awards: myProfile.awards,
              clinic_name: myProfile.clinic_name,
              clinic_address: myProfile.clinic_address,
              clinic_timings: myProfile.clinic_timings,
              website: myProfile.website,
              linkedin: myProfile.linkedin
            });

            // Member since from created_at
            if (myProfile.created_at) {
              this.memberSince = new Date(myProfile.created_at);
            }
          }
          this.calculateProfileCompletion();
          setTimeout(() => {
            this.isLoadingProfile = false;
          }, 1000);
        },
        error: (err) => {
          console.error('Error loading doctor profile:', err);
          // Fallback to localStorage
          this.user = localUser;
          this.profileForm.patchValue({
            name: localUser.name,
            email: localUser.email,
            phone: localUser.phone || ''
          });
          this.calculateProfileCompletion();
          this.isLoadingProfile = false;
        }
      });
    } else {
      // For regular users, fetch user profile from API
      this.profileService.getProfile(false).subscribe({
        next: (response) => {
          this.user = response.user;

          // Update localStorage with fresh data
          localStorage.setItem('user', JSON.stringify(this.user));

          // Populate basic user fields
          this.profileForm.patchValue({
            name: this.user.name,
            email: this.user.email,
            phone: this.user.phone || '',
            // New User Fields
            gender: this.user.gender,
            dob: this.formatDateToIST(this.user.dob),
            blood_group: this.user.blood_group,
            address: this.user.address,
            emergency_contact_name: this.user.emergency_contact_name,
            emergency_contact_phone: this.user.emergency_contact_phone,
            height: this.user.height,
            weight: this.user.weight,
            allergies: this.user.allergies
          });
          this.calculateProfileCompletion();
          setTimeout(() => {
            this.isLoadingProfile = false;
          }, 1000);
        },
        error: (err: any) => {
          console.error('Error loading user profile:', err);
          this.isLoadingProfile = false;

          if (err.status === 404) {
            this.snackbar.error('Session expired or user not found. Please logout and login again.');
          } else {
            this.snackbar.error('Failed to load profile from server. Showing local data.');
          }

          // Fallback to localStorage if API fails
          this.user = localUser;
          this.calculateProfileCompletion();
        }
      });
    }
  }

  toggleEdit() {
    this.isEditing = !this.isEditing;
    if (!this.isEditing) {
      this.loadUser(); //  Reset form if cancelling
    }
  }

  onPasswordValidityChange(isValid: boolean): void {
    this.isPasswordValid = isValid;
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;

      // Create preview
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview = reader.result as string;
        this.cdr.detectChanges(); // Force update
      };
      reader.readAsDataURL(file);
    }
  }

  saveProfile() {
    if (this.profileForm.valid) {
      this.isLoading = true;

      const formData = new FormData();
      Object.keys(this.profileForm.controls).forEach(key => {
        const value = this.profileForm.get(key)?.value;
        if (value !== null && value !== undefined) {
          formData.append(key, value);
        }
      });

      if (this.selectedFile) {
        formData.append('profile_image', this.selectedFile);
      }

      this.profileService.updateProfile(this.isDoctor, formData).subscribe({
        next: (res: any) => {
          this.isLoading = false;
          this.isEditing = false;

          this.user = { ...this.user, ...res.user };

          // Update profile image if returned
          if (res.user && res.user.profile_image) {
            this.user.profile_image = res.user.profile_image;
          }

          localStorage.setItem('user', JSON.stringify(this.user));
          this.snackbar.success('Profile updated successfully!');
          this.calculateProfileCompletion();
          this.addActivity('profile_update', 'Profile Updated', 'You updated your profile information', new Date());

          // Clear file selection
          this.selectedFile = null;
        },
        error: (err) => {
          setTimeout(() => {
            this.isLoading = false;
          }, 1000);

          console.error('Update error:', err);
          this.snackbar.error('Failed to update profile');
        }
      });
    } else {
      this.profileForm.markAllAsTouched();
    }
  }

  // Tab navigation
  switchTab(tab: 'profile' | 'activity' | 'security') {
    this.activeTab = tab;
  }

  // Calculate profile completion percentage
  calculateProfileCompletion() {
    let fields: string[] = [];

    if (this.isDoctor) {
      fields = [
        'name', 'email', 'phone', 'specialization', 'experience', 'consultationFee',
        'about', 'qualifications', 'languages', 'clinic_name', 'clinic_address'
      ];
    } else {
      fields = [
        'name', 'email', 'phone', 'gender', 'dob', 'blood_group', 'address'
      ];
    }

    let filledFields = 0;
    fields.forEach(field => {
      const value = this.profileForm.get(field)?.value;
      if (value && value !== '' && value !== 0) {
        filledFields++;
      }
    });

    this.profileCompletion = Math.round((filledFields / fields.length) * 100);
  }

  // Load real activity feed from backend
  loadActivityFeed() {
    this.http.get<any[]>(`${environment.apiUrl}/appointments/activity-feed`).subscribe({
      next: (activities) => {
        this.activities = activities.map(activity => ({
          ...activity,
          date: new Date(activity.date)
        }));
      },
      error: (err) => {
        console.error('Error loading activity feed:', err);
        // Fallback to empty array
        this.activities = [];
      }
    });
  }

  // Add new activity
  addActivity(type: ActivityItem['type'], title: string, description: string, date: Date) {
    this.activities.unshift({
      type,
      title,
      description,
      date,
      icon: type === 'appointment' ? 'fa-calendar-check' : type === 'profile_update' ? 'fa-user-edit' : 'fa-shield-alt'
    });

    // Keep only last 10 activities
    if (this.activities.length > 10) {
      this.activities = this.activities.slice(0, 10);
    }
  }

  // Load real stats from backend
  loadStats() {
    this.http.get<any>(`${environment.apiUrl}/appointments/stats`).subscribe({
      next: (stats) => {
        this.stats = {
          totalConsultations: stats.totalConsultations || 0,
          upcomingAppointments: stats.upcomingAppointments || 0,
          monthlyEarnings: 0, // Can add this later if needed
          rating: 0 // Can add this later if needed
        };
      },
      error: (err) => {
        console.error('Error loading stats:', err);
        // Keep default zeros
      }
    });
  }

  // Format date helper
  formatDate(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    return date.toLocaleDateString();
  }

  // Get member since string
  getMemberSince(): string {
    if (!this.memberSince) return 'Recently';
    const now = new Date();
    const years = now.getFullYear() - this.memberSince.getFullYear();
    const months = now.getMonth() - this.memberSince.getMonth() + years * 12;

    if (months < 1) return 'This month';
    if (months < 12) return `${months} month${months > 1 ? 's' : ''} ago`;
    return `${years} year${years > 1 ? 's' : ''} ago`;
  }

  // Listen to window scroll
  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.showScrollToTop = window.pageYOffset > 300;
  }

  // Scroll to top
  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Change password
  changePassword() {
    this.showPasswordModal = true;
    this.newPassword = '';
    this.showPassword = false;
  }

  confirmChangePassword() {
    if (this.newPassword && this.newPassword.length >= 6) {
      this.profileService.changePassword(this.isDoctor, this.newPassword).subscribe({
        next: () => {
          this.snackbar.success('Password changed successfully!');
          this.addActivity('account', 'Password Changed', 'You updated your account password', new Date());
          this.showPasswordModal = false;
        },
        error: () => {
          this.snackbar.error('Failed to change password');
        }
      });
    } else {
      this.snackbar.error('Password must be at least 6 characters');
    }
  }

  // Enable 2FA
  enable2FA() {
    this.show2FAModal = true;
  }

  confirmEnable2FA() {
    this.profileService.enable2FA(this.isDoctor).subscribe({
      next: () => {
        this.snackbar.success('Two-Factor Authentication enabled!');
        this.addActivity('account', '2FA Enabled', 'Two-factor authentication activated', new Date());
        this.show2FAModal = false;
      },
      error: () => {
        this.snackbar.error('Failed to enable 2FA');
      }
    });
  }

  // Delete account
  deleteAccount() {
    this.showDeleteModal = true;
  }

  confirmDeleteAccount() {
    this.profileService.deleteAccount(this.isDoctor).subscribe({
      next: () => {
        this.snackbar.success('Account deleted successfully');
        // Use AuthService logout to properly clear state
        this.authService.logout();
        // Redirect to home page
        this.router.navigate(['/']);
      },
      error: () => {
        this.snackbar.error('Failed to delete account');
      }
    });
  }

  // Multi-Format Export Methods
  toggleExportMenu() {
    this.showExportMenu = !this.showExportMenu;
  }

  // Close menu when clicking outside
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.export-container')) {
      this.showExportMenu = false;
    }
  }

  async exportData(format: 'pdf' | 'word' | 'text' | 'json') {
    this.showExportMenu = false;
    const data = this.profileExportService.prepareExportData(this.user, this.profileForm.value, this.isDoctor, this.stats);
    const profileImage = this.user?.profile_image;

    switch (format) {
      case 'pdf':
        await this.profileExportService.exportAsPDF(data, profileImage);
        break;
      case 'word':
        await this.profileExportService.exportAsWord(data, profileImage);
        break;
      case 'text':
        this.profileExportService.exportAsText(data);
        break;
      case 'json':
        this.profileExportService.exportAsJSON(data);
        break;
    }

    this.addActivity('account', 'Data Exported', `Profile exported as ${format.toUpperCase()}`, new Date());
    this.snackbar.success(`Profile exported as ${format.toUpperCase()}!`);
  }

  // Format Date to IST (YYYY-MM-DD)
  formatDateToIST(isoDate: string): string {
    if (!isoDate) return '';
    const date = new Date(isoDate);
    if (isNaN(date.getTime())) return '';

    // Convert to IST by formatting in Asia/Kolkata timezone
    const istDate = new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));

    // Extract YYYY-MM-DD
    const year = istDate.getFullYear();
    const month = String(istDate.getMonth() + 1).padStart(2, '0');
    const day = String(istDate.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  // Open phone verification modal
  openPhoneVerification() {
    this.phoneModal.open(this.user.id, this.user.name, this.user.phone);
  }

  // Handle successful phone verification
  onPhoneVerified(phone: string) {
    // Update local user data
    this.user.phone = phone;
    this.user.phone_verified = true;

    // Update localStorage
    localStorage.setItem('user', JSON.stringify(this.user));

    // Show success message
    this.snackbar.success('✅ Phone number verified successfully!');
    this.loadUser();
    this.calculateProfileCompletion();
  }
}
