let cart = JSON.parse(localStorage.getItem('cart')) || [];

// ── UTILITIES ───────────────────────────────────────────────
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    setTimeout(() => toast.classList.remove('show'), 3000);
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

// ── RENDER CART ─────────────────────────────────────────────
function renderCart() {
    const cartList = document.getElementById('cartList');
    const checkoutBtn = document.getElementById('checkoutBtn');

    if (cart.length === 0) {
        cartList.innerHTML = `
            <div class="empty-state">
                <p class="muted">Giỏ hàng của bạn đang trống.</p>
                <a href="../buyer-products/index.html" class="btn btn-primary" style="margin-top:15px;">Đi mua sắm ngay</a>
            </div>
        `;
        if(checkoutBtn) checkoutBtn.disabled = true;
        updateSummary();
        return;
    }

    if(checkoutBtn) checkoutBtn.disabled = false;

    cartList.innerHTML = cart.map(item => `
        <div class="cart-item">
          <div style="display: flex; gap: 20px; align-items: center;">
            <img src="${item.img || 'https://picsum.photos/100/100'}" alt="${item.name}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 12px;">
            <div style="flex: 1;">
              <h3 style="font-size: 16px; margin-bottom: 4px;">${item.name}</h3>
              <p class="muted" style="font-size: 13px;">Nhà cung cấp: ${item.sellerName || 'Hệ thống'}</p>
              <div style="margin-top: 8px; font-weight: 700; color: var(--primary);">${formatCurrency(item.price)}</div>
            </div>
            <div style="display: flex; align-items: center; gap: 10px;">
              <button class="btn btn-outline" style="padding: 5px 10px;" onclick="updateQty('${item.id}', -1)">-</button>
              <input type="text" class="qty-input" value="${item.quantity}" readonly>
              <button class="btn btn-outline" style="padding: 5px 10px;" onclick="updateQty('${item.id}', 1)">+</button>
            </div>
            <div style="width: 120px; text-align: right; font-weight: 800;">
                ${formatCurrency(item.price * item.quantity)}
            </div>
            <button class="btn btn-outline" style="color: var(--danger); border: none;" onclick="removeItem('${item.id}')">✕</button>
          </div>
        </div>
    `).join('');

    updateSummary();
}

// ── CẬP NHẬT SỐ TIỀN ────────────────────────────────────────
function updateSummary() {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const platformFee = subtotal * 0.025; // 2.5% phí nền tảng theo logic cũ
    const total = subtotal + platformFee;

    document.getElementById('subtotal').textContent = formatCurrency(subtotal);
    document.getElementById('platformFee').textContent = formatCurrency(platformFee);
    document.getElementById('totalAmount').textContent = formatCurrency(total);
}

// ── THAY ĐỔI SỐ LƯỢNG ───────────────────────────────────────
window.updateQty = function(id, delta) {
    const index = cart.findIndex(i => i.id === id);
    if (index === -1) return;

    cart[index].quantity += delta;
    if (cart[index].quantity <= 0) {
        removeItem(id);
    } else {
        localStorage.setItem('cart', JSON.stringify(cart));
        renderCart();
    }
};

window.removeItem = function(id) {
    if(!confirm("Xóa sản phẩm này khỏi giỏ hàng?")) return;
    cart = cart.filter(i => i.id !== id);
    localStorage.setItem('cart', JSON.stringify(cart));
    renderCart();
};

// ── TIẾN HÀNH THANH TOÁN (LOGIC TÁCH ĐƠN SELLER) ────────────
window.proceedToCheckout = async function() {
    if (cart.length === 0) return;

    const btn = document.getElementById('checkoutBtn');
    btn.disabled = true;
    btn.textContent = "Đang tạo đơn hàng...";

    try {
        // Gom nhóm sản phẩm theo Seller (ID hoặc Username)
        const groups = {};
        cart.forEach(item => {
            const sellerKey = item.sellerId || 'default'; 
            if (!groups[sellerKey]) groups[sellerKey] = [];
            groups[sellerKey].push(item);
        });

        const orderIds = [];

        // Gọi API tạo đơn cho từng nhóm Seller
        for (const sellerId in groups) {
            const items = groups[sellerId];
            const response = await fetchAPI('/orders', {
                method: 'POST',
                body: JSON.stringify({
                    sellerId: sellerId === 'default' ? null : sellerId,
                    items: items.map(i => ({
                        product_id: i.id,
                        quantity: i.quantity,
                        price: i.price
                    })),
                    platformFeeRate: 0.025
                })
            });
            orderIds.push(response.data.orderId);
        }

        // Lưu thông tin để sang trang Checkout xử lý thanh toán/ký quỹ
        localStorage.setItem('currentOrderIds', JSON.stringify(orderIds));
        localStorage.setItem('checkoutCart', JSON.stringify(cart));
        
        showToast(`Đã tạo thành công ${orderIds.length} đơn hàng!`, 'success');

        // Chuyển sang trang thanh toán
        setTimeout(() => {
            window.location.href = `../buyer-checkout/index.html?orders=${orderIds.join(',')}`;
        }, 1000);

    } catch (error) {
        showToast(error.message || "Lỗi khi tạo đơn hàng", "error");
        btn.disabled = false;
        btn.textContent = "Tiến hành thanh toán";
    }
};

// ── INITIALIZE ──────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', renderCart);