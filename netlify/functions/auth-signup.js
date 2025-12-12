const connectDB = require('./shared/db');
const { User } = require('./shared/models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { is ValidEmail, isStrongPassword, sanitizeInput, generateToken, hashToken } = require('./shared/validators');
const { sendEmail, getVerificationEmail } = require('./shared/emailService');
const { rateLimit } = require('./shared/rateLimit');

exports.handler = async (event) => {
    // Only allow POST
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        // Rate limiting: 10 signups per hour per IP
        const clientIp = event.headers['client-ip'] || event.headers['x-forwarded-for'] || 'unknown';
        const rateLimitResult = rateLimit(`signup:${clientIp}`, 10, 3600000);

        if (!rateLimitResult.allowed) {
            return {
                statusCode: 429,
                body: JSON.stringify({
                    error: 'Too many signup attempts. Please try again later.',
                    retryAfter: rateLimitResult.retryAfter
                })
            };
        }

        await connectDB();

        let { name, email, password, phone } = JSON.parse(event.body);

        // Sanitize inputs
        name = sanitizeInput(name);
        email = sanitizeInput(email);

        // Validation
        if (!name || !email || !password) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Name, email and password are required' })
            };
        }

        // Validate email
        if (!isValidEmail(email)) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Invalid email format' })
            };
        }

        // Validate password strength
        const passwordCheck = isStrongPassword(password);
        if (!passwordCheck.valid) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: passwordCheck.message })
            };
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return {
                statusCode: 409,
                body: JSON.stringify({ error: 'User already exists with this email' })
            };
        }

        // Hash password (12 rounds for better security)
        const hashedPassword = await bcrypt.hash(password, 12);

        // Generate email verification token
        const verificationToken = generateToken();
        const hashedToken = hashToken(verificationToken);

        // Create user
        const user = new User({
            name,
            email,
            password: hashedPassword,
            phone: phone || '',
            role: email === process.env.ADMIN_EMAIL ? 'admin' : 'customer',
            emailVerified: false,
            emailVerificationToken: hashedToken,
            emailVerificationExpires: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
        });

        await user.save();

        // Send verification email
        const siteUrl = process.env.SITE_URL || 'http://localhost:8888';
        const verificationLink = `${siteUrl}/verify-email.html?token=${verificationToken}`;

        try {
            await sendEmail(
                email,
                'Verify your AGS Agro Crop account',
                getVerificationEmail(name, verificationLink)
            );
        } catch (emailError) {
            console.error('Email sending failed:', emailError);
            // Continue even if email fails
        }

        return {
            statusCode: 201,
            body: JSON.stringify({
                message: 'Signup successful. Please check your email to verify your account.',
                userId: user._id
            })
        };
    } catch (error) {
        console.error('Signup error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Server error during signup' })
        };
    }
};
