const connectDB = require('./shared/db');
const { User } = require('./shared/models');
const { isValidEmail, sanitizeInput, generateToken, hashToken } = require('./shared/validators');
const { sendEmail, getPasswordResetEmail } = require('./shared/emailService');
const { rateLimit } = require('./shared/rateLimit');

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        // Rate limiting: 3 password reset requests per hour per IP
        const clientIp = event.headers['client-ip'] || event.headers['x-forwarded-for'] || 'unknown';
        const rateLimitResult = rateLimit(`forgot:${clientIp}`, 3, 3600000);

        if (!rateLimitResult.allowed) {
            return {
                statusCode: 429,
                body: JSON.stringify({
                    error: 'Too many password reset attempts. Please try again later.',
                    retryAfter: rateLimitResult.retryAfter
                })
            };
        }

        await connectDB();

        let { email } = JSON.parse(event.body);
        email = sanitizeInput(email);

        if (!email || !isValidEmail(email)) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Valid email is required' })
            };
        }

        // Find user
        const user = await User.findOne({ email });

        // For security, always return success even if user doesn't exist
        if (!user) {
            return {
                statusCode: 200,
                body: JSON.stringify({
                    message: 'If an account exists with this email, a password reset link has been sent.'
                })
            };
        }

        // Generate password reset token (1 hour expiry)
        const resetToken = generateToken();
        const hashedToken = hashToken(resetToken);

        user.passwordResetToken = hashedToken;
        user.passwordResetExpires = Date.now() + 60 * 60 * 1000; // 1 hour
        await user.save();

        // Send password reset email
        const siteUrl = process.env.SITE_URL || 'http://localhost:8888';
        const resetLink = `${siteUrl}/reset-password.html?token=${resetToken}`;

        try {
            await sendEmail(
                email,
                'Password Reset Request - AGS Agro Crop',
                getPasswordResetEmail(user.name, resetLink)
            );
        } catch (emailError) {
            console.error('Email sending failed:', emailError);
            // Continue even if email fails
        }

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'If an account exists with this email, a password reset link has been sent.'
            })
        };
    } catch (error) {
        console.error('Forgot password error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Server error processing password reset request' })
        };
    }
};
