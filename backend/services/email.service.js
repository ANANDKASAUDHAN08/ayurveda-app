const sgMail = require('@sendgrid/mail');
const emailValidator = require('email-validator');

// Initialize SendGrid with API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

/**
 * Validate email format
 * @param {string} email - Email address to validate
 * @returns {boolean} - True if valid, false otherwise
 */
function validateEmail(email) {
  return emailValidator.validate(email);
}

/**
 * Send welcome email to new users or doctors
 * @param {string} to - Recipient email address
 * @param {string} name - Recipient name
 * @param {string} userType - 'user' or 'doctor'
 * @returns {Promise<object>} - Result of email sending
 */
async function sendWelcomeEmail(to, name, userType) {
  // Validate email format first
  if (!validateEmail(to)) {
    throw new Error('Invalid email format');
  }

  const msg = {
    to: to,
    from: process.env.EMAIL_FROM || 'noreply@healthconnect.com',
    subject: getSubject(name, userType),
    html: getTemplate(name, userType)
  };

  try {
    const result = await sgMail.send(msg);
    return { success: true, messageId: result[0].headers['x-message-id'] };
  } catch (error) {
    console.error(`❌ Failed to send email to ${to}:`, error.message);
    throw error;
  }
}

/**
 * Get email subject based on user type
 */
function getSubject(name, userType) {
  if (userType === 'doctor') {
    return `Welcome to Health Connect, Dr. ${name}! 🩺`;
  }
  return `Welcome to Health Connect, ${name}! 🌿`;
}

/**
 * Get email template based on user type
 */
function getTemplate(name, userType) {
  const appUrl = process.env.APP_URL || 'process.env.APP_URL';

  if (userType === 'doctor') {
    return getDoctorTemplate(name, appUrl);
  }
  return getUserTemplate(name, appUrl);
}

/**
 * User welcome email template
 */
function getUserTemplate(name, appUrl) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #1f2937; background: #f9fafb; }
    .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
    .header { background: linear-gradient(135deg, #059669, #0d9488); padding: 40px 30px; text-align: center; }
    .header h1 { color: white; font-size: 28px; margin-bottom: 8px; }
    .header p { color: rgba(255, 255, 255, 0.9); font-size: 16px; }
    .content { padding: 40px 30px; }
    .greeting { font-size: 24px; color: #1f2937; margin-bottom: 20px; font-weight: 600; }
    .intro { font-size: 16px; color: #4b5563; margin-bottom: 30px; line-height: 1.8; }
    .features { background: #f0fdf4; border-left: 4px solid #059669; padding: 20px; margin: 30px 0; border-radius: 8px; }
    .features h3 { color: #059669; font-size: 18px; margin-bottom: 15px; }
    .features ul { list-style: none; }
    .features li { padding: 10px 0; color: #374151; font-size: 15px; display: flex; align-items: start; }
    .features li:before { content: "✅"; margin-right: 12px; font-size: 18px; }
    .cta { text-align: center; margin: 40px 0; }
    .button { display: inline-block; background: linear-gradient(135deg, #059669, #0d9488); color: white; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(5, 150, 105, 0.3); transition: transform 0.2s; }
    .button:hover { transform: translateY(-2px); }
    .footer { background: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb; }
    .footer p { color: #6b7280; font-size: 14px; margin: 5px 0; }
    .footer a { color: #059669; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🩺 Health Connect</h1>
      <p>Your Healthcare Journey Starts Here</p>
    </div>
    
    <div class="content">
      <div class="greeting">Hello ${name}!</div>
      
      <p class="intro">
        We're thrilled to welcome you to Health Connect! 
        Your journey to better health and quality medical care begins now.
      </p>
      
      <div class="features">
        <h3>What You Can Do:</h3>
        <ul>
          <li>Find verified doctors across all specialties</li>
          <li>Book appointments instantly online</li>
          <li>Track your health records securely</li>
          <li>Get personalized healthcare recommendations</li>
          <li>Access expert medical consultations</li>
        </ul>
      </div>
      
      <div class="cta">
        <a href="${appUrl}/find-doctors" class="button">Find a Doctor Now</a>
      </div>
      
      <p class="intro">
        Have questions? Our support team is here to help you every step of the way.
      </p>
      
      <p style="color: #6b7280; font-size: 15px; margin-top: 30px;">
        Stay healthy and well! 🩺<br>
        <strong>The Health Connect Team</strong>
      </p>
    </div>
    
    <div class="footer">
      <p><strong>© 2024 Health Connect</strong></p>
      <p>This email was sent to you because you created an account.</p>
      <p>If you didn't sign up, please <a href="mailto:support@healthconnect.com">contact us</a>.</p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Doctor welcome email template
 */
function getDoctorTemplate(name, appUrl) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #1f2937; background: #f9fafb; }
    .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
    .header { background: linear-gradient(135deg, #0891b2, #059669); padding: 40px 30px; text-align: center; }
    .header h1 { color: white; font-size: 28px; margin-bottom: 8px; }
    .header p { color: rgba(255, 255, 255, 0.9); font-size: 16px; }
    .content { padding: 40px 30px; }
    .greeting { font-size: 24px; color: #1f2937; margin-bottom: 20px; font-weight: 600; }
    .intro { font-size: 16px; color: #4b5563; margin-bottom: 30px; line-height: 1.8; }
    .features { background: #ecfeff; border-left: 4px solid #0891b2; padding: 20px; margin: 30px 0; border-radius: 8px; }
    .features h3 { color: #0891b2; font-size: 18px; margin-bottom: 15px; }
    .features ul { list-style: none; }
    .features li { padding: 10px 0; color: #374151; font-size: 15px; display: flex; align-items: start; }
    .features li:before { content: "✅"; margin-right: 12px; font-size: 18px; }
    .cta { text-align: center; margin: 40px 0; }
    .button { display: inline-block; background: linear-gradient(135deg, #0891b2, #059669); color: white; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(8, 145, 178, 0.3); transition: transform 0.2s; }
    .button:hover { transform: translateY(-2px); }
    .footer { background: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb; }
    .footer p { color: #6b7280; font-size: 14px; margin: 5px 0; }
    .footer a { color: #0891b2; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🩺 Health Connect</h1>
      <p>Healthcare Professional Network</p>
    </div>
    
    <div class="content">
      <div class="greeting">Dear Dr. ${name},</div>
      
      <p class="intro">
        Welcome to Health Connect! We're honored to have you join our network of healthcare professionals.
        Together, we're making quality medical care accessible to everyone.
      </p>
      
      <div class="features">
        <h3>Your Next Steps:</h3>
        <ul>
          <li>Complete your professional profile</li>
          <li>Set your consultation availability</li>
          <li>Start receiving patient appointments</li>
          <li>Manage patient records efficiently</li>
          <li>Access practice analytics and insights</li>
        </ul>
      </div>
      
      <div class="cta">
        <a href="${appUrl}/doctor-dashboard" class="button">Go to Dashboard</a>
      </div>
      
      <p class="intro">
        Our dedicated support team is here to assist you. 
        If you have any questions or need help getting started, don't hesitate to reach out.
      </p>
      
      <p style="color: #6b7280; font-size: 15px; margin-top: 30px;">
        Looking forward to working with you! 🩺<br>
        <strong>The Health Connect Team</strong>
      </p>
    </div>
    
    <div class="footer">
      <p><strong>© 2024 Health Connect</strong></p>
      <p>This email was sent to you because you registered as a healthcare provider.</p>
      <p>Need help? <a href="mailto:support@healthconnect.com">Contact Support</a></p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Send email verification link
 * @param {string} to - Recipient email address
 * @param {string} name - Recipient name
 * @param {string} verificationToken - Verification token
 * @param {string} userType - 'user' or 'doctor'
 * @returns {Promise<object>} - Result of email sending
 */
async function sendVerificationEmail(to, name, verificationToken, userType) {
  if (!validateEmail(to)) {
    throw new Error('Invalid email format');
  }

  const appUrl = process.env.APP_URL || 'process.env.APP_URL';
  const verificationUrl = `${appUrl}/verify-email?token=${verificationToken}&type=${userType}`;
  const greeting = userType === 'doctor' ? `Dr. ${name}` : name;

  const msg = {
    to: to,
    from: process.env.EMAIL_FROM || 'noreply@healthconnect.com',
    subject: 'Verify Your Email - Health Connect 🔐',
    html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #1f2937; background: #f9fafb; }
    .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
    .header { background: linear-gradient(135deg, #059669, #0d9488); padding: 40px 30px; text-align: center; }
    .header h1 { color: white; font-size: 28px; margin-bottom: 8px; }
    .content { padding: 40px 30px; }
    .greeting { font-size: 22px; color: #1f2937; margin-bottom: 20px; font-weight: 600; }
    .intro { font-size: 16px; color: #4b5563; margin-bottom: 25px; line-height: 1.8; }
    .button { display: inline-block; background: linear-gradient(135deg, #059669, #0d9488); color: white !important; text-decoration: none; padding: 16px 40px; border-radius: 10px; font-weight: 600; font-size: 16px; margin: 20px 0; }
    .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 6px; }
    .footer { background: #f9fafb; padding: 20px 30px; text-align: center; border-top: 1px solid #e5e7eb; font-size: 14px; color: #6b7280; }
    .link-text { color: #059669; word-break: break-all; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔐 Verify Your Email</h1>
    </div>
    
    <div class="content">
      <div class="greeting">Hello ${greeting}!</div>
      
      <p class="intro">
        Thank you for registering with Health Connect! To complete your registration and access all features, 
        please verify your email address by clicking the button below.
      </p>
      
      <div style="text-align: center;">
        <a href="${verificationUrl}" class="button">Verify Email Address</a>
      </div>
      
      <div class="warning">
        <strong>⚠️ Important:</strong> This verification link will expire in 24 hours for security reasons.
      </div>
      
      <p style="margin: 20px 0; font-size: 14px; color: #6b7280;">
        If you didn't create an account with Health Connect, please ignore this email.
      </p>
      
      <p style="margin: 20px 0; font-size: 13px; color: #9ca3af;">
        <strong>Button not working?</strong> Copy and paste this link into your browser:<br>
        <a href="${verificationUrl}" class="link-text">${verificationUrl}</a>
      </p>
    </div>
    
    <div class="footer">
      <p><strong>© 2024 Health Connect</strong></p>
      <p>Automated email - please do not reply</p>
    </div>
  </div>
</body>
</html>
    `
  };

  try {
    const result = await sgMail.send(msg);
    return { success: true, messageId: result[0].headers['x-message-id'] };
  } catch (error) {
    console.error(`❌ Failed to send verification email to ${to}:`, error.message);
    throw error;
  }
}

// Export functions
module.exports = {
  validateEmail,
  sendWelcomeEmail,
  sendVerificationEmail
};

