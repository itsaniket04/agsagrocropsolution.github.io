const { RefreshToken } = require('./shared/models');
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

        if (refreshTokenCookie) {
            const refreshToken = refreshTokenCookie.split('=')[1];
            const hashedToken = hashToken(refreshToken);

            // Delete refresh token from database
            await RefreshToken.deleteMany({ token: hashedToken });
        }

        // Clear refresh token cookie
        const cookieOptions = [
            'refreshToken=',
            'HttpOnly',
            'Max-Age=0',
            'Path=/',
            'SameSite=Strict'
        ].join('; ');

        return {
            statusCode: 200,
            headers: {
                'Set-Cookie': cookieOptions
            },
            body: JSON.stringify({
                message: 'Logged out successfully'
            })
        };
    } catch (error) {
        console.error('Logout error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Server error during logout' })
        };
    }
};
