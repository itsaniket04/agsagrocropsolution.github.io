/**
 * Email Service
 * Handles sending emails for verification and password reset
 */

const sendEmail = async (to, subject, html) => {
    // Development mode: Log to console
    if (process.env.NODE_ENV !== 'production') {
        console.log('===== EMAIL =====');
        console.log('To:', to);
        console.log('Subject:', subject);
        console.log('Body:', html);
        console.log('=================');
        return { success: true, mode: 'dev' };
    }

    // Production mode: Use SendGrid (if configured)
    if (process.env.SENDGRID_API_KEY) {
        try {
            const sgMail = require('@sendgrid/mail');
            sgMail.setApiKey(process.env.SENDGRID_API_KEY);

            await sgMail.send({
                to,
                from: process.env.EMAIL_FROM || 'noreply@agrocrop.com',
                subject,
                html
            });

            return { success: true, mode: 'sendgrid' };
        } catch (error) {
            console.error('SendGrid error:', error);
            throw error;
        }
    }

    // Fallback: Log to console
    console.log('===== EMAIL (No SendGrid) =====');
    console.log('To:', to);
    console.log('Subject:', subject);
    console.log'Body:', html);
    console.log('===============================');
    return { success: true, mode: 'fallback' };
};

// Email templates
const getVerificationEmail = (name, verificationLink) => {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .button { 
                    display: inline-block; 
                    padding: 12px 30px; 
                    background: #4a7c2f; 
                    color: white; 
                    text-decoration: none; 
                    border-radius: 5px;
                    margin: 20px 0;
                }
                .footer { margin-top: 30px; font-size: 12px; color: #666; }
            </style>
        </head>
        <body>
            <div class="container">
                <h2>🌱 Welcome to AGS Agro Crop!</h2>
                <p>Hi ${name},</p>
                <p>Thank you for signing up! Please verify your email address to activate your account.</p>
                <a href="${verificationLink}" class="button">Verify Email Address</a>
                <p>Or copy and paste this link into your browser:</p>
                <p style="word-break: break-all; color: #666;">${verificationLink}</p>
                <p>This link will expire in 24 hours.</p>
                <div class="footer">
                    <p>If you didn't create an account, please ignore this email.</p>
                    <p>&copy; 2024 AGS Agro Crop Solutions. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
    `;
};

const getPasswordResetEmail = (name, resetLink) => {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .button { 
                    display: inline-block; 
                    padding: 12px 30px; 
                    background: #4a7c2f; 
                    color: white; 
                    text-decoration: none; 
                    border-radius: 5px;
                    margin: 20px 0;
                }
                .warning { background: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; }
                .footer { margin-top: 30px; font-size: 12px; color: #666; }
            </style>
        </head>
        <body>
            <div class="container">
                <h2>🔒 Password Reset Request</h2>
                <p>Hi ${name},</p>
                <p>We received a request to reset your password. Click the button below to create a new password:</p>
                <a href="${resetLink}" class="button">Reset Password</a>
                <p>Or copy and paste this link into your browser:</p>
                <p style="word-break: break-all; color: #666;">${resetLink}</p>
                <div class="warning">
                    <strong>⚠️ Important:</strong> This link will expire in 1 hour for security reasons.
                </div>
                <div class="footer">
                    <p>If you didn't request a password reset, please ignore this email or contact support if you're concerned.</p>
                    <p>&copy; 2024 AGS Agro Crop Solutions. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
    `;
};

module.exports = {
    sendEmail,
    getVerificationEmail,
    getPasswordResetEmail
};
