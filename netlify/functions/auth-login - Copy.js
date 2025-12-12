const connectDB = require('./shared/db');
const { User, RefreshToken } = require('./shared/models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { rateLimit } = require('./shared/rateLimit');
const { hashToken } = require('./shared/validators');

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        // Rate limiting: 5 login attempts per 15 minutes per IP
        const clientIp = event.headers['client-ip'] || event.headers['x-forwarded-for'] || 'unknown';
        const rateLimitResult = rateLimit(`login:${clientIp}`, 5, 900000);

        if (!rateLimitResult.allowed) {
            return {
                statusCode: 429,
                body: JSON.stringify({
                    error: 'Too many login attempts. Please try again later.',
                    retryAfter: rateLimitResult.retryAfter
                })
            };
        }

        await connectDB();

        const { email, password } = JSON.parse(event.body);

        // Validation
        if (!email || !password) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Email and password are required' })
            };
        }

        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return {
                statusCode: 401,
                body: JSON.stringify({ error: 'Invalid email or password' })
            };
        }

        // Check if email is verified
        if (!user.emailVerified) {
            return {
                statusCode: 403,
                body: JSON.stringify({
                    error: 'Please verify your email before logging in',
                    emailVerified: false
                })
            };
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return {
                statusCode: 401,
                body: JSON.stringify({ error: 'Invalid email or password' })
            };
        }

        // Generate access token (15 minutes)
        const accessToken = jwt.sign(
            { userId: user._id, email: user.email, role: user.role },
            process.env.JWT_SECRET || 'fallback-secret',
            { expiresIn: '15m' }
        );

        // Generate refresh token (7 days)
        const refreshToken = jwt.sign(
            { userId: user._id },
            process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'fallback-refresh-secret',
            { expiresIn: '7d' }
        );

        // Store hashed refresh token in database
        const hashedRefreshToken = hashToken(refreshToken);
        await RefreshToken.create({
            userId: user._id,
            token: hashedRefreshToken,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        });

        // Update last login
        user.lastLogin = new Date();
        await user.save();

        // Set HTTP-only cookie for refresh token
        const isProduction = process.env.NODE_ENV === 'production';
        const cookieOptions = [
            `refreshToken=${refreshToken}`,
            'HttpOnly',
            `Max-Age=${7 * 24 * 60 * 60}`, // 7 days
            'Path=/',
            'SameSite=Strict',
            isProduction ? 'Secure' : ''
        ].filter(Boolean).join('; ');

        return {
            statusCode: 200,
            headers: {
                'Set-Cookie': cookieOptions
            },
            body: JSON.stringify({
                message: 'Login successful',
                accessToken,
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    phone: user.phone
                }
            })
        };
    } catch (error) {
        console.error('Login error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Server error during login' })
        };
    }
};
