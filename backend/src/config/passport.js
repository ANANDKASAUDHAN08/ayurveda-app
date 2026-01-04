const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const db = require('./database');

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, { id: user.id, role: user.role });
});

// Deserialize user from session
passport.deserializeUser(async (data, done) => {
  try {
    const [rows] = await db.execute('SELECT * FROM users WHERE id = ?', [data.id]);

    if (rows.length > 0) {
      done(null, rows[0]);
    } else {
      done(new Error('User not found'));
    }
  } catch (error) {
    done(error);
  }
});

// Google OAuth Strategy for Users
passport.use('google-user', new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/api/auth/google/user/callback',
  passReqToCallback: true
},
  async (req, accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails[0].value;
      const oauth_id = profile.id;
      const oauth_provider = 'google';
      const avatar_url = profile.photos[0]?.value;
      const name = profile.displayName;

      // Check if user exists with this OAuth ID
      let [users] = await db.execute(
        'SELECT * FROM users WHERE oauth_provider = ? AND oauth_id = ?',
        [oauth_provider, oauth_id]
      );

      if (users.length > 0) {
        // Update avatar if it changed
        if (avatar_url && users[0].avatar_url !== avatar_url) {
          await db.execute('UPDATE users SET avatar_url = ? WHERE id = ?', [avatar_url, users[0].id]);
        }
        return done(null, users[0]);
      }

      // Check if user exists with this email (across any role)
      [users] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);

      if (users.length > 0) {
        // Link OAuth to existing account
        await db.execute(
          'UPDATE users SET oauth_provider = ?, oauth_id = ?, avatar_url = ? WHERE id = ?',
          [oauth_provider, oauth_id, avatar_url, users[0].id]
        );
        return done(null, users[0]);
      }

      // Create new user with role='user'
      const [result] = await db.execute(
        'INSERT INTO users (name, email, role, oauth_provider, oauth_id, avatar_url, phone_verified, email_verified) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [name, email, 'user', oauth_provider, oauth_id, avatar_url, false, true]
      );

      const newUser = {
        id: result.insertId,
        name,
        email,
        role: 'user',
        oauth_provider,
        oauth_id,
        avatar_url,
        isNewUser: true
      };

      done(null, newUser);
    } catch (error) {
      console.error('Google OAuth error (user):', error);
      done(error);
    }
  }
));

// Google OAuth Strategy for Doctors
passport.use('google-doctor', new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL_DOCTOR || 'http://localhost:3000/api/auth/google/doctor/callback',
  passReqToCallback: true
},
  async (req, accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails[0].value;
      const oauth_id = profile.id;
      const oauth_provider = 'google';
      const avatar_url = profile.photos[0]?.value;
      const name = profile.displayName;

      // Check if doctor exists with this OAuth ID
      let [doctors] = await db.execute(
        'SELECT * FROM users WHERE oauth_provider = ? AND oauth_id = ?',
        [oauth_provider, oauth_id]
      );

      if (doctors.length > 0) {
        // Update avatar if it changed
        if (avatar_url && doctors[0].avatar_url !== avatar_url) {
          await db.execute('UPDATE users SET avatar_url = ? WHERE id = ?', [avatar_url, doctors[0].id]);
        }
        return done(null, doctors[0]);
      }

      // Check if user exists with this email (across any role)
      [doctors] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);

      if (doctors.length > 0) {
        // Link OAuth to existing account
        await db.execute(
          'UPDATE users SET oauth_provider = ?, oauth_id = ?, avatar_url = ? WHERE id = ?',
          [oauth_provider, oauth_id, avatar_url, doctors[0].id]
        );
        return done(null, doctors[0]);
      }

      // Create new doctor with role='doctor' (with pending verification)
      const [result] = await db.execute(
        'INSERT INTO users (name, email, role, oauth_provider, oauth_id, avatar_url, phone_verified, email_verified) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [name, email, 'doctor', oauth_provider, oauth_id, avatar_url, false, true]
      );

      const newDoctor = {
        id: result.insertId,
        name,
        email,
        role: 'doctor',
        oauth_provider,
        oauth_id,
        avatar_url,
        isNewUser: true
      };

      done(null, newDoctor);
    } catch (error) {
      console.error('Google OAuth error (doctor):', error);
      done(error);
    }
  }
));

module.exports = passport;
