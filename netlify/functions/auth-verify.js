const connectDB = require('./shared/db');
const { User } = require('./shared/models');
const { hashToken } = require('./shared/validators');

exports.handler = async (event) => {
    if (event.httpMethod !== 'GET') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        const token = event.queryStringParameters?.token;

        if (!token) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Verification token is required' })
            };
        }

        await connectDB();

        // Hash the token to match stored hash
        const hashedToken = hashToken(token);

        // Find user with this token
        const user = await User.findOne({
            emailVerificationToken: hashedToken,
            emailVerificationExpires: { $gt: Date.now() }
        });

        if (!user) {
            return {
                statusCode: 400,
                body: JSON.stringify({
                    error: 'Invalid or expired verification token',
                    expired: true
                })
            };
        }

        // Mark email as verified
        user.emailVerified = true;
        user.emailVerificationToken = undefined;
        user.emailVerificationExpires = undefined;
        await user.save();

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Email verified successfully',
                emailVerified: true
            })
        };
    } catch (error) {
        console.error('Email verification error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Server error during email verification' })
        };
    }
};
