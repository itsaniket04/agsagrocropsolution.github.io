// Authentication and UI Management with Guest Cart Support
class AuthUI {
    constructor() {
        this.init();
    }

    init() {
        // Check if user is already logged in
        this.checkAuth();

        // Modal elements
        this.loginModal = document.getElementById('loginModal');
        this.signupModal = document.getElementById('signupModal');

        // Button elements
        this.loginBtn = document.getElementById('loginBtn');
        this.signupBtn = document.getElementById('signupBtn');
        this.logoutBtn = document.getElementById('logoutBtn');
        this.cartBtn = document.getElementById('cartBtn');

        // Cart elements
        this.cartSidebar = document.getElementById('cartSidebar');
        this.cartOverlay = document.getElementById('cartOverlay');
        this.cartClose = document.getElementById('cartClose');
        this.checkoutBtn = document.getElementById('checkoutBtn');

        // Set up event listeners
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Login/Signup buttons
        if (this.loginBtn) {
            this.loginBtn.addEventListener('click', () => this.showLogin());
        }

        if (this.signupBtn) {
            this.signupBtn.addEventListener('click', () => this.showSignup());
        }

        // Modal close buttons
        document.getElementById('loginClose')?.addEventListener('click', () => this.hideLogin());
        document.getElementById('signupClose')?.addEventListener('click', () => this.hideSignup());

        // Switch between login/signup
        document.getElementById('showSignup')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.hideLogin();
            this.showSignup();
        });

        document.getElementById('showLogin')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.hideSignup();
            this.showLogin();
        });

        // Forms
        document.getElementById('loginForm')?.addEventListener('submit', (e) => this.handleLogin(e));
        document.getElementById('signupForm')?.addEventListener('submit', (e) => this.handleSignup(e));

        // Logout
        if (this.logoutBtn) {
            this.logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleLogout();
            });
        }

        // Cart
        if (this.cartBtn) {
            this.cartBtn.addEventListener('click', () => this.showCart());
        }

        if (this.cartClose) {
            this.cartClose.addEventListener('click', () => this.hideCart());
        }

        if (this.cartOverlay) {
            this.cartOverlay.addEventListener('click', () => this.hideCart());
        }

        // Close modals on outside click
        window.addEventListener('click', (e) => {
            if (e.target === this.loginModal) this.hideLogin();
            if (e.target === this.signupModal) this.hideSignup();
        });

        // User menu dropdown
        document.getElementById('userMenuBtn')?.addEventListener('click', () => {
            document.getElementById('userDropdown')?.classList.toggle('active');
        });
    }

    showLogin() {
        this.loginModal?.classList.add('active');
    }

    hideLogin() {
        this.loginModal?.classList.remove('active');
    }

    showSignup() {
        this.signupModal?.classList.add('active');
    }

    hideSignup() {
        this.signupModal?.classList.remove('active');
    }

    async handleLogin(e) {
        e.preventDefault();

        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        try {
            const data = await api.login(email, password);

            // Save user data
            localStorage.setItem('ags_user', JSON.stringify(data.user));

            // Update UI
            this.updateUIForLoggedIn(data.user);

            // Close modal
            this.hideLogin();

            // Merge guest cart with user cart
            await this.mergeGuestCartToUser();

            // Show success
            this.showToast('Login successful! Welcome back.', 'success');
        } catch (error) {
            this.showToast(error.message || 'Login failed. Please try again.', 'error');
        }
    }

    async handleSignup(e) {
        e.preventDefault();

        const name = document.getElementById('signupName').value;
        const email = document.getElementById('signupEmail').value;
        const phone = document.getElementById('signupPhone').value;
        const password = document.getElementById('signupPassword').value;

        if (password.length < 6) {
            this.showToast('Password must be at least 6 characters', 'error');
            return;
        }

        try {
            const data = await api.signup(name, email, password, phone);

            // Save user data
            localStorage.setItem('ags_user', JSON.stringify(data.user));

            // Update UI
            this.updateUIForLoggedIn(data.user);

            // Close modal
            this.hideSignup();

            // Merge guest cart with user cart
            await this.mergeGuestCartToUser();

            // Show success
            this.showToast('Account created successfully! Welcome to AGS Agro.', 'success');
        } catch (error) {
            this.showToast(error.message || 'Signup failed. Please try again.', 'error');
        }
    }

    handleLogout() {
        // Clear auth data
        api.clearToken();
        localStorage.removeItem('ags_user');

        // Update UI
        this.updateUIForLoggedOut();

        // Show message
        this.showToast('Logged out successfully', 'success');
    }

    checkAuth() {
        if (api.isAuthenticated()) {
            const user = JSON.parse(localStorage.getItem('ags_user') || '{}');
            this.updateUIForLoggedIn(user);
            this.loadCart();
        } else {
            this.updateUIForLoggedOut();
            this.loadGuestCart(); // Load guest cart badge
        }
    }

    updateUIForLoggedIn(user) {
        document.getElementById('loggedOutNav').style.display = 'none';
        document.getElementById('loggedInNav').style.display = 'flex';
        document.getElementById('userName').textContent = user.name || 'User';
    }

    updateUIForLoggedOut() {
        document.getElementById('loggedOutNav').style.display = 'flex';
        document.getElementById('loggedInNav').style.display = 'none';
        this.loadGuestCart(); // Load guest cart badge count
    }

    async showCart() {
        this.cartSidebar?.classList.add('active');
        this.cartOverlay?.classList.add('active');

        if (api.isAuthenticated()) {
            await this.loadCart();
        } else {
            this.loadGuestCart();
        }
    }

    hideCart() {
        this.cartSidebar?.classList.remove('active');
        this.cartOverlay?.classList.remove('active');
    }

    // Load user cart from backend
    async loadCart() {
        if (!api.isAuthenticated()) {
            this.loadGuestCart();
            return;
        }

        try {
            const { cart, total } = await api.getCart();

            const badgeCount = cart.reduce((sum, item) => sum + item.quantity, 0);
            document.getElementById('cartBadge').textContent = badgeCount;

            const cartItemsContainer = document.getElementById('cartItems');

            if (cart.length === 0) {
                cartItemsContainer.innerHTML = '<div class="cart-empty">Your cart is empty</div>';
            } else {
                cartItemsContainer.innerHTML = cart.map(item => `
                    <div class="cart-item">
                        <div class="cart-item-details">
                            <div class="cart-item-name">${item.name}</div>
                            <div class="cart-item-size">${item.size} × ${item.quantity}</div>
                            <div class="cart-item-price">₹${item.price * item.quantity}</div>
                        </div>
                    </div>
                `).join('');
            }

            document.getElementById('cartTotal').textContent = `₹${total}`;
        } catch (error) {
            console.error('Error loading cart:', error);
        }
    }

    // Load guest cart from localStorage
    loadGuestCart() {
        const guestCart = JSON.parse(localStorage.getItem('ags_guest_cart') || '[]');

        const badgeCount = guestCart.reduce((sum, item) => sum + item.quantity, 0);
        document.getElementById('cartBadge').textContent = badgeCount;

        const cartItemsContainer = document.getElementById('cartItems');

        if (guestCart.length === 0) {
            cartItemsContainer.innerHTML = '<div class="cart-empty">Your cart is empty<br><small>Add items to get started!</small></div>';
        } else {
            cartItemsContainer.innerHTML = guestCart.map((item, index) => `
                <div class="cart-item">
                    <div class="cart-item-details">
                        <div class="cart-item-name">${item.name}</div>
                        <div class="cart-item-size">${item.size} × ${item.quantity}</div>
                        <div class="cart-item-price">₹${item.price * item.quantity}</div>
                    </div>
                    <button class="cart-item-remove" onclick="authUI.removeGuestItem(${index})">×</button>
                </div>
            `).join('');
        }

        const total = guestCart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        document.getElementById('cartTotal').textContent = `₹${total}`;
    }

    // Add to cart (guest or authenticated)
    async addToCart(productId, name, size, price) {
        if (!api.isAuthenticated()) {
            this.addToGuestCart(productId, name, size, price);
            return;
        }

        try {
            await api.addToCart(productId, name, size, price, 1);
            this.showToast(`${name} added to cart!`, 'success');
            await this.loadCart();
        } catch (error) {
            this.showToast(error.message || 'Failed to add to cart', 'error');
        }
    }
            guestCart.push({ productId, name, size, price, quantity: 1 });
}

localStorage.setItem('ags_guest_cart', JSON.stringify(guestCart));
this.loadGuestCart();
this.showToast(`${name} added to cart! Login to checkout.`, 'success');
    }

// Remove item from guest cart
removeGuestItem(index) {
    const guestCart = JSON.parse(localStorage.getItem('ags_guest_cart') || '[]');
    guestCart.splice(index, 1);
    localStorage.setItem('ags_guest_cart', JSON.stringify(guestCart));
    this.loadGuestCart();
    this.showToast('Item removed from cart', 'success');
}

    // Merge guest cart to user cart on login
    async mergeGuestCartToUser() {
    const guestCart = JSON.parse(localStorage.getItem('ags_guest_cart') || '[]');

    if (guestCart.length === 0) {
        await this.loadCart();
        return;
    }

    for (const item of guestCart) {
        try {
            await api.addToCart(item.productId, item.name, item.size, item.price, item.quantity);
        } catch (error) {
            console.error('Error merging cart item:', error);
        }
    }

    localStorage.removeItem('ags_guest_cart');
    await this.loadCart();
}

showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3000);
}
}

// Initialize on page load
let authUI;
document.addEventListener('DOMContentLoaded', () => {
    authUI = new AuthUI();
});

// Make authUI globally available
window.authUI = authUI;
