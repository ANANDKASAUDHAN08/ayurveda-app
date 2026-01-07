import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface TranslationDict {
    [key: string]: string | TranslationDict;
}

@Injectable({
    providedIn: 'root'
})
export class TranslationService {
    private readonly LANG_KEY = 'app_lang';
    private currentLangSubject = new BehaviorSubject<string>(this.getSavedLang());
    public currentLang$ = this.currentLangSubject.asObservable();

    private translations: { [lang: string]: TranslationDict } = {
        en: {
            'common': {
                'save': 'Save Changes',
                'cancel': 'Cancel',
                'loading': 'Loading...',
                'search': 'Search',
                'current': 'Current',
                'small': 'Small',
                'large': 'Large'
            },
            'nav': {
                'home': 'Home',
                'shop': 'Shop',
                'find_care': 'Find Care',
                'my_health': 'My Health',
                'emergency': 'Emergency SOS',
                'orders': 'My Orders',
                'dashboard': 'Dashboard',
                'profile': 'Profile',
                'settings': 'Settings',
                'logout': 'Logout',
                'favorites': 'Favorites',
                'medicines': 'Medicines',
                'devices': 'Medical Devices',
                'lab_tests': 'Lab Tests',
                'plans': 'Health Plans',
                'doctors': 'Doctors',
                'hospitals': 'Hospitals',
                'pharmacies': 'Pharmacies',
                'nearby': 'Nearby Care',
                'patient_login': 'Patient Login',
                'doctor_login': 'Doctor Login'
            },
            'search': {
                'placeholder': 'Search doctors, medicines or tests...',
                'suggestions': 'Suggestions',
                'recent': 'Recent Searches',
                'clear': 'Clear All',
                'popular': 'Popular Right Now',
                'no_results': 'No results found for'
            },
            'cart': {
                'title': 'Your Basket',
                'empty': 'Basket is empty',
                'empty_desc': "Looks like you haven't added anything yet!",
                'start_shopping': 'Start Shopping',
                'subtotal': 'Subtotal',
                'delivery': 'Delivery',
                'total': 'Total',
                'checkout': 'Proceed to Checkout',
                'free': 'FREE'
            },
            'settings': {
                'title': 'Settings',
                'subtitle': 'Customize your app experience',
                'appearance': 'Appearance',
                'notifications': 'Notifications',
                'language_region': 'Language & Region',
                'preferences': 'Preferences',
                'save_success': 'Settings saved successfully',
                'theme': 'Theme',
                'theme_light': 'Light',
                'theme_dark': 'Dark',
                'theme_system': 'System',
                'font_size': 'Font Size',
                'compact_mode': 'Compact Mode',
                'compact_mode_desc': 'Use a denser layout to show more content',
                'reduce_motion': 'Reduce Motion',
                'reduce_motion_desc': 'Minimize animations for better accessibility',
                'notif_email': 'Email Notifications',
                'notif_email_desc': 'Receive appointment and order updates via email',
                'notif_sms': 'SMS Notifications',
                'notif_sms_desc': 'Critical alerts and OTPs on your phone',
                'notif_push': 'Push Notifications',
                'notif_push_desc': 'Browser notifications for real-time updates',
                'notif_promo': 'Promotions & Offers',
                'notif_promo_desc': 'New features and seasonal discounts',
                'quiet_hours': 'Quiet Hours',
                'quiet_hours_desc': "Don't send notifications during these hours",
                'start_time': 'Start Time',
                'end_time': 'End Time',
                'date_format': 'Date Format',
                'time_format': 'Time Format',
                'timezone': 'Timezone',
                'currency': 'Currency',
                'auto_refresh': 'Auto-refresh Dashboard',
                'auto_refresh_desc': 'Automatically update appointment data',
                'remember_search': 'Remember Last Search',
                'remember_search_desc': 'Save your previous search filters',
                'search_radius': 'Default Search Radius',
                'share_data': 'Share Usage Data',
                'share_data_desc': 'Help us improve by sharing anonymous usage data',
                'location_tracking': 'Location Tracking',
                'location_tracking_desc': 'Enable location for better doctor recommendations',
                'save_appearance': 'Appearance settings saved successfully',
                'save_notifications': 'Notification preferences updated',
                'save_language': 'Language and region settings updated',
                'save_preferences': 'App preferences saved successfully',
                'sync_error': 'Settings saved locally, but failed to sync with server'
            }
        },
        hi: {
            'common': {
                'save': 'परिवर्तन सहेजें',
                'cancel': 'रद्द करें',
                'loading': 'लोड हो रहा है...',
                'search': 'खोजें',
                'current': 'वर्तमान',
                'small': 'छोटा',
                'large': 'बड़ा'
            },
            'nav': {
                'home': 'होम',
                'shop': 'दुकान',
                'find_care': 'देखभाल खोजें',
                'my_health': 'मेरा स्वास्थ्य',
                'emergency': 'आपातकालीन एसओएस',
                'orders': 'मेरे ऑर्डर',
                'dashboard': 'डैशबोर्ड',
                'profile': 'प्रोफ़ाइल',
                'settings': 'सेटिंग्स',
                'logout': 'लॉगआउट',
                'favorites': 'पसंदीदा',
                'medicines': 'दवाएं',
                'devices': 'चिकित्सा उपकरण',
                'lab_tests': 'लैब टेस्ट',
                'plans': 'स्वास्थ्य योजनाएं',
                'doctors': 'डॉक्टर',
                'hospitals': 'अस्पताल',
                'pharmacies': 'फार्मेसी',
                'nearby': 'पास की देखभाल',
                'patient_login': 'मरीज लॉगिन',
                'doctor_login': 'डॉक्टर लॉगिन'
            },
            'search': {
                'placeholder': 'डॉक्टर, दवाएं या टेस्ट खोजें...',
                'suggestions': 'सुझाव',
                'recent': 'हाल की खोजें',
                'clear': 'सभी साफ़ करें',
                'popular': 'अभी लोकप्रिय',
                'no_results': 'के लिए कोई परिणाम नहीं मिला'
            },
            'cart': {
                'title': 'आपकी टोकरी',
                'empty': 'टोकरी खाली है',
                'empty_desc': 'ऐसा लगता है कि आपने अभी तक कुछ भी नहीं जोड़ा है!',
                'start_shopping': 'खरीदारी शुरू करें',
                'subtotal': 'उप-योग',
                'delivery': 'डिलीवरी',
                'total': 'कुल',
                'checkout': 'चेकआउट के लिए आगे बढ़ें',
                'free': 'मुफ़्त'
            },
            'settings': {
                'title': 'सेटिंग्स',
                'subtitle': 'अपने ऐप अनुभव को कस्टमाइज़ करें',
                'appearance': 'दिखावट',
                'notifications': 'सूचनाएं',
                'language_region': 'भाषा और क्षेत्र',
                'preferences': 'प्राथमिकताएं',
                'save_success': 'सेटिंग्स सफलतापूर्वक सहेजी गईं',
                'theme': 'थीम',
                'theme_light': 'लाइट',
                'theme_dark': 'डार्क',
                'theme_system': 'सिस्टम',
                'font_size': 'फ़ॉन्ट आकार',
                'compact_mode': 'कॉम्पैक्ट मोड',
                'compact_mode_desc': 'अधिक सामग्री दिखाने के लिए सघन लेआउट का उपयोग करें',
                'reduce_motion': 'मोशन कम करें',
                'reduce_motion_desc': 'बेहतर पहुंच के लिए एनिमेशन कम करें',
                'notif_email': 'ईमेल सूचनाएं',
                'notif_email_desc': 'ईमेल के माध्यम से अपॉइंटमेंट और ऑर्डर अपडेट प्राप्त करें',
                'notif_sms': 'SMS सूचनाएं',
                'notif_sms_desc': 'आपके फोन पर महत्वपूर्ण अलर्ट और OTP',
                'notif_push': 'पुश सूचनाएं',
                'notif_push_desc': 'रीयल-टाइम अपडेट के लिए ब्राउज़र सूचनाएं',
                'notif_promo': 'प्रचार और ऑफ़र',
                'notif_promo_desc': 'नई सुविधाएँ और मौसमी छूट',
                'quiet_hours': 'शांत घंटे',
                'quiet_hours_desc': 'इन घंटों के दौरान सूचनाएं न भेजें',
                'start_time': 'शुरू होने का समय',
                'end_time': 'समाप्त होने का समय',
                'date_format': 'दिनांक प्रारूप',
                'time_format': 'समय प्रारूप',
                'timezone': 'समय क्षेत्र',
                'currency': 'मुद्रा',
                'auto_refresh': 'डैशबोर्ड ऑटो-रिफ्रेश',
                'auto_refresh_desc': 'अपॉइंटमेंट डेटा को स्वचालित रूप से अपडेट करें',
                'remember_search': 'पिछली खोज याद रखें',
                'remember_search_desc': 'अपने पिछले खोज फ़िल्टर सहेजें',
                'search_radius': 'डिफ़ॉल्ट खोज दायरा',
                'share_data': 'उपयोग डेटा साझा करें',
                'share_data_desc': 'अनाम उपयोग डेटा साझा करके हमें सुधारने में मदद करें',
                'location_tracking': 'लोकेशन ट्रैकिंग',
                'location_tracking_desc': 'बेहतर डॉक्टर अनुशंसाओं के लिए लोकेशन सक्षम करें',
                'save_appearance': 'दिखावट सेटिंग्स सफलतापूर्वक सहेजी गईं',
                'save_notifications': 'सूचना प्राथमिकताएं अपडेट की गईं',
                'save_language': 'भाषा और क्षेत्र सेटिंग्स अपडेट की गईं',
                'save_preferences': 'ऐप प्राथमिकताएं सफलतापूर्वक सहेजी गईं',
                'sync_error': 'सेटिंग्स स्थानीय रूप से सहेजी गईं, लेकिन सर्वर के साथ सिंक करने में विफल रहीं'
            }
        }
    };

    constructor() { }

    private getSavedLang(): string {
        if (typeof window === 'undefined') return 'en';

        // Check app_settings first
        const settings = localStorage.getItem('app_settings');
        if (settings) {
            try {
                const parsed = JSON.parse(settings);
                if (parsed.language && parsed.language.selected) {
                    return parsed.language.selected;
                }
            } catch (e) { }
        }

        return localStorage.getItem(this.LANG_KEY) || 'en';
    }

    setLanguage(lang: string): void {
        this.currentLangSubject.next(lang);
        localStorage.setItem(this.LANG_KEY, lang);

        // Also update app_settings to stay in sync
        const settings = localStorage.getItem('app_settings');
        if (settings) {
            try {
                const parsed = JSON.parse(settings);
                if (!parsed.language) parsed.language = {};
                parsed.language.selected = lang;
                localStorage.setItem('app_settings', JSON.stringify(parsed));
            } catch (e) { }
        }
    }

    translate(key: string): string {
        const lang = this.currentLangSubject.value;
        const keys = key.split('.');
        let result: any = this.translations[lang] || this.translations['en'];

        for (const k of keys) {
            if (result && result[k]) {
                result = result[k];
            } else {
                return key; // Return key if translation not found
            }
        }

        return typeof result === 'string' ? result : key;
    }
}
