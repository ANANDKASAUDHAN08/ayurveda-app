const express = require('express');
const router = express.Router();
const passport = require('../config/passport');
const jwt = require('jsonwebtoken');

/**
 * Initiate Google OAuth for Users
 * GET /api/auth/google/user
 */
router.get('/google/user',
    passport.authenticate('google-user', {
        scope: ['profile', 'email'],
        session: false
    })
);

/**
 * Google OAuth Callback for Users
 * GET /api/auth/google/user/callback
 */
router.get('/google/user/callback',
    passport.authenticate('google-user', {
        session: false,
        failureRedirect: `${process.env.FRONTEND_URL || process.env.APP_URL || 'http://localhost:4200'}/user-landing?error=oauth_failed`
    }),
    (req, res) => {
        try {
            // Generate JWT token
            const token = jwt.sign(
                {
                    id: req.user.id,
                    email: req.user.email,
                    role: req.user.role || 'user',
                    name: req.user.name || req.user.email.split('@')[0],
                    avatar_url: req.user.avatar_url,
                    oauth_provider: req.user.oauth_provider,
                    hasPassword: !!req.user.password
                },
                process.env.JWT_SECRET,
                { expiresIn: '7d' }
            );

            // Redirect to frontend with token and new user flag
            const isNewUser = req.user.isNewUser ? 'true' : 'false';
            res.redirect(`${process.env.FRONTEND_URL || process.env.APP_URL || 'http://localhost:4200'}/home?token=${token}&oauth=success&newUser=${isNewUser}`);
        } catch (error) {
            console.error('OAuth callback error:', error);
            res.redirect(`${process.env.FRONTEND_URL || process.env.APP_URL || 'http://localhost:4200'}/user-landing?error=token_generation_failed`);
        }
    }
);

/**
 * Initiate Google OAuth for Doctors
 * GET /api/auth/google/doctor
 */
router.get('/google/doctor',
    passport.authenticate('google-doctor', {
        scope: ['profile', 'email'],
        session: false
    })
);

/**
 * Google OAuth Callback for Doctors
 * GET /api/auth/google/doctor/callback
 */
router.get('/google/doctor/callback',
    passport.authenticate('google-doctor', {
        session: false,
        failureRedirect: `${process.env.FRONTEND_URL || process.env.APP_URL || 'http://localhost:4200'}/doctor-landing?error=oauth_failed`
    }),
    (req, res) => {
        try {
            // Generate JWT token
            const token = jwt.sign(
                {
                    id: req.user.id,
                    email: req.user.email,
                    role: req.user.role || 'doctor',
                    name: req.user.name || req.user.email.split('@')[0],
                    avatar_url: req.user.avatar_url,
                    oauth_provider: req.user.oauth_provider,
                    hasPassword: !!req.user.password
                },
                process.env.JWT_SECRET,
                { expiresIn: '7d' }
            );

            // Redirect to frontend with token and new user flag
            const isNewUser = req.user.isNewUser ? 'true' : 'false';
            res.redirect(`${process.env.FRONTEND_URL || process.env.APP_URL || 'http://localhost:4200'}/home?token=${token}&oauth=success&newUser=${isNewUser}`);
        } catch (error) {
            console.error('OAuth callback error (doctor):', error);
            res.redirect(`${process.env.FRONTEND_URL || process.env.APP_URL || 'http://localhost:4200'}/doctor-landing?error=token_generation_failed`);
        }
    }
);

module.exports = router;


