// ofuture-frontend/dashboard-seller/script.js
// Complete rewrite of data-loading section only — structure unchanged

let currentUser = null;
let allProducts = [];
let allOrders   = [];
let allEscrow   = [];
let allReviews  = [];
let allSamples  = [];
let allDisputes = [];

// ============================================================
// Authentication & Initialization
// ============================================================

async function initializeDashboard() {
    const token = localStorage.getItem('accessToken');
    const user  = localStorage.getItem('user');

    if (!token || !user) {
        window.location.href = '../loginbd.html/login.html';
        return;
    }

    try {
        currentUser = JSON.parse(user);

        if (currentUser.role !== 'seller') {
            alert('Only sellers can access this dashboard.');
            window.location.href = '../index.html';
            return;
        }

        const usernameEl = document.getElementById('username');
        if (usernameEl) usernameEl.textContent = currentUser.full_name || currentUser.username;

        await loadDashboardData();
        setupEventListeners();

    } catch (error) {
        console.error('Dashboard init error:', error);
        localStorage.clear();
        window.location.href = '../loginbd.html/login.html';
    }
}

// ============================================================
// Data Loading — ALL use seller-scoped endpoints
// sellerId is read from JWT server-side (NOT sent as query param)
// ============================================================

async function loadDashboardData() {
    // Show loading state
    showSectionLoading(true);
    try {
        await Promise.all([
            loadProducts(),
            loadOrders(),
            loadEscrow(),
            loadReviews(),
            loadSamples(),
            loadDisputes(),
        ]);
        updateDashboardStats();
    } catch (error) {
        console.error('Dashboard data error:', error);
        showGlobalError('Failed to load dashboard data. Please refresh the page.');
    } finally {
        showSectionLoading(false);
    }
}

// FIX: Use /api/products with seller's own listings (public route, no auth needed but filtered by sellerId)
// Since seller is authenticated, we use the seller route for consistency
async function loadProducts() {
    const tbody = document.getElementById('productsTableBody');
    if (tbody) tbody.innerHTML = '<tr><td colspan="5" class="text-center">Loading...</td></tr>';
    try {
        // Public route accepts sellerId query param for listing — safe because it only reads
        const response = await fetchAPI(`/products?sellerId=${currentUser.id}&limit=100`);
        allProducts = response.data || [];
        renderProductsTable();
    } catch (error) {
        const tbody = document.getElementById('productsTableBody');
        if (tbody) tbody.innerHTML = `<tr><td colspan="5" class="text-center" style="color:red;">
            Failed to load products: ${error.message}
        </td></tr>`;
    }
}

// FIX: was /orders?sellerId=... (adminOnly) → now /seller/orders
async function loadOrders() {
    const tbody = document.getElementById('ordersTableBody');
    if (tbody) tbody.innerHTML = '<tr><td colspan="6" class="text-center">Loading...</td></tr>';
    try {
        const response = await fetchAPI('/seller/orders');
        allOrders = response.data || [];
        renderOrdersTable();
    } catch (error) {
        const tbody = document.getElementById('ordersTableBody');
        if (tbody) tbody.innerHTML = `<tr><td colspan="6" class="text-center" style="color:red;">
            Failed to load orders: ${error.message}
        </td></tr>`;
    }
}

// FIX: was /escrow?sellerId=... (no such route) → now /seller/escrow
async function loadEscrow() {
    const tbody = document.getElementById('escrowTableBody');
    if (tbody) tbody.innerHTML = '<tr><td colspan="6" class="text-center">Loading...</td></tr>';
    try {
        const response = await fetchAPI('/seller/escrow');
        allEscrow = response.data || [];
        renderEscrowTable();
    } catch (error) {
        const tbody = document.getElementById('escrowTableBody');
        if (tbody) tbody.innerHTML = `<tr><td colspan="6" class="text-center" style="color:red;">
            Failed to load escrow: ${error.message}
        </td></tr>`;
    }
}

// FIX: was /reviews?sellerId=... (no such route) → now /seller/reviews
async function loadReviews() {
    const container = document.getElementById('reviewsContainer');
    if (container) container.innerHTML = '<p class="text-center">Loading...</p>';
    try {
        const response = await fetchAPI('/seller/reviews');
        allReviews = response.data || [];
        renderReviews();
    } catch (error) {
        const container = document.getElementById('reviewsContainer');
        if (container) container.innerHTML = `<p class="text-center" style="color:red;">
            Failed to load reviews: ${error.message}
        </p>`;
    }
}

// FIX: was /samples?sellerId=... (wrong path) → now /seller/samples
async function loadSamples() {
    const tbody = document.getElementById('samplesTableBody');
    if (tbody) tbody.innerHTML = '<tr><td colspan="6" class="text-center">Loading...</td></tr>';
    try {
        const response = await fetchAPI('/seller/samples');
        allSamples = response.data || [];
        renderSamplesTable();
    } catch (error) {
        const tbody = document.getElementById('samplesTableBody');
        if (tbody) tbody.innerHTML = `<tr><td colspan="6" class="text-center" style="color:red;">
            Failed to load samples: ${error.message}
        </td></tr>`;
    }
}

// FIX: was /disputes?sellerId=... (no such route) → now /seller/disputes
async function loadDisputes() {
    const tbody = document.getElementById('disputesTableBody');
    if (tbody) tbody.innerHTML = '<tr><td colspan="6" class="text-center">Loading...</td></tr>';
    try {
        const response = await fetchAPI('/seller/disputes');
        allDisputes = response.data || [];
        renderDisputesTable();
    } catch (error) {
        const tbody = document.getElementById('disputesTableBody');
        if (tbody) tbody.innerHTML = `<tr><td colspan="6" class="text-center" style="color:red;">
            Failed to load disputes: ${error.message}
        </td></tr>`;
    }
}

// ============================================================
// Rendering Functions (unchanged logic, added null guards)
// ============================================================

function renderProductsTable() {
    const tbody = document.getElementById('productsTableBody');
    if (!tbody) return;

    if (!allProducts.length) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center">No products yet. Click "Add New Product" to start.</td></tr>';
        return;
    }

    tbody.innerHTML = allProducts.map(p => `
        <tr>
            <td>
                <strong>${escapeHtml(p.name)}</strong><br>
                <small style="color:#64748b;">${escapeHtml(p.category || 'General')}</small>
            </td>
            <td>$${parseFloat(p.price).toFixed(2)}</td>
            <td>${p.stockQuantity ?? p.stock_quantity ?? 0}</td>
            <td>
                <span class="badge ${p.status === 'active' ? 'badge-success' : 'badge-warning'}">
                    ${p.status || 'active'}
                </span>
            </td>
            <td>
                <button class="btn btn-small btn-danger" onclick="deleteProduct('${p.id}')">Delete</button>
            </td>
        </tr>
    `).join('');
    ensureBadgeStyles();
}

function renderOrdersTable() {
    const tbody = document.getElementById('ordersTableBody');
    if (!tbody) return;

    if (!allOrders.length) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">No orders yet.</td></tr>';
        return;
    }

    tbody.innerHTML = allOrders.map(order => `
        <tr>
            <td>${order.id?.substring(0, 8).toUpperCase() || 'N/A'}</td>
            <td>${escapeHtml(order.buyer_username || order.buyerUsername || 'Buyer')}</td>
            <td>${escapeHtml(order.product_name   || order.productName   || 'Product')}</td>
            <td>$${parseFloat(order.total_amount  || order.totalAmount  || 0).toFixed(2)}</td>
            <td>
                <span class="badge ${getStatusBadgeClass(order.status)}">
                    ${order.status}
                </span>
            </td>
            <td>
                ${order.status === 'paid'
                    ? `<button class="btn btn-small btn-success" onclick="markShipped('${order.id}')">Mark Shipped</button>`
                    : '—'}
            </td>
        </tr>
    `).join('');
}

function renderEscrowTable() {
    const tbody = document.getElementById('escrowTableBody');
    if (!tbody) return;

    if (!allEscrow.length) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">No escrow transactions yet.</td></tr>';
        return;
    }

    tbody.innerHTML = allEscrow.map(e => {
        const gross      = parseFloat(e.amount       || 0);
        const fee        = parseFloat(e.platform_fee || 0);
        const net        = parseFloat(e.net_amount   || gross - fee);

        return `
        <tr>
            <td>${(e.order_id || '').substring(0, 8).toUpperCase()}</td>
            <td>$${gross.toFixed(2)}</td>
            <td style="color:#ef4444;">-$${fee.toFixed(2)}</td>
            <td style="font-weight:600;color:#10b981;">$${net.toFixed(2)}</td>
            <td>
                <span class="badge ${getStatusBadgeClass(e.status)}">${e.status}</span>
            </td>
            <td>${e.released_at ? new Date(e.released_at).toLocaleDateString() : '—'}</td>
        </tr>`;
    }).join('');

    // Update escrow summary cards
    const totalHeld     = allEscrow
        .filter(e => e.status === 'held' || e.status === 'processing')
        .reduce((sum, e) => sum + parseFloat(e.net_amount || 0), 0);
    const totalReleased = allEscrow
        .filter(e => e.status === 'released')
        .reduce((sum, e) => sum + parseFloat(e.net_amount || 0), 0);

    const heldEl     = document.getElementById('totalHeld');
    const releasedEl = document.getElementById('totalReleased');
    if (heldEl)     heldEl.textContent     = `$${totalHeld.toFixed(2)}`;
    if (releasedEl) releasedEl.textContent = `$${totalReleased.toFixed(2)}`;
}

function renderSamplesTable() {
    const tbody = document.getElementById('samplesTableBody');
    if (!tbody) return;

    if (!allSamples.length) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">No sample requests yet.</td></tr>';
        return;
    }

    tbody.innerHTML = allSamples.map(s => `
        <tr>
            <td>${(s.id || '').substring(0, 8).toUpperCase()}</td>
            <td>${escapeHtml(s.buyer_name  || 'Buyer')}</td>
            <td>${escapeHtml(s.product_name || 'Product')}</td>
            <td>$${parseFloat(s.deposit_amount || 0).toFixed(2)}</td>
            <td>
                <span class="badge ${getStatusBadgeClass(s.status)}">${s.status}</span>
            </td>
            <td>
                ${s.status === 'requested'
                    ? `<button class="btn btn-small btn-primary"
                              onclick="approveSample('${s.id}')">Approve</button>`
                    : '—'}
            </td>
        </tr>
    `).join('');
}

function renderDisputesTable() {
    const tbody = document.getElementById('disputesTableBody');
    if (!tbody) return;

    if (!allDisputes.length) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">No disputes filed against your orders.</td></tr>';
        return;
    }

    tbody.innerHTML = allDisputes.map(d => `
        <tr>
            <td>${(d.id || '').substring(0, 8).toUpperCase()}</td>
            <td>${(d.order_id || '').substring(0, 8).toUpperCase()}</td>
            <td>${escapeHtml(d.complainant_username || 'Buyer')}</td>
            <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;"
                title="${escapeHtml(d.reason || '')}">
                ${escapeHtml(d.reason || '')}
            </td>
            <td>
                <span class="badge ${getStatusBadgeClass(d.status)}">${d.status}</span>
            </td>
            <td>
                ${d.status === 'pending'
                    ? `<span style="color:#f97316;font-size:13px;">Admin reviewing…</span>`
                    : '—'}
            </td>
        </tr>
    `).join('');
}

function renderReviews() {
    const container = document.getElementById('reviewsContainer');
    if (!container) return;

    if (!allReviews.length) {
        container.innerHTML = '<p class="text-center" style="color:#64748b;">No reviews yet.</p>';
        return;
    }

    container.innerHTML = allReviews.map(r => `
        <div class="review-card">
            <div class="review-rating">${'⭐'.repeat(r.rating || 0)}</div>
            <div class="review-product">
                <strong>${escapeHtml(r.product_name || 'Product')}</strong>
                <small style="color:#64748b;"> — ${escapeHtml(r.buyer_username || 'Buyer')}</small>
            </div>
            <div class="review-comment">"${escapeHtml(r.body || r.title || 'No comment')}"</div>
            <div style="font-size:12px;color:#94a3b8;margin-top:8px;">
                ${new Date(r.created_at).toLocaleDateString()}
            </div>
        </div>
    `).join('');
}

function updateDashboardStats() {
    const setEl = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };

    setEl('totalProducts', allProducts.length);
    setEl('totalOrders',   allOrders.length);

    const netHeld = allEscrow
        .filter(e => e.status === 'held' || e.status === 'processing')
        .reduce((sum, e) => sum + parseFloat(e.net_amount || 0), 0);
    setEl('totalEscrow', `$${netHeld.toFixed(2)}`);

    const avgRating = allReviews.length
        ? (allReviews.reduce((s, r) => s + (r.rating || 0), 0) / allReviews.length).toFixed(1)
        : '—';
    setEl('avgRating', avgRating + (allReviews.length ? ' ⭐' : ''));
}

// ============================================================
// Action Functions
// ============================================================

// FIX: Product creation uses FormData — backend now has multer middleware
async function addProduct(e) {
    e.preventDefault();

    const name        = document.getElementById('productName').value.trim();
    const category    = document.getElementById('productCategory').value;
    const description = document.getElementById('productDesc').value.trim();
    const price       = document.getElementById('productPrice').value;
    const stock       = document.getElementById('productStock').value;
    const imageInput  = document.getElementById('productImages');

    if (!name || !category || !price || stock < 0) {
        alert('Please fill in all required fields (Name, Category, Price, Stock).');
        return;
    }

    const formData = new FormData();
    formData.append('name',          name);
    formData.append('category',      category);
    formData.append('description',   description);
    formData.append('price',         price);
    formData.append('stockQuantity', stock);

    if (imageInput.files && imageInput.files.length > 0) {
        Array.from(imageInput.files).slice(0, 5).forEach(file => {
            formData.append('images', file);  // key must match uploadImages.array('images', 5)
        });
    }

    try {
        const submitBtn = document.querySelector('#productForm button[type="submit"]');
        if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Saving...'; }

        // fetchAPI in api.js detects FormData and does NOT set Content-Type
        // (lets browser set multipart/form-data with boundary automatically)
        await fetchAPI('/products', { method: 'POST', body: formData });

        alert('Product added successfully!');
        closeProductForm();
        await loadProducts();

    } catch (error) {
        alert(`Failed to add product: ${error.message}`);
    } finally {
        const submitBtn = document.querySelector('#productForm button[type="submit"]');
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Save Product'; }
    }
}

async function deleteProduct(productId) {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
        await fetchAPI(`/products/${productId}`, { method: 'DELETE' });
        alert('Product deleted.');
        await loadProducts();
    } catch (error) {
        alert(`Failed to delete product: ${error.message}`);
    }
}

// FIX: was PATCH /orders/:id/status → correct is POST /orders/:id/ship
async function markShipped(orderId) {
    if (!confirm('Confirm this order has been shipped?')) return;
    try {
        await fetchAPI(`/orders/${orderId}/ship`, {
            method: 'POST',
            body  : JSON.stringify({ trackingNumber: '', carrier: '' }),
        });
        alert('Order marked as shipped!');
        await loadOrders();
    } catch (error) {
        alert(`Failed to update order: ${error.message}`);
    }
}

// Approve sample request (update status → 'approved')
async function approveSample(sampleId) {
    if (!confirm('Approve this sample request?')) return;
    try {
        await fetchAPI(`/samples/${sampleId}/status`, {
            method: 'PUT',
            body  : JSON.stringify({ status: 'approved' }),
        });
        alert('Sample request approved!');
        await loadSamples();
    } catch (error) {
        alert(`Failed to approve sample: ${error.message}`);
    }
}

// ============================================================
// Helpers
// ============================================================

function getStatusBadgeClass(status) {
    const map = {
        pending   : 'badge-warning',
        processing: 'badge-info',
        paid      : 'badge-info',
        shipped   : 'badge-info',
        completed : 'badge-success',
        cancelled : 'badge-danger',
        held      : 'badge-warning',
        releasing : 'badge-info',
        released  : 'badge-success',
        disputed  : 'badge-danger',
        resolved_refunded : 'badge-danger',
        resolved_released : 'badge-success',
        rejected  : 'badge-secondary',
        requested : 'badge-warning',
        approved  : 'badge-success',
        active    : 'badge-success',
        inactive  : 'badge-warning',
    };
    return map[status] || 'badge-secondary';
}

// XSS prevention for rendered HTML
function escapeHtml(str) {
    if (str == null) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function showSectionLoading(loading) {
    // Update dashboard stat cards to show loading state
    ['totalProducts','totalOrders','totalEscrow','avgRating'].forEach(id => {
        const el = document.getElementById(id);
        if (el && loading) el.textContent = '…';
    });
}

function showGlobalError(message) {
    console.error(message);
    // Could add a toast notification here
}

function ensureBadgeStyles() {
    if (document.getElementById('badge-styles')) return;
    const style = document.createElement('style');
    style.id = 'badge-styles';
    style.textContent = `
        .badge{display:inline-block;padding:4px 10px;border-radius:20px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.3px}
        .badge-success{background:#d1fae5;color:#065f46}
        .badge-warning{background:#fed7aa;color:#92400e}
        .badge-danger{background:#fee2e2;color:#991b1b}
        .badge-info{background:#dbeafe;color:#1e40af}
        .badge-secondary{background:#e5e7eb;color:#374151}
    `;
    document.head.appendChild(style);
}

function closeProductForm() {
    const panel = document.getElementById('addProductForm');
    if (panel) panel.style.display = 'none';
    const form  = document.getElementById('productForm');
    if (form)  form.reset();
}

// ============================================================
// Event Listeners & Navigation
// ============================================================

function setupEventListeners() {
    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', e => {
            e.preventDefault();
            const section = item.getAttribute('data-section');
            showSection(section, item);
        });
    });

    const addBtn = document.getElementById('addProductBtn');
    if (addBtn) addBtn.addEventListener('click', () => {
        document.getElementById('addProductForm').style.display = 'flex';
    });

    const prodForm = document.getElementById('productForm');
    if (prodForm) prodForm.addEventListener('submit', addProduct);

    const overlay = document.getElementById('addProductForm');
    if (overlay) overlay.addEventListener('click', e => {
        if (e.target.id === 'addProductForm') closeProductForm();
    });

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) logoutBtn.addEventListener('click', async () => {
        try { await fetchAPI('/auth/logout', { method: 'POST', body: JSON.stringify({ allDevices: false }) }); }
        catch (e) {}
        localStorage.clear();
        window.location.href = '../loginbd.html/login.html';
    });
}

function showSection(name, menuItem) {
    document.querySelectorAll('.menu-item').forEach(i => i.classList.remove('active'));
    menuItem.classList.add('active');
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    const section = document.getElementById(`${name}-section`);
    if (section) section.classList.add('active');

    const titles = {
        dashboard : 'Dashboard',
        products  : 'My Products',
        orders    : 'Orders',
        escrow    : 'Escrow Tracking',
        samples   : 'Sample Requests',
        disputes  : 'Disputes',
        reviews   : 'Reviews',
    };
    const titleEl = document.getElementById('pageTitle');
    if (titleEl) titleEl.textContent = titles[name] || 'Dashboard';
}

document.addEventListener('DOMContentLoaded', initializeDashboard);