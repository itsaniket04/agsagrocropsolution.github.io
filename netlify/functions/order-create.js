const connectDB = require('./shared/db');
const { Order, Cart } = require('./shared/models');
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

        const { shippingAddress, paymentMethod } = JSON.parse(event.body);

        // Get cart
        const cart = await Cart.findOne({ userId: decoded.userId });
        if (!cart || cart.items.length === 0) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Cart is empty' })
            };
        }

        // Calculate total
        const totalAmount = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        // Generate order number
        const orderNumber = 'AGS' + Date.now() + Math.random().toString(36).substr(2, 5).toUpperCase();

        // Create order
        const order = new Order({
            userId: decoded.userId,
            orderNumber,
            items: cart.items,
            totalAmount,
            shippingAddress,
            paymentMethod: paymentMethod || 'cod',
            status: 'pending'
        });

        await order.save();

        // Clear cart
        cart.items = [];
        await cart.save();

        return {
            statusCode: 201,
            body: JSON.stringify({
                message: 'Order created successfully',
                order: {
                    orderNumber: order.orderNumber,
                    totalAmount: order.totalAmount,
                    status: order.status,
                    orderDate: order.orderDate
                }
            })
        };
    } catch (error) {
        console.error('Create order error:', error);
        return {
            statusCode: error.message === 'No token provided' ? 401 : 500,
            body: JSON.stringify({ error: error.message || 'Error creating order' })
        };
    }
};
