const connectDB = require('./shared/db');
const { Product } = require('./shared/models');

exports.handler = async (event) => {
    if (event.httpMethod !== 'GET') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        await connectDB();

        const { category } = event.queryStringParameters || {};

        let query = { inStock: true };
        if (category && category !== 'all') {
            query.category = category;
        }

        const products = await Product.find(query).sort({ createdAt: -1 });

        return {
            statusCode: 200,
            body: JSON.stringify({
                products: products.map(p => ({
                    id: p._id,
                    name: p.name,
                    description: p.description,
                    category: p.category,
                    sizes: p.sizes,
                    image: p.image,
                    badge: p.badge,
                    rating: p.rating,
                    inStock: p.inStock
                }))
            })
        };
    } catch (error) {
        console.error('Get products error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Error fetching products' })
        };
    }
};
