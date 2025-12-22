const db = require('../config/database');

// Get user settings
exports.getUserSettings = async (req, res) => {
    try {
        const userId = req.user.id;

        const [settings] = await db.execute(
            `SELECT * FROM user_settings WHERE user_id = ?`,
            [userId]
        );

        // If no settings exist, return defaults
        if (settings.length === 0) {
            return res.json({
                settings: {
                    theme: 'light',
                    fontSize: 14,
                    compactMode: false,
                    reduceMotion: false
                },
                notifications: {
                    email: true,
                    sms: true,
                    push: false,
                    promotions: false,
                    quietStart: '22:00',
                    quietEnd: '08:00'
                },
                language: {
                    selected: 'en',
                    dateFormat: 'DD/MM/YYYY',
                    timeFormat: '12h',
                    timezone: 'Asia/Kolkata',
                    currency: 'INR'
                },
                preferences: {
                    autoRefresh: true,
                    rememberSearch: true,
                    searchRadius: 10,
                    shareData: false,
                    locationTracking: true
                }
            });
        }

        const userSettings = settings[0];

        // Transform database format to frontend format
        res.json({
            settings: {
                theme: userSettings.theme,
                fontSize: userSettings.font_size,
                compactMode: userSettings.compact_mode,
                reduceMotion: userSettings.reduce_motion
            },
            notifications: {
                email: userSettings.email_notifications,
                sms: userSettings.sms_notifications,
                push: userSettings.push_notifications,
                promotions: userSettings.promotion_notifications,
                quietStart: userSettings.quiet_hours_start.substring(0, 5), // HH:MM
                quietEnd: userSettings.quiet_hours_end.substring(0, 5)
            },
            language: {
                selected: userSettings.language,
                dateFormat: userSettings.date_format,
                timeFormat: userSettings.time_format,
                timezone: userSettings.timezone,
                currency: userSettings.currency
            },
            preferences: {
                autoRefresh: userSettings.auto_refresh,
                rememberSearch: userSettings.remember_search,
                searchRadius: userSettings.search_radius,
                shareData: userSettings.share_usage_data,
                locationTracking: userSettings.location_tracking
            }
        });
    } catch (error) {
        console.error('Error fetching user settings:', error);
        res.status(500).json({ error: 'Failed to fetch settings' });
    }
};

// Update user settings
exports.updateUserSettings = async (req, res) => {
    try {
        const userId = req.user.id;
        const { settings, notifications, language, preferences } = req.body;

        // Check if settings exist
        const [existing] = await db.execute(
            'SELECT id FROM user_settings WHERE user_id = ?',
            [userId]
        );

        if (existing.length === 0) {
            // Insert new settings
            await db.execute(
                `INSERT INTO user_settings (
          user_id, theme, font_size, compact_mode, reduce_motion,
          email_notifications, sms_notifications, push_notifications, promotion_notifications,
          quiet_hours_start, quiet_hours_end,
          language, date_format, time_format, timezone, currency,
          auto_refresh, remember_search, search_radius, share_usage_data, location_tracking
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    userId,
                    settings?.theme || 'light',
                    settings?.fontSize || 14,
                    settings?.compactMode || false,
                    settings?.reduceMotion || false,
                    notifications?.email !== undefined ? notifications.email : true,
                    notifications?.sms !== undefined ? notifications.sms : true,
                    notifications?.push || false,
                    notifications?.promotions || false,
                    notifications?.quietStart || '22:00',
                    notifications?.quietEnd || '08:00',
                    language?.selected || 'en',
                    language?.dateFormat || 'DD/MM/YYYY',
                    language?.timeFormat || '12h',
                    language?.timezone || 'Asia/Kolkata',
                    language?.currency || 'INR',
                    preferences?.autoRefresh !== undefined ? preferences.autoRefresh : true,
                    preferences?.rememberSearch !== undefined ? preferences.rememberSearch : true,
                    preferences?.searchRadius || 10,
                    preferences?.shareData || false,
                    preferences?.locationTracking !== undefined ? preferences.locationTracking : true
                ]
            );
        } else {
            // Update existing settings
            await db.execute(
                `UPDATE user_settings SET
          theme = ?,
          font_size = ?,
          compact_mode = ?,
          reduce_motion = ?,
          email_notifications = ?,
          sms_notifications = ?,
          push_notifications = ?,
          promotion_notifications = ?,
          quiet_hours_start = ?,
          quiet_hours_end = ?,
          language = ?,
          date_format = ?,
          time_format = ?,
          timezone = ?,
          currency = ?,
          auto_refresh = ?,
          remember_search = ?,
          search_radius = ?,
          share_usage_data = ?,
          location_tracking = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ?`,
                [
                    settings?.theme || 'light',
                    settings?.fontSize || 14,
                    settings?.compactMode || false,
                    settings?.reduceMotion || false,
                    notifications?.email !== undefined ? notifications.email : true,
                    notifications?.sms !== undefined ? notifications.sms : true,
                    notifications?.push || false,
                    notifications?.promotions || false,
                    notifications?.quietStart || '22:00',
                    notifications?.quietEnd || '08:00',
                    language?.selected || 'en',
                    language?.dateFormat || 'DD/MM/YYYY',
                    language?.timeFormat || '12h',
                    language?.timezone || 'Asia/Kolkata',
                    language?.currency || 'INR',
                    preferences?.autoRefresh !== undefined ? preferences.autoRefresh : true,
                    preferences?.rememberSearch !== undefined ? preferences.rememberSearch : true,
                    preferences?.searchRadius || 10,
                    preferences?.shareData || false,
                    preferences?.locationTracking !== undefined ? preferences.locationTracking : true,
                    userId
                ]
            );
        }

        res.json({
            message: 'Settings updated successfully',
            settings: req.body
        });
    } catch (error) {
        console.error('Error updating user settings:', error);
        res.status(500).json({ error: 'Failed to update settings' });
    }
};
