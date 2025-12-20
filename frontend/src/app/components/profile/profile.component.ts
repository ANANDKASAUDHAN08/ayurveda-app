import { Component, OnInit, HostListener, ChangeDetectorRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { SnackbarService } from '../../shared/services/snackbar.service';
import { HttpClient } from '@angular/common/http';
import { ProfileService } from '../../shared/services/profile.service';
import { PhoneVerificationModalComponent } from '../phone-verification-modal/phone-verification-modal.component';
import { PasswordStrengthIndicatorComponent } from 'src/app/shared/components/password-strength-indicator/password-strength-indicator.component';

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
  user: any = null;
  isEditing = false;
  isDoctor = false;
  profileForm: FormGroup;
  isLoading = false;
  isLoadingProfile = false;

  showPasswordModal = false;
  show2FAModal = false;
  showDeleteModal = false;
  newPassword = '';
  isPasswordValid: boolean = false;
  showPassword: boolean = false;

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
    private cdr: ChangeDetectorRef
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
    this.generateMockActivities();
  }

  loadUser() {
    this.isLoadingProfile = true;
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      return;
    }

    const localUser = JSON.parse(userStr);
    this.isDoctor = localUser.role === 'doctor';

    // Set member since date (mock data - in real app, fetch from backend)
    this.memberSince = new Date(2024, 0, 15); // Jan 15, 2024

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

            // Generate mock stats
            this.generateDoctorStats();
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
        error: (err) => {
          console.error('Error loading user profile:', err);
          // Fallback to localStorage if API fails
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
      console.log('File selected:', file.name);
      this.selectedFile = file;

      // Create preview
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview = reader.result as string;
        console.log('Preview generated');
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

          if (this.isDoctor) {
            this.user = { ...this.user, ...res.user }; // Assuming backend returns updated user
            // Update specific doctor fields if needed, or just rely on reloading
          } else {
            this.user = { ...this.user, ...res.user };
          }

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
          this.isLoading = false;
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

  // Generate mock activity data
  generateMockActivities() {
    const now = new Date();
    this.activities = [
      {
        type: 'appointment',
        title: 'Consultation Completed',
        description: 'Online consultation with Dr. Sharma',
        date: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
        icon: 'fa-calendar-check'
      },
      {
        type: 'profile_update',
        title: 'Profile Updated',
        description: 'Updated contact information',
        date: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
        icon: 'fa-user-edit'
      },
      {
        type: 'account',
        title: 'Account Created',
        description: 'Welcome to HealthConnect!',
        date: this.memberSince || new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
        icon: 'fa-user-plus'
      }
    ];
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

  // Generate mock doctor stats
  generateDoctorStats() {
    this.stats = {
      totalConsultations: Math.floor(Math.random() * 200) + 50,
      upcomingAppointments: Math.floor(Math.random() * 10) + 1,
      monthlyEarnings: Math.floor(Math.random() * 50000) + 20000,
      rating: 4.5 + Math.random() * 0.4 // Between 4.5 and 4.9
    };
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
    console.log('Confirm Change Password clicked');
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
    console.log('Enable 2FA clicked');
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
    console.log('Delete Account clicked');
    this.showDeleteModal = true;
  }

  confirmDeleteAccount() {
    this.profileService.deleteAccount(this.isDoctor).subscribe({
      next: () => {
        this.snackbar.success('Account deleted successfully');
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        window.location.href = '/';
      },
      error: () => {
        this.snackbar.error('Failed to delete account');
      }
    });
  }

  // Download user data
  downloadData() {
    const userData = {
      user: this.user,
      profile: this.profileForm.value,
      stats: this.isDoctor ? this.stats : null,
      activities: this.activities,
      exportDate: new Date().toISOString()
    };

    const dataStr = JSON.stringify(userData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = window.URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `healthconnect-data-${this.user?.name || 'user'}-${Date.now()}.json`;
    link.click();
    window.URL.revokeObjectURL(url);

    this.snackbar.success('Data downloaded successfully!');
    this.addActivity('account', 'Data Downloaded', 'You downloaded your account data', new Date());
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
