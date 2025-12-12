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
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        const decoded = verifyToken(event.headers.authorization);
        await connectDB();

        const { productId, name, size, price, quantity } = JSON.parse(event.body);

        let cart = await Cart.findOne({ userId: decoded.userId });

        if (!cart) {
            cart = new Cart({
                userId: decoded.userId,
                items: []
            });
        }

        // Check if item already exists
        const existingItemIndex = cart.items.findIndex(
            item => item.productId.toString() === productId && item.size === size
        );

        if (existingItemIndex > -1) {
            cart.items[existingItemIndex].quantity += quantity || 1;
        } else {
            cart.items.push({
                productId,
                name,
                size,
                price,
                quantity: quantity || 1
            });
        }

        cart.updatedAt = Date.now();
        await cart.save();

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Item added to cart',
                cart: cart.items
            })
        };
    } catch (error) {
        console.error('Add to cart error:', error);
        return {
            statusCode: error.message === 'No token provided' ? 401 : 500,
            body: JSON.stringify({ error: error.message || 'Error adding to cart' })
        };
    }
};
