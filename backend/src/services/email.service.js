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
 * Send a generic email
 * @param {object} options - Email options { to, subject, html, text }
 * @returns {Promise<object>} - Result of email sending
 */
async function sendEmail(options) {
  try {
    if (!validateEmail(options.to)) {
      throw new Error('Invalid email format');
    }

    const msg = {
      to: options.to,
      from: process.env.EMAIL_FROM || 'noreply@healthconnect.com',
      subject: options.subject,
      html: options.html,
      text: options.text
    };

    const result = await sgMail.send(msg);
    console.log('✅ Email sent successfully:', result[0].headers['x-message-id']);
    return { success: true, messageId: result[0].headers['x-message-id'] };
  } catch (error) {
    console.error('❌ Email sending error:', error.message);
    throw error;
  }
}

/**
 * Send welcome email to new users or doctors
 * @param {string} to - Recipient email address
 * @param {string} name - Recipient name
 * @param {string} userType - 'user' or 'doctor'
 * @returns {Promise<object>} - Result of email sending
 */
async function sendWelcomeEmail(to, name, userType) {
  if (!validateEmail(to)) {
    throw new Error('Invalid email format');
  }

  const msg = {
    to: to,
    from: process.env.EMAIL_FROM || 'noreply@healthconnect.com',
    subject: getWelcomeSubject(name, userType),
    html: getWelcomeTemplate(name, userType)
  };

  try {
    const result = await sgMail.send(msg);
    return { success: true, messageId: result[0].headers['x-message-id'] };
  } catch (error) {
    console.error(`❌ Failed to send welcome email to ${to}:`, error.message);
    throw error;
  }
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

  const appUrl = process.env.APP_URL || 'http://localhost:4200';
  const verificationUrl = `${appUrl}/verify-email?token=${verificationToken}&type=${userType}`;
  const greeting = userType === 'doctor' ? `Dr. ${name}` : name;

  const msg = {
    to: to,
    from: process.env.EMAIL_FROM || 'noreply@healthconnect.com',
    subject: 'Verify Your Email - Health Connect 🔐',
    html: getVerificationTemplate(greeting, verificationUrl)
  };

  try {
    const result = await sgMail.send(msg);
    return { success: true, messageId: result[0].headers['x-message-id'] };
  } catch (error) {
    console.error(`❌ Failed to send verification email to ${to}:`, error.message);
    throw error;
  }
}

/**
 * Send prescription share notification email
 * @param {object} data - Prescription share data
 * @returns {Promise<object>} - Result of email sending
 */
async function sendPrescriptionShare(data) {
  const {
    recipientEmail,
    recipientName,
    shareUrl,
    sharedBy,
    patientName,
    doctorName,
    expiresAt
  } = data;

  if (!validateEmail(recipientEmail)) {
    throw new Error('Invalid email format');
  }

  const html = createShareEmailTemplate({
    recipientName: recipientName || 'Valued Recipient',
    sharedBy,
    patientName: patientName || 'Patient',
    doctorName: doctorName || 'Healthcare Provider',
    shareUrl,
    expiresAt,
    sharedDate: new Date().toLocaleString('en-US', {
      dateStyle: 'long',
      timeStyle: 'short'
    })
  });

  return await sendEmail({
    to: recipientEmail,
    subject: '🏥 Prescription Shared with You - HealthConnect',
    html: html,
    text: `A prescription has been shared with you. View it here: ${shareUrl}`
  });
}

/**
 * Send newsletter welcome email
 * @param {string} to - Subscriber email
 * @param {string} name - Subscriber name
 * @param {string} unsubscribeToken - Token for unsubscribe link
 * @returns {Promise<object>} - Result of email sending
 */
async function sendNewsletterWelcome(to, name, unsubscribeToken) {
  if (!validateEmail(to)) {
    throw new Error('Invalid email format');
  }

  const appUrl = process.env.APP_URL || 'http://localhost:4200';
  const unsubscribeUrl = `${appUrl}/newsletter/unsubscribe/${unsubscribeToken}`;
  const firstName = name.split(' ')[0];

  const msg = {
    to: to,
    from: process.env.EMAIL_FROM || 'noreply@healthconnect.com',
    subject: `Welcome to Health Connect Newsletter, ${firstName}! 🌿`,
    html: getNewsletterWelcomeTemplate(firstName, name, unsubscribeUrl, appUrl)
  };

  try {
    const result = await sgMail.send(msg);
    return { success: true, messageId: result[0].headers['x-message-id'] };
  } catch (error) {
    console.error(`❌ Failed to send newsletter welcome email to ${to}:`, error.message);
    throw error;
  }
}

/**
 * Get email subject based on user type
 */
function getWelcomeSubject(name, userType) {
  if (userType === 'doctor') {
    return `Welcome to Health Connect, Dr. ${name}! 🩺`;
  }
  return `Welcome to Health Connect, ${name}! 🌿`;
}

/**
 * User welcome email template
 */
function getWelcomeTemplate(name, userType) {
  const appUrl = process.env.APP_URL || 'http://localhost:4200';

  if (userType === 'doctor') {
    return getDoctorWelcomeTemplate(name, appUrl);
  }
  return getUserWelcomeTemplate(name, appUrl);
}

function getUserWelcomeTemplate(name, appUrl) {
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
    .footer { background: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb; }
    .footer p { color: #6b7280; font-size: 14px; margin: 5px 0; }
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
        <a href="${appUrl}/user/find-doctors" class="button">Find a Doctor Now</a>
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
      <p><strong>© ${new Date().getFullYear()} Health Connect</strong></p>
      <p>This email was sent to you because you created an account.</p>
    </div>
  </div>
</body>
</html>
  `;
}

function getDoctorWelcomeTemplate(name, appUrl) {
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
    .button { display: inline-block; background: linear-gradient(135deg, #0891b2, #059669); color: white; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(8, 145, 178, 0.3); }
    .footer { background: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb; }
    .footer p { color: #6b7280; font-size: 14px; margin: 5px 0; }
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
        <a href="${appUrl}/doctor/dashboard" class="button">Go to Dashboard</a>
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
      <p><strong>© ${new Date().getFullYear()} Health Connect</strong></p>
      <p>This email was sent to you because you registered as a healthcare provider.</p>
    </div>
  </div>
</body>
</html>
  `;
}

function getVerificationTemplate(greeting, verificationUrl) {
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
      <p><strong>© ${new Date().getFullYear()} Health Connect</strong></p>
      <p>Automated email - please do not reply</p>
    </div>
  </div>
</body>
</html>
  `;
}

function getNewsletterWelcomeTemplate(firstName, fullName, unsubscribeUrl, appUrl) {
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
    .header { background: linear-gradient(135deg, #059669, #10b981); padding: 40px 30px; text-align: center; }
    .header h1 { color: white; font-size: 28px; margin-bottom: 8px; }
    .header p { color: rgba(255, 255, 255, 0.9); font-size: 16px; }
    .content { padding: 40px 30px; }
    .greeting { font-size: 24px; color: #1f2937; margin-bottom: 20px; font-weight: 600; }
    .intro { font-size: 16px; color: #4b5563; margin-bottom: 25px; line-height: 1.8; }
    .benefits { background: #f0fdf4; border-left: 4px solid #059669; padding: 20px; margin: 30px 0; border-radius: 8px; }
    .benefits h3 { color: #059669; font-size: 18px; margin-bottom: 15px; }
    .benefits ul { list-style: none; }
    .benefits li { padding: 10px 0; color: #374151; font-size: 15px; display: flex; align-items: start; }
    .benefits li:before { content: "✨"; margin-right: 12px; font-size: 18px; }
    .cta { text-align: center; margin: 40px 0; }
    .button { display: inline-block; background: linear-gradient(135deg, #059669, #10b981); color: white !important; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(5, 150, 105, 0.3); }
    .tips { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 20px 0; border-radius: 8px; }
    .tips h4 { color: #92400e; margin-bottom: 10px; }
    .tips p { color: #78350f; font-size: 14px; line-height: 1.6; }
    .footer { background: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb; }
    .footer p { color: #6b7280; font-size: 14px; margin: 5px 0; }
    .footer a { color: #059669; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🌿 Welcome to Health Connect!</h1>
      <p>Your Journey to Better Health Starts Here</p>
    </div>
    
    <div class="content">
      <div class="greeting">Hello ${firstName}! 👋</div>
      
      <p class="intro">
        Thank you for subscribing to the Health Connect newsletter! We're thrilled to have you as part of our community.
        You're now connected to the latest health insights, wellness tips, and exclusive updates.
      </p>
      
      <div class="benefits">
        <h3>What You'll Receive:</h3>
        <ul>
          <li>Weekly health tips and wellness advice</li>
          <li>Expert insights from certified doctors</li>
          <li>Latest medical breakthroughs and research</li>
          <li>Exclusive offers on consultations</li>
          <li>Seasonal health guides and prevention tips</li>
        </ul>
      </div>
      
      <div class="tips">
        <h4>💡 Quick Health Tip</h4>
        <p>
          Start your day with a glass of warm water and lemon! It helps boost your metabolism, 
          aids digestion, and provides a dose of vitamin C to strengthen your immune system.
        </p>
      </div>
      
      <div class="cta">
        <a href="${appUrl}" class="button">Explore Health Connect</a>
      </div>
      
      <p class="intro">
        We're committed to bringing you valuable, evidence-based health information. 
        If you have any questions or topics you'd like us to cover, feel free to reply to this email!
      </p>
      
      <p style="color: #6b7280; font-size: 15px; margin-top: 30px;">
        Stay healthy and well! 🌟<br>
        <strong>The Health Connect Team</strong>
      </p>
    </div>
    
    <div class="footer">
      <p><strong>© ${new Date().getFullYear()} Health Connect</strong></p>
      <p>Your trusted partner in health and wellness</p>
      
      <p style="margin-top: 20px; font-size: 12px;">
        You're receiving this because you subscribed to Health Connect newsletter.<br>
        <a href="${unsubscribeUrl}">Unsubscribe</a> | <a href="mailto:support@healthconnect.com">Contact Us</a>
      </p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Create HTML email template for prescription sharing
 */
function createShareEmailTemplate(data) {
  const { recipientName, sharedBy, patientName, doctorName, shareUrl, expiresAt, sharedDate } = data;

  const expiryDate = new Date(expiresAt).toLocaleString('en-US', {
    dateStyle: 'long',
    timeStyle: 'short'
  });

  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; 
               line-height: 1.6; color: #1f2937; background-color: #f9fafb; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
        .header { background: linear-gradient(135deg, #10b981 0%, #3b82f6 100%); 
                  color: white; padding: 40px 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; font-weight: 700; }
        .header p { margin: 10px 0 0; opacity: 0.9; font-size: 14px; }
        .content { padding: 40px 30px; }
        .content p { margin: 0 0 15px; color: #4b5563; }
        .button { display: inline-block; padding: 14px 32px; background: #10b981; color: white; 
                  text-decoration: none; border-radius: 8px; font-weight: 600; margin: 25px 0;
                  box-shadow: 0 2px 4px rgba(16, 185, 129, 0.3); }
        .info-box { background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981; }
        .info-box strong { color: #1f2937; display: block; margin-bottom: 10px; font-size: 16px; }
        .info-box ul { margin: 10px 0; padding-left: 20px; color: #4b5563; }
        .info-box ul li { margin: 8px 0; }
        .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 20px 0; border-radius: 8px; }
        .warning strong { color: #92400e; display: block; margin-bottom: 10px; }
        .warning ul { margin: 10px 0; padding-left: 20px; color: #78350f; }
        .warning li { margin: 6px 0; }
        .footer { text-align: center; padding: 30px; background: #f9fafb; color: #6b7280; font-size: 13px; }
        .footer p { margin: 5px 0; }
        .divider { height: 1px; background: #e5e7eb; margin: 25px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🏥 Prescription Shared</h1>
            <p>Secure Healthcare Document Sharing</p>
        </div>
        
        <div class="content">
            <p style="font-size: 16px; color: #1f2937;"><strong>Hello ${recipientName},</strong></p>
            
            <p><strong>${sharedBy}</strong> has securely shared a prescription with you through HealthConnect.</p>
            
            <div class="info-box">
                <strong>📋 Prescription Details:</strong>
                <ul>
                    <li><strong>Patient:</strong> ${patientName}</li>
                    <li><strong>Prescribing Doctor:</strong> ${doctorName}</li>
                    <li><strong>Shared on:</strong> ${sharedDate}</li>
                    <li><strong>Link expires:</strong> ${expiryDate}</li>
                </ul>
            </div>
            
            <center>
                <a href="${shareUrl}" class="button">📄 View Prescription</a>
            </center>
            
            <div class="divider"></div>
            
            <div class="warning">
                <strong>⚠️ Important Security Information:</strong>
                <ul>
                    <li>This link is time-limited and will expire on <strong>${expiryDate}</strong></li>
                    <li>Please do not share this link with unauthorized individuals</li>
                    <li>All access to this prescription is tracked for security purposes</li>
                    <li>If you did not expect to receive this, please contact ${sharedBy}</li>
                </ul>
            </div>
            
            <p style="margin-top: 25px; color: #6b7280; font-size: 14px;">
                If you have any questions about this prescription, please contact the person who shared it with you directly.
            </p>
        </div>
        
        <div class="footer">
            <p><strong>HealthConnect</strong></p>
            <p>&copy; ${new Date().getFullYear()} HealthConnect. All rights reserved.</p>
            <p style="margin-top: 15px;">This is an automated message. Please do not reply to this email.</p>
        </div>
    </div>
</body>
</html>
  `.trim();
}

/**
 * Test email configuration
 */
async function testConnection() {
  try {
    // SendGrid doesn't have a direct verify method like Nodemailer
    // We'll just check if the API key is set
    if (!process.env.SENDGRID_API_KEY) {
      throw new Error('SendGrid API key not configured');
    }
    console.log('✅ Email service is ready to send emails (SendGrid configured)');
    return { success: true };
  } catch (error) {
    console.error('❌ Email service configuration error:', error.message);
    return { success: false, error: error.message };
  }
}

// Export functions
module.exports = {
  validateEmail,
  sendEmail,
  sendWelcomeEmail,
  sendVerificationEmail,
  sendPrescriptionShare,
  sendNewsletterWelcome,
  testConnection
};
