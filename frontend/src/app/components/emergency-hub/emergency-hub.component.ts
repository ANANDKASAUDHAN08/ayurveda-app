import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { EmergencyService, EmergencyContact, MedicalInformation } from '../../shared/services/emergency.service';
import { Router, RouterLink } from '@angular/router';
import { EmergencyContactModalComponent } from '../emergency-contact-modal/emergency-contact-modal.component';
import { MedicalInfoModalComponent } from '../medical-info-modal/medical-info-modal.component';
import { AuthService } from '../../shared/services/auth.service';
import { SnackbarService } from '../../shared/services/snackbar.service';
import { CdkDragDrop, moveItemInArray, DragDropModule } from '@angular/cdk/drag-drop';
import { MobileLocationBarComponent } from '../../shared/components/mobile-location-bar/mobile-location-bar.component';

@Component({
  selector: 'app-emergency-hub',
  standalone: true,
  imports: [CommonModule, HttpClientModule, RouterLink, EmergencyContactModalComponent, MedicalInfoModalComponent, DragDropModule, MobileLocationBarComponent],
  templateUrl: './emergency-hub.component.html',
  styleUrl: './emergency-hub.component.css'
})
export class EmergencyHubComponent implements OnInit {
  emergencyContacts: EmergencyContact[] = [];
  medicalInfo: MedicalInformation | null = null;
  currentLocation: GeolocationCoordinates | null = null;
  ambulanceNumber = '108'; // India emergency number
  isLoggedIn = false;

  // Modal states
  showContactModal = false;
  showMedicalModal = false;
  editingContact: EmergencyContact | null = null;

  constructor(
    private emergencyService: EmergencyService,
    private authService: AuthService,
    private snackbar: SnackbarService,
    private router: Router
  ) { }

  ngOnInit() {
    this.checkAuthStatus();
    this.loadEmergencyContacts();
    this.loadMedicalInfo();
    this.detectLocation();
  }

  // Check if user is logged in
  checkAuthStatus() {
    this.isLoggedIn = this.authService.isLoggedIn();
  }

  // Detect current location
  detectLocation() {
    this.emergencyService.getCurrentLocation()
      .then(coords => {
        this.currentLocation = coords;
      })
      .catch(error => {
        console.warn('Location detection failed:', error);
        // Continue without location - not critical
      });
  }

  // Call ambulance - CRITICAL FUNCTION
  callAmbulance() {
    // Confirm before calling
    const confirmed = confirm(
      `⚠️ EMERGENCY CALL\n\nThis will dial ${this.ambulanceNumber} for emergency ambulance service.\n\n` +
      (this.currentLocation ?
        `Your location: ${this.currentLocation.latitude.toFixed(4)}, ${this.currentLocation.longitude.toFixed(4)}\n\n` :
        'Location not detected. You may need to provide your address.\n\n') +
      'Proceed with call?'
    );

    if (confirmed) {
      // Call emergency number
      this.emergencyService.callEmergencyNumber(this.ambulanceNumber, this.currentLocation || undefined);
    }
  }

  // Navigate to nearby hospitals
  showNearbyHospitals() {
    this.router.navigate(['/nearby-hospitals']);
  }

  // Navigate to emergency contacts management
  showEmergencyContacts() {
    // Scroll to contacts section
    const contactsSection = document.getElementById('contacts-section');
    if (contactsSection) {
      contactsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  // Navigate to medical info section
  showMedicalInfo() {
    // Scroll to medical info section
    const medicalSection = document.getElementById('medical-info-section');
    if (medicalSection) {
      medicalSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  // Navigate to first aid guide
  showFirstAid() {
    this.router.navigate(['/first-aid']);
  }

  // ============ CONTACT MODAL METHODS ============

  // Load emergency contacts
  loadEmergencyContacts() {
    if (!this.isLoggedIn) {
      this.emergencyContacts = [];
      return;
    }
    this.emergencyService.getEmergencyContacts().subscribe({
      next: (contacts) => {
        this.emergencyContacts = contacts;
      },
      error: (error) => {
        console.error('Failed to load emergency contacts:', error);
        this.emergencyContacts = [];
      }
    });
  }

  // Add new contact
  addContact() {
    if (!this.isLoggedIn) {
      this.snackbar.warning('Please login to save emergency contacts', 4000);
      setTimeout(() => {
        this.router.navigate(['/for-users']);
      }, 1000);
      return;
    }
    this.editingContact = null;
    this.showContactModal = true;
  }

  // Edit existing contact
  editContact(contact: EmergencyContact) {
    if (!this.isLoggedIn) {
      this.snackbar.warning('Please login to edit contacts');
      return;
    }
    this.editingContact = contact;
    this.showContactModal = true;
  }

  // Save contact (add or update)
  saveContact(contactData: EmergencyContact) {
    if (this.editingContact && this.editingContact.id) {
      // Update existing contact
      this.emergencyService.updateEmergencyContact(this.editingContact.id, contactData).subscribe({
        next: () => {
          this.loadEmergencyContacts();
          this.showContactModal = false;
          this.snackbar.success('Contact updated successfully!');
        },
        error: (error) => {
          console.error('Failed to update contact:', error);
          this.snackbar.error('Failed to update contact. Please try again.');
        }
      });
    } else {
      // Add new contact
      this.emergencyService.addEmergencyContact(contactData).subscribe({
        next: () => {
          this.loadEmergencyContacts();
          this.showContactModal = false;
          this.snackbar.success('Contact added successfully!');
        },
        error: (error) => {
          console.error('Failed to add contact:', error);
          this.snackbar.error('Failed to add contact. Please try again.');
        }
      });
    }
  }

  // Delete contact
  deleteContact(id: number) {
    if (!this.isLoggedIn) {
      this.snackbar.warning('Please login to delete contacts');
      return;
    }
    // Confirm before deleting
    if (!confirm('⚠️ Are you sure you want to delete this contact?')) {
      return;
    }
    this.emergencyService.deleteEmergencyContact(id).subscribe({
      next: () => {
        this.loadEmergencyContacts();
        this.snackbar.success('Contact deleted successfully!');
      },
      error: (error) => {
        console.error('Failed to delete contact:', error);
        this.snackbar.error('Failed to delete contact. Please try again.');
      }
    });
  }

  // Share location with contact via SMS
  shareLocation(contact: EmergencyContact) {
    this.snackbar.info('Getting your location...');

    // Get current location
    this.emergencyService.getCurrentLocation().then(
      (coords: GeolocationCoordinates) => {
        const lat = coords.latitude;
        const lng = coords.longitude;
        const googleMapsLink = `https://maps.google.com/?q=${lat},${lng}`;

        const message = `🆘 EMERGENCY! I need help!\n\nMy current location:\n${googleMapsLink}\n\nCoordinates: ${lat.toFixed(6)}, ${lng.toFixed(6)}`;

        // Try Web Share API first (better on mobile)
        if (navigator.share) {
          navigator.share({
            text: message
          }).then(() => {
            this.snackbar.success(`Location shared with ${contact.name}!`);
          }).catch((error: any) => {
            // Fallback to SMS link
            this.openSMSFallback(contact.phone_number, message);
          });
        } else {
          // Fallback to SMS link for desktop browsers
          this.openSMSFallback(contact.phone_number, message);
        }
      },
      (error: any) => {
        console.error('Location error:', error);
        this.snackbar.error('Could not get your location. Please enable location services.');
      }
    );
  }

  // Fallback method to open SMS app
  private openSMSFallback(phoneNumber: string, message: string) {
    const smsLink = `sms:${phoneNumber}?body=${encodeURIComponent(message)}`;
    window.location.href = smsLink;
    this.snackbar.success('Opening SMS app...');
  }

  // Call all emergency contacts
  callAllContacts() {
    if (this.emergencyContacts.length === 0) {
      this.snackbar.warning('No emergency contacts to call');
      return;
    }

    const count = this.emergencyContacts.length;
    const confirmed = confirm(`📞 Call all ${count} emergency contacts?\n\nThis will open ${count} phone call${count > 1 ? 's' : ''} one after another.`);

    if (!confirmed) return;

    // Call each contact with a slight delay
    this.emergencyContacts.forEach((contact, index) => {
      setTimeout(() => {
        window.location.href = `tel:${contact.phone_number}`;
        if (index === 0) {
          this.snackbar.success(`Calling ${count} contact${count > 1 ? 's' : ''}...`);
        }
      }, index * 3000); // 3 second delay between each call
    });
  }

  // Send SOS message with location to all contacts
  sendSOSToAll() {
    if (this.emergencyContacts.length === 0) {
      this.snackbar.warning('No emergency contacts to notify');
      return;
    }

    const count = this.emergencyContacts.length;
    const confirmed = confirm(`🆘 Send emergency SOS with your location to all ${count} contacts?\n\nThis will share your current location via SMS to everyone.`);

    if (!confirmed) return;

    this.snackbar.info('Getting your location...');

    // Get current location
    this.emergencyService.getCurrentLocation().then(
      (coords: GeolocationCoordinates) => {
        const lat = coords.latitude;
        const lng = coords.longitude;
        const googleMapsLink = `https://maps.google.com/?q=${lat},${lng}`;

        const message = `🆘 EMERGENCY! I need help!\n\nMy current location:\n${googleMapsLink}\n\nCoordinates: ${lat.toFixed(6)}, ${lng.toFixed(6)}`;

        // Create a comma-separated list of all phone numbers for group SMS
        const allNumbers = this.emergencyContacts.map(c => c.phone_number).join(',');
        const smsLink = `sms:${allNumbers}?body=${encodeURIComponent(message)}`;

        window.location.href = smsLink;
        this.snackbar.success(`SOS sent to ${count} contact${count > 1 ? 's' : ''}!`);
      },
      (error: any) => {
        console.error('Location error:', error);
        this.snackbar.error('Could not get your location. Please enable location services.');
      }
    );
  }

  // Close contact modal
  closeContactModal() {
    this.showContactModal = false;
    this.editingContact = null;
  }

  // Handle drag and drop reordering
  dropContact(event: CdkDragDrop<EmergencyContact[]>) {
    if (!this.isLoggedIn) {
      this.snackbar.warning('Please login to reorder contacts');
      return;
    }

    // Reorder the array
    moveItemInArray(this.emergencyContacts, event.previousIndex, event.currentIndex);

    // Update priority_order for all contacts
    const updates = this.emergencyContacts.map((contact, index) => ({
      ...contact,
      priority_order: index
    }));

    //Save the new order to backend
    this.emergencyService.updateContactsOrder(updates).subscribe({
      next: () => {
        this.snackbar.success('Contacts reordered successfully!');
      },
      error: (error: any) => {
        console.error('Failed to update contact order:', error);
        // Reload contacts to restore original order on error
        this.loadEmergencyContacts();
        this.snackbar.error('Failed to save new order. Changes reverted.');
      }
    });
  }

  // ============ MEDICAL INFO MODAL METHODS ============

  // Load medical information
  loadMedicalInfo() {
    if (!this.isLoggedIn) {
      this.medicalInfo = null;
      return;
    }
    this.emergencyService.getMedicalInfo().subscribe({
      next: (info) => {
        this.medicalInfo = info;
      },
      error: (error) => {
        console.error('Failed to load medical information:', error);
        // Initialize empty medical info if error
        this.medicalInfo = {
          blood_type: '',
          allergies: [],
          medical_conditions: [],
          current_medications: [],
          primary_doctor_name: '',
          primary_doctor_phone: ''
        };
      }
    });
  }

  // Edit medical information
  editMedicalInfo() {
    if (!this.isLoggedIn) {
      this.snackbar.warning('Please login to save medical information', 4000);
      setTimeout(() => {
        this.router.navigate(['/for-users']);
      }, 1000);
      return;
    }
    this.showMedicalModal = true;
  }

  // Save medical information
  saveMedicalInfo(medicalData: MedicalInformation) {
    this.emergencyService.updateMedicalInfo(medicalData).subscribe({
      next: () => {
        this.loadMedicalInfo();
        this.showMedicalModal = false;
        this.snackbar.success('Medical information saved successfully!');
      },
      error: (error) => {
        console.error('Failed to save medical information:', error);
        this.snackbar.error('Failed to save medical information. Please try again.');
      }
    });
  }

  // Delete medical information
  deleteMedicalInfo() {
    if (!this.isLoggedIn) {
      this.snackbar.warning('Please login to delete medical information');
      return;
    }
    // Confirm before deleting
    if (!confirm('⚠️ Are you sure you want to delete all medical information?')) {
      return;
    }
    this.emergencyService.deleteMedicalInfo().subscribe({
      next: () => {
        this.loadMedicalInfo();
        this.snackbar.success('Medical information deleted successfully!');
      },
      error: (error: any) => {
        console.error('Failed to delete medical information:', error);
        this.snackbar.error('Failed to delete medical information. Please try again.');
      }
    });
  }

  // Close medical modal
  closeMedicalModal() {
    this.showMedicalModal = false;
  }

}