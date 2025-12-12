const crypto = require('crypto');

/**
 * Input Validators
 * Validates and sanitizes user input
 */

// Email validation
const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

// Password strength validation
const isStrongPassword = (password) => {
    if (password.length < 8) {
        return { valid: false, message: 'Password must be at least 8 characters' };
    }

    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);

    if (!hasLetter || !hasNumber) {
        return { valid: false, message: 'Password must contain both letters and numbers' };
    }

    return { valid: true };
};

// Sanitize input (prevent XSS)
const sanitizeInput = (input) => {
    if (typeof input !== 'string') return input;

    return input
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
};

// Validate quantity
const isValidQuantity = (quantity) => {
    const qty = parseInt(quantity);
    return !isNaN(qty) && qty >= 1 && qty <= 999;
};

// Generate secure token
const generateToken = () => {
    return crypto.randomBytes(32).toString('hex');
};

// Hash token for storage
const hashToken = (token) => {
    return crypto.createHash('sha256').update(token).digest('hex');
};

module.exports = {
    isValidEmail,
    isStrongPassword,
    sanitizeInput,
    isValidQuantity,
    generateToken,
    hashToken
};
