/**
 * Rate Limiter
 * Simple in-memory rate limiting
 */

const attempts = new Map();

const rateLimit = (identifier, maxAttempts, windowMs) => {
    const now = Date.now();
    const key = identifier;

    let record = attempts.get(key);

    if (!record) {
        record = { count: 1, resetTime: now + windowMs };
        attempts.set(key, record);
        return { allowed: true, remaining: maxAttempts - 1 };
    }

    if (now > record.resetTime) {
        record.count = 1;
        record.resetTime = now + windowMs;
        attempts.set(key, record);
        return { allowed: true, remaining: maxAttempts - 1 };
    }

    if (record.count >= maxAttempts) {
        const retryAfter = Math.ceil((record.resetTime - now) / 1000);
        return {
            allowed: false,
            remaining: 0,
            retryAfter
        };
    }

    record.count += 1;
    attempts.set(key, record);
    return { allowed: true, remaining: maxAttempts - record.count };
};

// Cleanup old entries periodically
setInterval(() => {
    const now = Date.now();
    for (const [key, record] of attempts.entries()) {
        if (now > record.resetTime) {
            attempts.delete(key);
        }
    }
}, 60000); // Clean up every minute

module.exports = { rateLimit };
