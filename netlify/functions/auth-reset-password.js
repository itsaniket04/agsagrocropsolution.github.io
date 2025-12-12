const connectDB = require('./shared/db');
const { User, RefreshToken } = require('./shared/models');
const bcrypt = require('bcryptjs');
const { isStrongPassword, hashToken } = require('./shared/validators');

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        await connectDB();

        const { token, newPassword } = JSON.parse(event.body);

        if (!token || !newPassword) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Token and new password are required' })
            };
        }

        // Validate password strength
        const passwordCheck = isStrongPassword(newPassword);
        if (!passwordCheck.valid) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: passwordCheck.message })
            };
        }

        // Hash token to match stored hash
        const hashedToken = hashToken(token);

        // Find user with valid reset token
        const user = await User.findOne({
            passwordResetToken: hashedToken,
            passwordResetExpires: { $gt: Date.now() }
        });

        if (!user) {
            return {
                statusCode: 400,
                body: JSON.stringify({
                    error: 'Invalid or expired password reset token',
                    expired: true
                })
            };
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 12);

        // Update user password
        user.password = hashedPassword;
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save();

        // Revoke all refresh tokens for security
        await RefreshToken.deleteMany({ userId: user._id });

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Password reset successful. Please login with your new password.'
            })
        };
    } catch (error) {
        console.error('Password reset error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Server error during password reset' })
        };
    }
};
