const connectDB = require('./shared/db');
const { Cart } = require('./shared/models');
const jwt = require('jsonwebtoken');
const { isValidQuantity } = require('./shared/validators');

const verifyToken = (authHeader) => {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new Error('No token provided');
    }
    const token = authHeader.substring(7);
    return jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
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

        const { guestCart } = JSON.parse(event.body);

        if (!Array.isArray(guestCart)) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Guest cart must be an array' })
            };
        }

        // Get or create user's cart
        let cart = await Cart.findOne({ userId: decoded.userId });

        if (!cart) {
            cart = new Cart({
                userId: decoded.userId,
                items: []
            });
        }

        // Merge guest cart items
        let itemsAdded = 0;
        let itemsUpdated = 0;

        for (const guestItem of guestCart) {
            const { productId, name, price, variant, quantity } = guestItem;

            // Validate quantity
            if (!isValidQuantity(quantity)) {
                continue; // Skip invalid items
            }

            // Check if item already exists (by productId + variant)
            const existingItemIndex = cart.items.findIndex(
                item => item.productId.toString() === productId && item.variant === variant
            );

            if (existingItemIndex > -1) {
                // Item exists: sum the quantities
                cart.items[existingItemIndex].quantity += quantity;
                itemsUpdated++;
            } else {
                // New item: add to cart
                cart.items.push({
                    productId,
                    name,
                    variant: variant || '',
                    price,
                    quantity,
                    addedAt: new Date()
                });
                itemsAdded++;
            }
        }

        cart.updatedAt = Date.now();
        await cart.save();

        // Calculate totals
        const totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
        const subtotal = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Guest cart merged successfully',
                itemsAdded,
                itemsUpdated,
                cart: cart.items,
                totalItems,
                subtotal
            })
        };
    } catch (error) {
        console.error('Cart merge error:', error);
        return {
            statusCode: error.message === 'No token provided' ? 401 : 500,
            body: JSON.stringify({ error: error.message || 'Error merging cart' })
        };
    }
};
