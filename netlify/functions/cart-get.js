const connectDB = require('./shared/db');
const { Cart } = require('./shared/models');
const jwt = require('jsonwebtoken');

const verifyToken = (authHeader) => {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new Error('No token provided');
    }
    const token = authHeader.substring(7);
    return jwt.verify(token, process.env.JWT_SECRET);
};

exports.handler = async (event) => {
    if (event.httpMethod !== 'GET') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        const decoded = verifyToken(event.headers.authorization);
        await connectDB();

        const cart = await Cart.findOne({ userId: decoded.userId });

        return {
            statusCode: 200,
            body: JSON.stringify({
                cart: cart ? cart.items : [],
                total: cart ? cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0) : 0
            })
        };
    } catch (error) {
        console.error('Get cart error:', error);
        return {
            statusCode: error.message === 'No token provided' ? 401 : 500,
            body: JSON.stringify({ error: error.message || 'Error fetching cart' })
        };
    }
};
