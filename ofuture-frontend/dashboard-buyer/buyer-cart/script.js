// ============================================================
// O'Future Buyer - Smart Cart Engine
// Tính toán Offline & Điều hướng Checkout
// ============================================================

let currentUser = null;
let CART_KEY = 'cart';
let cartItems = [];

// ── 1. Auth Guard & Khởi tạo ──────────────────────────────
function checkAuth() {
    const token = localStorage.getItem('accessToken');
    const userStr = localStorage.getItem('user');
    if (!token || !userStr) { window.location.href = '../../login.html'; return false; }

    currentUser = JSON.parse(userStr);
    if (currentUser.role !== 'buyer') { window.location.href = '../../login.html'; return false; }

    CART_KEY = `cart_${currentUser.id}`;
    document.getElementById('userAvatar').textContent = currentUser.fullName.charAt(0).toUpperCase();
    return true;
}

function showToast(message, isError = false) {
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText = `position:fixed; bottom:20px; right:20px; background:${isError ? '#ef4444' : '#10b981'}; color:white; padding:12px 24px; border-radius:8px; z-index:9999; font-weight: 500; box-shadow: 0 4px 12px rgba(0,0,0,0.1);`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2500);
}

// ── 2. Render Dữ liệu Giỏ hàng ────────────────────────────
function loadCart() {
    cartItems = JSON.parse(localStorage.getItem(CART_KEY)) || [];
    const container = document.getElementById('cartList');
    
    if (cartItems.length === 0) {
        container.innerHTML = `
            <div class="empty-cart">
                <h3 style="font-size: 20px;">Giỏ hàng của bạn đang trống</h3>
                <p>Hãy khám phá hàng ngàn sản phẩm sỉ với giá tốt nhất.</p>
                <a href="../buyer-products/index.html" class="btn btn-primary" style="display:inline-block; padding: 10px 24px;">Mua sắm ngay</a>
            </div>
        `;
        document.getElementById('checkoutBtn').disabled = true;
        updateSummary();
        updateCartBadge();
        return;
    }

    document.getElementById('checkoutBtn').disabled = false;
    
    container.innerHTML = cartItems.map((item, index) => {
        const priceStr = parseInt(item.price).toLocaleString('vi-VN');
        return `
            <div class="cart-item">
                <img src="${item.image || '../../images/image.png'}" alt="${item.name}" class="item-img">
                <div class="item-info">
                    <h3>${item.name}</h3>
                    <div class="seller-name">Cung cấp bởi: ID Shop ${item.sellerId || 'Ẩn danh'}</div>
                    <div class="price">${priceStr} đ</div>
                    <div style="font-size: 13px; color: #64748b; margin-top: 4px;">Tồn kho: ${item.stock}</div>
                </div>
                <div class="item-controls">
                    <div class="qty-control">
                        <button onclick="changeQty('${item.id}', -1)">-</button>
                        <input type="number" value="${item.quantity}" readonly>
                        <button onclick="changeQty('${item.id}', 1)">+</button>
                    </div>
                    <button class="btn-delete" onclick="removeItem('${item.id}')">Xóa sản phẩm</button>
                </div>
            </div>
        `;
    }).join('');

    updateSummary();
    updateCartBadge();
}

// ── 3. Các hàm tương tác Giỏ hàng ─────────────────────────
window.changeQty = function(id, delta) {
    const item = cartItems.find(i => i.id === id);
    if (!item) return;

    let newQty = item.quantity + delta;
    
    if (newQty < 1) newQty = 1;
    if (newQty > item.stock) {
        showToast(`Bạn chỉ có thể mua tối đa ${item.stock} sản phẩm này!`, true);
        newQty = item.stock;
    }

    item.quantity = newQty;
    localStorage.setItem(CART_KEY, JSON.stringify(cartItems));
    loadCart(); // Render lại
}

window.removeItem = function(id) {
    if(!confirm("Bạn có chắc chắn muốn xóa sản phẩm này khỏi giỏ?")) return;
    cartItems = cartItems.filter(i => i.id !== id);
    localStorage.setItem(CART_KEY, JSON.stringify(cartItems));
    loadCart();
    showToast("Đã xóa sản phẩm khỏi giỏ.");
}

function updateCartBadge() {
    const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    const badge = document.getElementById('cartBadge');
    if (badge) {
        badge.textContent = totalItems;
        badge.style.display = totalItems > 0 ? 'inline-block' : 'none';
    }
}

// ── 4. Thuật toán tính toán (Pricing Engine) ──────────────
function updateSummary() {
    // 1. Tính tổng tiền hàng (Subtotal)
    const subtotal = cartItems.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0);
    
    // 2. Tính phí nền tảng 2.5%
    const platformFee = subtotal * 0.025;
    
    // 3. Tính tổng thanh toán
    const total = subtotal + platformFee;

    // Cập nhật lên UI
    document.getElementById('subtotalPrice').textContent = subtotal.toLocaleString('vi-VN') + ' đ';
    document.getElementById('platformFee').textContent = platformFee.toLocaleString('vi-VN') + ' đ';
    document.getElementById('totalPrice').textContent = total.toLocaleString('vi-VN') + ' đ';
}

// ── 5. Điều hướng Thanh toán (Checkout) ───────────────────
window.proceedToCheckout = function() {
    if (cartItems.length === 0) {
        showToast("Giỏ hàng của bạn đang trống!", true);
        return;
    }
    // CHUẨN LUỒNG MỚI: Chỉ đơn giản là chuyển sang trang Checkout
    // Việc gọi API tạo đơn và kết nối MoMo sẽ thực hiện ở trang Checkout
    window.location.href = '../buyer-checkout/index.html';
}

// ── Khởi chạy ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    if (checkAuth()) {
        loadCart();
    }
});