import nodemailer from 'nodemailer';

// Get email configuration
const emailUser = process.env.EMAIL_USER;
const emailPass = process.env.EMAIL_PASS?.trim().replace(/\s+/g, ''); // Remove all spaces from password

// Log configuration status (without showing password)
if (!emailUser || !emailPass) {
  console.warn('⚠️  Email configuration missing:');
  console.warn(`   EMAIL_USER: ${emailUser ? '✓ Set' : '✗ Missing'}`);
  console.warn(`   EMAIL_PASS: ${emailPass ? '✓ Set' : '✗ Missing'}`);
} else {
  console.log('✓ Email configuration found');
  console.log(`   EMAIL_USER: ${emailUser}`);
  console.log(`   EMAIL_PASS: ${emailPass ? '✓ Set (hidden)' : '✗ Missing'}`);
}

// Create transporter for sending emails
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: emailUser,
    pass: emailPass,
  },
});

// Verify transporter configuration
if (emailUser && emailPass) {
  transporter.verify((error, success) => {
    if (error) {
      console.error('❌ Email transporter verification failed:', error.message);
      if (error.code === 'EAUTH') {
        console.error('   → This usually means:');
        console.error('   1. Gmail App Password is incorrect');
        console.error('   2. 2-Step Verification is not enabled');
        console.error('   3. App Password has spaces (should be removed)');
        console.error('   → Get a new App Password: https://myaccount.google.com/apppasswords');
      }
    } else {
      console.log('✓ Email server is ready to send messages');
    }
  });
}

export const sendOTPVerificationEmail = async ({ userId, email, otp }) => {
  try {
    if (!otp) {
      throw new Error('OTP is required');
    }

    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS?.trim().replace(/\s+/g, '');

    if (!emailUser || !emailPass) {
      throw new Error('Email configuration is missing. Please check EMAIL_USER and EMAIL_PASS in .env.local');
    }

    const mailOptions = {
      from: `"Agent Based Service System" <${emailUser}>`,
      to: email,
      replyTo: emailUser,
      subject: 'Complete your registration - Verification code inside',
      // Plain text version for better deliverability
      text: `Your verification code is: ${otp}\n\nThis code is valid for 5 minutes.\n\nIf you didn't request this code, please ignore this email.`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
          <table role="presentation" style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 20px 0; text-align: center;">
                <table role="presentation" style="width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                  <tr>
                    <td style="padding: 40px 30px; text-align: center; background-color: #2563eb; border-radius: 8px 8px 0 0;">
                      <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Email Verification</h1>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 40px 30px;">
                      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                        Hello,
                      </p>
                      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                        Thank you for signing up! Please use the verification code below to complete your registration:
                      </p>
                      <div style="background-color: #f3f4f6; padding: 30px; text-align: center; margin: 30px 0; border-radius: 8px; border: 2px dashed #2563eb;">
                        <div style="font-size: 36px; font-weight: bold; color: #2563eb; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                          ${otp}
                        </div>
                      </div>
                      <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 20px 0;">
                        <strong>Important:</strong> This code will expire in 5 minutes. Please enter it promptly to verify your email address.
                      </p>
                      <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0;">
                        If you didn't request this verification code, you can safely ignore this email. Your account will not be created without verification.
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 20px 30px; background-color: #f9fafb; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb;">
                      <p style="color: #9ca3af; font-size: 12px; line-height: 1.6; margin: 0; text-align: center;">
                        This is an automated message from Agent Based Service System. Please do not reply to this email.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
      // Add headers to improve deliverability
      headers: {
        'X-Priority': '1',
        'X-MSMail-Priority': 'High',
        'Importance': 'high',
        'List-Unsubscribe': `<mailto:${emailUser}?subject=unsubscribe>`,
      },
      // Add message ID for better tracking
      messageId: `<${Date.now()}-${Math.random().toString(36).substring(7)}@${emailUser.split('@')[1]}>`,
    };

    console.log(`📧 Attempting to send OTP email to: ${email}`);
    await transporter.sendMail(mailOptions);
    console.log(`✓ OTP email sent successfully to: ${email}`);

    return { status: 'PENDING', userId, email };
  } catch (error) {
    console.error('❌ Error sending OTP email:', error.message);
    if (error.code === 'EAUTH') {
      throw new Error('Email authentication failed. Please check your Gmail App Password in .env.local ');
    }
    throw error;
  }
};

