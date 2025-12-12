const { RefreshToken } = require('./shared/models');
const jwt = require('jsonwebtoken');
const { hashToken } = require('./shared/validators');

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        // Get refresh token from cookie
        const cookies = event.headers.cookie || '';
        const refreshTokenCookie = cookies.split(';').find(c => c.trim().startsWith('refreshToken='));

        if (!refreshTokenCookie) {
            return {
                statusCode: 401,
                body: JSON.stringify({ error: 'No refresh token provided' })
            };
        }

        const refreshToken = refreshTokenCookie.split('=')[1];

        // Verify refresh token
        let decoded;
        try {
            decoded = jwt.verify(
                refreshToken,
                process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'fallback-refresh-secret'
            );
        } catch (err) {
            return {
                statusCode: 401,
                body: JSON.stringify({ error: 'Invalid refresh token' })
            };
        }

        // Check if refresh token exists in database
        const hashedToken = hashToken(refreshToken);
        const storedToken = await RefreshToken.findOne({
            token: hashedToken,
            userId: decoded.userId,
            expiresAt: { $gt: new Date() }
        });

        if (!storedToken) {
            return {
                statusCode: 401,
                body: JSON.stringify({ error: 'Refresh token not found or expired' })
            };
        }

        // Generate new access token
        const accessToken = jwt.sign(
            { userId: decoded.userId },
            process.env.JWT_SECRET || 'fallback-secret',
            { expiresIn: '15m' }
        );

        // Generate new refresh token (rotation)
        const newRefreshToken = jwt.sign(
            { userId: decoded.userId },
            process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'fallback-refresh-secret',
            { expiresIn: '7d' }
        );

        // Delete old refresh token and store new one
        await RefreshToken.deleteOne({ _id: storedToken._id });
        const newHashedToken = hashToken(newRefreshToken);
        await RefreshToken.create({
            userId: decoded.userId,
            token: newHashedToken,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        });

        // Set new HTTP-only cookie
        const isProduction = process.env.NODE_ENV === 'production';
        const cookieOptions = [
            `refreshToken=${newRefreshToken}`,
            'HttpOnly',
            `Max-Age=${7 * 24 * 60 * 60}`,
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
                accessToken
            })
        };
    } catch (error) {
        console.error('Token refresh error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Server error during token refresh' })
        };
    }
};
