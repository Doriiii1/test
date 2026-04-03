// ============================================================
// O'Future Seller Dashboard - JavaScript (Optimized & Cleaned)
// LƯU Ý: Không tự định nghĩa fetchAPI, sử dụng từ ../api.js
// ============================================================

// Store data
let currentUser = null;
let allProducts = [];
let allOrders = [];
let allEscrow = [];
let allReviews = [];
// BỔ SUNG: Chứa dữ liệu Hàng mẫu và Tranh chấp
let allSamples = []; 
let allDisputes = [];

// ============================================================
// Authentication & Initialization
// ============================================================

async function initializeDashboard() {
    const token = localStorage.getItem('accessToken');
    const user = localStorage.getItem('user');

    if (!token || !user) {
        window.location.href = '../loginbd.html/login.html';
        return;
    }

    try {
        currentUser = JSON.parse(user);

        if (currentUser.role !== 'seller') {
            alert('Chỉ người bán (Seller) mới có quyền truy cập trang này!');
            window.location.href = '../index.html';
            return;
        }

        const usernameEl = document.getElementById('username');
        if(usernameEl) usernameEl.textContent = currentUser.full_name || currentUser.username;

        await loadDashboardData();
        setupEventListeners();

    } catch (error) {
        console.error('Error initializing dashboard:', error);
        alert('Lỗi phiên đăng nhập. Vui lòng đăng nhập lại.');
        window.location.href = '../loginbd.html/login.html';
    }
}

// ============================================================
// Data Loading Functions
// ============================================================

async function loadDashboardData() {
    try {
        // Tải toàn bộ dữ liệu song song để tối ưu tốc độ
        await Promise.all([
            loadProducts(),
            loadOrders(),
            loadEscrow(),
            loadReviews(),
            loadSamples(),   // Gọi hàm tải Hàng mẫu mới
            loadDisputes()   // Gọi hàm tải Tranh chấp mới
        ]);
        updateDashboardStats();
    } catch (error) {
        console.error('Lỗi tải dữ liệu Dashboard: ', error);
        alert('Lỗi khi tải dữ liệu từ máy chủ!');
    }
}

async function loadProducts() {
    try {
        const response = await fetchAPI(`/products?sellerId=${currentUser.id}`);
        allProducts = response.data || response || [];
        renderProductsTable();
    } catch (error) {
        const tbody = document.getElementById('productsTableBody');
        if(tbody) tbody.innerHTML = '<tr><td colspan="5" class="text-center" style="color:red;">Lỗi tải sản phẩm</td></tr>';
    }
}

async function loadOrders() {
    try {
        const response = await fetchAPI(`/orders?sellerId=${currentUser.id}`);
        allOrders = response.data || response || [];
        renderOrdersTable();
    } catch (error) {
        const tbody = document.getElementById('ordersTableBody');
        if(tbody) tbody.innerHTML = '<tr><td colspan="6" class="text-center" style="color:red;">Lỗi tải đơn hàng</td></tr>';
    }
}

async function loadEscrow() {
    try {
        const response = await fetchAPI(`/escrow?sellerId=${currentUser.id}`);
        allEscrow = response.data || response || [];
        renderEscrowTable();
    } catch (error) {
        const tbody = document.getElementById('escrowTableBody');
        if(tbody) tbody.innerHTML = '<tr><td colspan="6" class="text-center" style="color:red;">Lỗi tải giao dịch ký quỹ</td></tr>';
    }
}

async function loadReviews() {
    try {
        const response = await fetchAPI(`/reviews?sellerId=${currentUser.id}`);
        allReviews = response.data || response || [];
        renderReviews();
    } catch (error) {
        const container = document.getElementById('reviewsContainer');
        if(container) container.innerHTML = '<p class="text-center" style="color:red;">Lỗi tải đánh giá</p>';
    }
}

// BỔ SUNG: Hàm tải dữ liệu Hàng mẫu
async function loadSamples() {
    try {
        const response = await fetchAPI(`/samples?sellerId=${currentUser.id}`);
        allSamples = response.data || response || [];
        renderSamplesTable();
    } catch (error) {
        const tbody = document.getElementById('samplesTableBody');
        if(tbody) tbody.innerHTML = '<tr><td colspan="6" class="text-center" style="color:red;">Lỗi tải yêu cầu hàng mẫu</td></tr>';
    }
}

// BỔ SUNG: Hàm tải dữ liệu Tranh chấp
async function loadDisputes() {
    try {
        const response = await fetchAPI(`/disputes?sellerId=${currentUser.id}`);
        allDisputes = response.data || response || [];
        renderDisputesTable();
    } catch (error) {
        const tbody = document.getElementById('disputesTableBody');
        if(tbody) tbody.innerHTML = '<tr><td colspan="6" class="text-center" style="color:red;">Lỗi tải dữ liệu tranh chấp</td></tr>';
    }
}

// ============================================================
// Rendering Functions
// ============================================================

function renderProductsTable() {
    const tbody = document.getElementById('productsTableBody');
    if (!tbody) return;

    if (allProducts.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center">Chưa có sản phẩm nào</td></tr>';
        return;
    }

    tbody.innerHTML = allProducts.map(product => `
        <tr>
            <td>
                <strong>${product.name}</strong><br>
                <small style="color: #64748b;">${product.category || 'General'}</small>
            </td>
            <td>$${parseFloat(product.price).toFixed(2)}</td>
            <td>${product.stock_quantity || 0}</td>
            <td>
                <span class="badge ${product.status === 'active' ? 'badge-success' : 'badge-warning'}">
                    ${product.status || 'active'}
                </span>
            </td>
            <td>
                <button class="btn btn-small btn-secondary" onclick="alert('Tính năng sửa đang phát triển')">Sửa</button>
                <button class="btn btn-small btn-danger" onclick="deleteProduct('${product.id}')">Xóa</button>
            </td>
        </tr>
    `).join('');
    addBadgeStyles();
}

function renderOrdersTable() {
    const tbody = document.getElementById('ordersTableBody');
    if (!tbody) return;

    if (allOrders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">Chưa có đơn hàng nào</td></tr>';
        return;
    }

    tbody.innerHTML = allOrders.map(order => `
        <tr>
            <td>${order.id?.substring(0, 8).toUpperCase() || 'N/A'}</td>
            <td>${order.buyer?.username || 'Khách hàng'}</td>
            <td>${order.product?.name || 'Sản phẩm'}</td>
            <td>$${parseFloat(order.total_amount).toFixed(2)}</td>
            <td>
                <span class="badge ${getStatusBadgeClass(order.status)}">
                    ${order.status}
                </span>
            </td>
            <td>
                ${(order.status === 'paid' || order.status === 'processing') 
                    ? `<button class="btn btn-small btn-success" onclick="confirmShipping('${order.id}')">Giao Hàng</button>` 
                    : '-'}
            </td>
        </tr>
    `).join('');
}

function renderEscrowTable() {
    const tbody = document.getElementById('escrowTableBody');
    if (!tbody) return;

    if (allEscrow.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">Chưa có giao dịch ký quỹ nào</td></tr>';
        return;
    }

    // BỔ SUNG: Xử lý tính toán Fee và Net Amount minh bạch
    tbody.innerHTML = allEscrow.map(escrow => {
        const grossAmount = parseFloat(escrow.amount) || 0;
        const platformFeePercent = 0.05; // Giả sử phí nền tảng 5%
        const feeAmount = grossAmount * platformFeePercent;
        const netAmount = grossAmount - feeAmount;

        return `
        <tr>
            <td>${escrow.order_id?.substring(0, 8).toUpperCase() || 'N/A'}</td>
            <td>$${grossAmount.toFixed(2)}</td>
            <td style="color: #ef4444;">-$${feeAmount.toFixed(2)} (5%)</td>
            <td style="font-weight: 600; color: #10b981;">$${netAmount.toFixed(2)}</td>
            <td>
                <span class="badge ${getStatusBadgeClass(escrow.status)}">
                    ${escrow.status}
                </span>
            </td>
            <td>${escrow.released_at ? new Date(escrow.released_at).toLocaleDateString() : '-'}</td>
        </tr>
    `}).join('');
}

// BỔ SUNG: Render bảng Hàng mẫu
function renderSamplesTable() {
    const tbody = document.getElementById('samplesTableBody');
    if (!tbody) return;

    if (allSamples.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">Không có yêu cầu hàng mẫu nào</td></tr>';
        return;
    }

    tbody.innerHTML = allSamples.map(sample => `
        <tr>
            <td>${sample.id?.substring(0, 8).toUpperCase() || 'N/A'}</td>
            <td>${sample.buyer?.username || 'Buyer'}</td>
            <td>${sample.product?.name || 'Sản phẩm'}</td>
            <td>$${parseFloat(sample.deposit_amount).toFixed(2)}</td>
            <td>
                <span class="badge ${getStatusBadgeClass(sample.status)}">
                    ${sample.status}
                </span>
            </td>
            <td>
                ${sample.status === 'pending' 
                    ? `<button class="btn btn-small btn-primary" onclick="alert('Đã duyệt gửi hàng mẫu')">Duyệt</button>` 
                    : '-'}
            </td>
        </tr>
    `).join('');
}

// BỔ SUNG: Render bảng Tranh chấp
function renderDisputesTable() {
    const tbody = document.getElementById('disputesTableBody');
    if (!tbody) return;

    if (allDisputes.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">Không có tranh chấp nào</td></tr>';
        return;
    }

    tbody.innerHTML = allDisputes.map(dispute => `
        <tr>
            <td>${dispute.id?.substring(0, 8).toUpperCase() || 'N/A'}</td>
            <td>${dispute.order_id?.substring(0, 8).toUpperCase() || 'N/A'}</td>
            <td>${dispute.buyer?.username || 'Buyer'}</td>
            <td>${dispute.reason || 'Hàng lỗi'}</td>
            <td>
                <span class="badge ${getStatusBadgeClass(dispute.status)}">
                    ${dispute.status}
                </span>
            </td>
            <td>
                <button class="btn btn-small btn-secondary" onclick="alert('Đang mở hội thoại với Buyer')">Thỏa thuận</button>
            </td>
        </tr>
    `).join('');
}

function renderReviews() {
    const container = document.getElementById('reviewsContainer');
    if (!container) return;

    if (allReviews.length === 0) {
        container.innerHTML = '<p class="text-center">Chưa có đánh giá nào</p>';
        return;
    }

    container.innerHTML = allReviews.map(review => `
        <div class="review-card">
            <div class="review-rating">${'⭐'.repeat(review.rating || 0)}</div>
            <div class="review-product"><strong>${review.product?.name || 'Sản phẩm'}</strong></div>
            <div class="review-comment">"${review.body || 'Không có bình luận'}"</div>
        </div>
    `).join('');
}

function updateDashboardStats() {
    const totalProdEl = document.getElementById('totalProducts');
    const totalOrdEl = document.getElementById('totalOrders');
    if(totalProdEl) totalProdEl.textContent = allProducts.length;
    if(totalOrdEl) totalOrdEl.textContent = allOrders.length;

    // Tính toán lại tổng tiền sau khi trừ 5% phí
    const totalGrossHeld = allEscrow.reduce((sum, e) => sum + ((e.status === 'held' || e.status === 'processing') ? parseFloat(e.amount || 0) : 0), 0);
    const totalGrossReleased = allEscrow.reduce((sum, e) => sum + (e.status === 'released' ? parseFloat(e.amount || 0) : 0), 0);

    const netHeld = totalGrossHeld * 0.95;
    const netReleased = totalGrossReleased * 0.95;

    const totalEscrowEl = document.getElementById('totalEscrow');
    const totalHeldEl = document.getElementById('totalHeld');
    const totalRelEl = document.getElementById('totalReleased');
    
    // Hiển thị số tiền thực nhận (Net)
    if(totalEscrowEl) totalEscrowEl.textContent = '$' + netHeld.toFixed(2);
    if(totalHeldEl) totalHeldEl.textContent = '$' + netHeld.toFixed(2);
    if(totalRelEl) totalRelEl.textContent = '$' + netReleased.toFixed(2);

    const avgRating = allReviews.length > 0
        ? (allReviews.reduce((sum, r) => sum + (r.rating || 0), 0) / allReviews.length).toFixed(1)
        : '0';
    const avgRatingEl = document.getElementById('avgRating');
    if(avgRatingEl) avgRatingEl.textContent = avgRating + ' ⭐';
}

// ============================================================
// Action Functions
// ============================================================

async function addProduct(e) {
    e.preventDefault();

    const name = document.getElementById('productName').value;
    const category = document.getElementById('productCategory').value;
    const description = document.getElementById('productDesc').value;
    const price = document.getElementById('productPrice').value;
    const stock = document.getElementById('productStock').value;
    const imageInput = document.getElementById('productImages');

    if (!name || !category || !price || stock < 0) {
        alert('Vui lòng điền đầy đủ thông tin bắt buộc (Tên, Danh mục, Giá, Tồn kho)');
        return;
    }

    try {
        // 1. Dùng FormData thay vì JSON.stringify để chở được File vật lý
        const formData = new FormData();
        formData.append('name', name);
        formData.append('category', category);
        formData.append('description', description);
        formData.append('price', price);
        formData.append('stockQuantity', stock);

        // 2. Nhồi các file ảnh vào FormData (Giới hạn 5 ảnh)
        if (imageInput.files && imageInput.files.length > 0) {
            const files = Array.from(imageInput.files).slice(0, 5);
            files.forEach(file => {
                // Tên key 'images' phải khớp chính xác với uploadImages.array('images', 5) ở Backend
                formData.append('images', file); 
            });
        }

        // 3. Bắn thẳng FormData lên API
        await fetchAPI('/products', {
            method: 'POST',
            body: formData 
        });

        alert('Thêm sản phẩm thành công!');
        closeProductForm();
        await loadProducts();
    } catch (error) {
        alert('Lỗi thêm sản phẩm: ' + error.message);
    }
}

async function deleteProduct(productId) {
    if (!confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) return;
    try {
        await fetchAPI(`/products/${productId}`, { method: 'DELETE' });
        alert('Xóa sản phẩm thành công!');
        await loadProducts();
    } catch (error) {
        alert('Lỗi xóa sản phẩm: ' + error.message);
    }
}

async function confirmShipping(orderId) {
    if (!confirm('Xác nhận đã gửi hàng cho đơn này?')) return;
    try {
        await fetchAPI(`/orders/${orderId}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status: 'shipped' }),
        });
        alert('Cập nhật trạng thái đơn hàng thành "Đang giao" thành công!');
        await loadOrders();
    } catch (error) {
        alert('Lỗi cập nhật: ' + error.message);
    }
}

// ============================================================
// Helper & Event Listeners
// ============================================================

function getStatusBadgeClass(status) {
    const classes = {
        pending: 'badge-warning',
        processing: 'badge-info',
        paid: 'badge-info',
        shipped: 'badge-info',
        completed: 'badge-success',
        cancelled: 'badge-danger',
        held: 'badge-warning',
        released: 'badge-success',
        disputed: 'badge-danger',
        resolved: 'badge-success'
    };
    return classes[status] || 'badge-secondary';
}

function addBadgeStyles() {
    if (!document.getElementById('badge-styles')) {
        const style = document.createElement('style');
        style.id = 'badge-styles';
        style.textContent = `
            .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase; }
            .badge-success { background-color: #d1fae5; color: #065f46; }
            .badge-warning { background-color: #fed7aa; color: #92400e; }
            .badge-danger { background-color: #fee2e2; color: #991b1b; }
            .badge-info { background-color: #dbeafe; color: #0c2d6b; }
            .badge-secondary { background-color: #e5e7eb; color: #374151; }
        `;
        document.head.appendChild(style);
    }
}

function closeProductForm() {
    const formPanel = document.getElementById('addProductForm');
    if(formPanel) formPanel.style.display = 'none';
    const formEl = document.getElementById('productForm');
    if(formEl) formEl.reset();
}

function setupEventListeners() {
    // Xử lý chuyển tab Menu
    const menuItems = document.querySelectorAll('.menu-item');
    menuItems.forEach((item) => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const section = item.getAttribute('data-section');
            showSection(section, item);
        });
    });

    const addBtn = document.getElementById('addProductBtn');
    if(addBtn) addBtn.addEventListener('click', () => { document.getElementById('addProductForm').style.display = 'flex'; });
    
    const prodForm = document.getElementById('productForm');
    if(prodForm) prodForm.addEventListener('submit', addProduct);

    const formPanel = document.getElementById('addProductForm');
    if(formPanel) formPanel.addEventListener('click', (e) => { if (e.target.id === 'addProductForm') closeProductForm(); });

    const logoutBtn = document.getElementById('logoutBtn');
    if(logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            try { await fetchAPI('/auth/logout', { method: 'POST' }); } catch(e){}
            localStorage.clear();
            window.location.href = '../loginbd.html/login.html';
        });
    }
}

function showSection(sectionName, menuItem) {
    document.querySelectorAll('.menu-item').forEach(i => i.classList.remove('active'));
    menuItem.classList.add('active');
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    const section = document.getElementById(`${sectionName}-section`);
    if (section) section.classList.add('active');

    // Bổ sung Title cho 2 trang mới
    const titles = {
        dashboard: 'Dashboard',
        products: 'Products',
        orders: 'Orders',
        escrow: 'Escrow Tracking',
        samples: 'Sample Requests',
        disputes: 'Disputes Management',
        reviews: 'Reviews',
    };
    const titleEl = document.getElementById('pageTitle');
    if(titleEl) titleEl.textContent = titles[sectionName] || 'Dashboard';
}

document.addEventListener('DOMContentLoaded', initializeDashboard);