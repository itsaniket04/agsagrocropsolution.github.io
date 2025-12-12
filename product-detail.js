/**
 * Product Detail Page JavaScript
 */

let currentProduct = null;
let selectedSize = null;
let quantity = 1;

// Get product ID from URL
const urlParams = new URLSearchParams(window.location.search);
const productId = urlParams.get('id');

// Load product data on page load
document.addEventListener('DOMContentLoaded', async () => {
    if (!productId) {
        showError();
        return;
    }

    showLoading();
    await loadProduct(productId);
});

async function loadProduct(id) {
    try {
        // Load products data
        const response = await fetch('/products-data.json');
        const data = await response.json();

        // Find product by ID
        const product = data.products.find(p => p.id === id || p.slug === id);

        if (!product) {
            showError();
            return;
        }

        currentProduct = product;
        selectedSize = product.sizes[0]; // Default to first size

        renderProduct(product);
        hideLoading();

    } catch (error) {
        console.error('Error loading product:', error);
        showError();
    }
}

function renderProduct(product) {
    // Update page title
    document.getElementById('page-title').textContent = `${product.name} - AGS Agro Crop`;
    document.getElementById('breadcrumb-product').textContent = product.name;

    // Render badge if exists
    if (product.badge) {
        document.getElementById('productBadge').innerHTML =
            `<span class="product-badge">${product.badge}</span>`;
    }

    // Product name
    document.getElementById('productName').textContent = product.name;

    // Rating
    const stars = '⭐'.repeat(Math.floor(product.rating));
    document.getElementById('productStars').textContent = stars;
    document.getElementById('ratingCount').textContent = `(${product.reviewCount} reviews)`;

    // Description
    document.getElementById('shortDescription').textContent = product.shortDescription;
    document.getElementById('fullDescription').textContent = product.fullDescription;

    // Render size options
    renderSizeOptions(product.sizes);

    // Update price for default size
    updatePrice();

    // Render specifications
    renderSpecifications(product);

    // Render benefits
    renderBenefits(product.benefits);

    // Render application info
    renderApplicationInfo(product.application);

    // Render images
    renderImages(product);

    // Show product container
    document.getElementById('product-container').style.display = 'block';
}

function renderSizeOptions(sizes) {
    const container = document.getElementById('sizeOptions');
    container.innerHTML = '';

    sizes.forEach((size, index) => {
        const btn = document.createElement('div');
        btn.className = 'size-option' + (index === 0 ? ' active' : '');
        if (size.stock <= 0) {
            btn.classList.add('out-of-stock');
        }
        btn.textContent = size.size;
        btn.onclick = () => selectSize(index);
        container.appendChild(btn);
    });
}

function selectSize(index) {
    selectedSize = currentProduct.sizes[index];

    // Update active state
    const options = document.querySelectorAll('.size-option');
    options.forEach((opt, i) => {
        opt.classList.toggle('active', i === index);
    });

    updatePrice();
    updateStock();
}

function updatePrice() {
    if (!selectedSize) return;

    document.getElementById('currentPrice').textContent = `₹${selectedSize.price}`;
    document.getElementById('originalPrice').textContent = `₹${selected Size.mrp
} `;
    document.getElementById('discountBadge').textContent = selectedSize.discount || `${ Math.round((1 - selectedSize.price / selectedSize.mrp) * 100) }% OFF`;
}

function updateStock() {
    const stockEl = document.getElementById('stockStatus');
    const addBtn = document.getElementById('addToCartBtn');
    const buyBtn = document.getElementById('buyNowBtn');

    if (selectedSize.stock <= 0) {
        stockEl.textContent = 'Out of Stock';
        stockEl.className = 'stock-status out-of-stock';
        addBtn.disabled = true;
        buyBtn.disabled = true;
    } else if (selectedSize.stock < 10) {
        stockEl.textContent = `Only ${ selectedSize.stock } left!`;
        stockEl.className = 'stock-status low-stock';
        addBtn.disabled = false;
        buyBtn.disabled = false;
    } else {
        stockEl.textContent = 'In Stock';
        stockEl.className = 'stock-status';
        addBtn.disabled = false;
        buyBtn.disabled = false;
    }
}

function changeQuantity(delta) {
    const qtyInput = document.getElementById('quantity');
    let newQty = quantity + delta;

    if (newQty < 1) newQty = 1;
    if (selectedSize && newQty > selectedSize.stock) newQty = selectedSize.stock;
    if (newQty > 999) newQty = 999;

    quantity = newQty;
    qtyInput.value = quantity;
}

function renderSpecifications(product) {
    const table = document.getElementById('specsTable');
    table.innerHTML = `
    < tr >
            <td>Category</td>
            <td>${product.category.charAt(0).toUpperCase() + product.category.slice(1)}</td>
        </tr >
        <tr>
            <td>Composition</td>
            <td>${product.composition}</td>
        </tr>
        <tr>
            <td>Available Sizes</td>
            <td>${product.sizes.map(s => s.size).join(', ')}</td>
        </tr>
        <tr>
            <td>Stock Status</td>
            <td>${product.inStock ? 'In Stock' : 'Out of Stock'}</td>
        </tr>
        ${
    product.rating ? `
        <tr>
            <td>Rating</td>
            <td>${product.rating}/5 (${product.reviewCount} reviews)</td>
        </tr>
        ` : ''
}
`;
}

function renderBenefits(benefits) {
    const list = document.getElementById('benefitsList');
    list.innerHTML = '';

    benefits.forEach(benefit => {
        const li = document.createElement('li');
        li.textContent = benefit;
        list.appendChild(li);
    });
}

function renderApplicationInfo(application) {
    const container = document.getElementById('applicationInfo');
    container.innerHTML = `
    < h4 > Application Guidelines</h4 >
        <p><strong>Method:</strong> ${application.method}</p>
        <p><strong>Dosage:</strong> ${application.dosage}</p>
        <p><strong>Frequency:</strong> ${application.frequency}</p>
`;
}

function renderImages(product) {
    // For now, show placeholder image
    const mainImage = document.getElementById('mainImage');
    mainImage.innerHTML = '<span class="image-placeholder">🌿</span>';
    
    // In future, you can add actual product images here
}

function switchTab(tabName) {
    // Update buttons
    const buttons = document.querySelectorAll('.tab-btn');
    buttons.forEach(btn => {
        btn.classList.toggle('active', btn.textContent.toLowerCase().includes(tabName));
    });

    // Update content
    const contents = document.querySelectorAll('.tab-content');
    contents.forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(`${ tabName } -tab`).classList.add('active');
}

function addToCart() {
    if (!currentProduct || !selectedSize) return;

    const cartItem = {
        productId: currentProduct.id,
        name: currentProduct.name,
        price: selectedSize.price,
        variant: selectedSize.size,
        quantity: quantity
    };

    // Get existing cart
    let cart = JSON.parse(localStorage.getItem('agro_guest_cart') || '[]');

    // Check if item already exists
    const existingIndex = cart.findIndex(item => 
        item.productId === cartItem.productId && item.variant === cartItem.variant
    );

    if (existingIndex > -1) {
        cart[existingIndex].quantity += quantity;
    } else {
        cart.push(cartItem);
    }

    // Save cart
    localStorage.setItem('agro_guest_cart', JSON.stringify(cart));

    // Show success message
    showToast(`${ currentProduct.name } added to cart!`, 'success');

    // Update cart count
    updateCartCount();
}

function buyNow() {
    addToCart();
    setTimeout(() => {
        window.location.href = 'cart.html';
    }, 500);
}

function showToast(message, type = 'info') {
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast toast - ${ type } show`;
    toast.textContent = message;
    toast.style.cssText = `
position: fixed;
bottom: 2rem;
right: 2rem;
background: ${ type === 'success' ? '#10b981' : '#4a7c2f' };
color: white;
padding: 1rem 2rem;
border - radius: 8px;
box - shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
z - index: 1000;
animation: slideIn 0.3s ease;
`;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem('agro_guest_cart') || '[]');
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    const badge = document.getElementById('cartBadge');
    if (badge) {
        badge.textContent = count;
    }
}

function showLoading() {
    document.getElementById('loading').style.display = 'flex';
    document.getElementById('product-container').style.display = 'none';
    document.getElementById('error').style.display = 'none';
}

function hideLoading() {
    document.getElementById('loading').style.display = 'none';
}

function showError() {
    document.getElementById('error').style.display = 'block';
    document.getElementById('loading').style.display = 'none';
    document.getElementById('product-container').style.display = 'none';
}

// Initialize cart count on load
updateCartCount();

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
@keyframes slideIn {
        from { transform: translateX(400px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
}
@keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(400px); opacity: 0; }
}
`;
document.head.appendChild(style);
