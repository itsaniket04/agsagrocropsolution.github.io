// API Client for AGS Agro Solutions Backend
class API {
    constructor() {
        this.baseURL = window.location.hostname === 'localhost'
            ? 'http://localhost:8888/api'
            : '/api';
        this.token = localStorage.getItem('ags_token');
    }

    // Helper method for API calls
    async request(endpoint, options = {}) {
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        try {
            const response = await fetch(`${this.baseURL}/${endpoint}`, {
                ...options,
                headers
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'API request failed');
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    // Authentication
    async signup(name, email, password, phone) {
        const data = await this.request('auth-signup', {
            method: 'POST',
            body: JSON.stringify({ name, email, password, phone })
        });

        if (data.token) {
            this.setToken(data.token);
        }
        return data;
    }

    async login(email, password) {
        const data = await this.request('auth-login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });

        if (data.token) {
            this.setToken(data.token);
        }
        return data;
    }

    async verifyAuth() {
        try {
            return await this.request('auth-verify');
        } catch (error) {
            this.clearToken();
            throw error;
        }
    }

    // Token management
    setToken(token) {
        this.token = token;
        localStorage.setItem('ags_token', token);
    }

    clearToken() {
        this.token = null;
        localStorage.removeItem('ags_token');
        localStorage.removeItem('ags_user');
    }

    isAuthenticated() {
        return !!this.token;
    }

    // Products
    async getProducts(category = null) {
        const query = category ? `?category=${category}` : '';
        return await this.request(`products-get${query}`);
    }

    // Cart
    async addToCart(productId, name, size, price, quantity = 1) {
        return await this.request('cart-add', {
            method: 'POST',
            body: JSON.stringify({ productId, name, size, price, quantity })
        });
    }

    async getCart() {
        return await this.request('cart-get');
    }

    // Orders
    async createOrder(shippingAddress, paymentMethod = 'cod') {
        return await this.request('order-create', {
            method: 'POST',
            body: JSON.stringify({ shippingAddress, paymentMethod })
        });
    }

    async getOrders() {
        return await this.request('orders-get');
    }
}

// Create global API instance
window.api = new API();
