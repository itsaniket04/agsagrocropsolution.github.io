const connectDB = require('./shared/db');
const { Order } = require('./shared/models');
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

        const orders = await Order.find({ userId: decoded.userId }).sort({ orderDate: -1 });

        return {
            statusCode: 200,
            body: JSON.stringify({
                orders: orders.map(o => ({
                    id: o._id,
                    orderNumber: o.orderNumber,
                    items: o.items,
                    totalAmount: o.totalAmount,
                    status: o.status,
                    orderDate: o.orderDate,
                    shippingAddress: o.shippingAddress
                }))
            })
        };
    } catch (error) {
        console.error('Get orders error:', error);
        return {
            statusCode: error.message === 'No token provided' ? 401 : 500,
            body: JSON.stringify({ error: error.message || 'Error fetching orders' })
        };
    }
};
