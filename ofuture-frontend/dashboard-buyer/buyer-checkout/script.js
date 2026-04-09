// ============================================================
// O'Future Buyer - Checkout Engine (MoMo & VietQR Ký quỹ)
// ============================================================

const API_BASE_URL = window.CONFIG?.API_BASE_URL || 'http://localhost:5000/api';
let currentUser = null;
let CART_KEY = 'cart';
let cartItems = [];
let finalTotalAmount = 0;
let createdOrderIds = [];

// ── 1. Khởi tạo & Kiểm tra ────────────────────────────────
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
    setTimeout(() => toast.remove(), 3500);
}

// ── 2. Render Tóm tắt Đơn hàng ────────────────────────────
function loadCheckoutData() {
    cartItems = JSON.parse(localStorage.getItem(CART_KEY)) || [];
    
    if (cartItems.length === 0) {
        alert("Giỏ hàng của bạn đang trống! Đang quay lại giỏ hàng.");
        window.location.href = '../buyer-cart/index.html';
        return;
    }

    const itemsContainer = document.getElementById('orderItems');
    let subtotal = 0;

    itemsContainer.innerHTML = cartItems.map(item => {
        const itemTotal = item.price * item.quantity;
        subtotal += itemTotal;
        return `
            <div class="summary-item">
                <span class="summary-item-name">${item.quantity}x ${item.name}</span>
                <strong>${itemTotal.toLocaleString('vi-VN')} đ</strong>
            </div>
        `;
    }).join('');

    const platformFee = subtotal * 0.025;
    const shippingFee = 30000;
    finalTotalAmount = subtotal + platformFee + shippingFee;

    document.getElementById('subtotalPrice').textContent = subtotal.toLocaleString('vi-VN') + ' đ';
    document.getElementById('platformFee').textContent = platformFee.toLocaleString('vi-VN') + ' đ';
    document.getElementById('totalPrice').textContent = finalTotalAmount.toLocaleString('vi-VN') + ' đ';
    document.getElementById('qrTotalAmount').textContent = finalTotalAmount.toLocaleString('vi-VN') + ' đ';
}

// ── 3. Thuật toán Xử lý Đặt hàng & Thanh toán ─────────────
window.handlePlaceOrder = async function() {
    // A. Validate Địa chỉ (Backend E-commerce cần 4 trường này)
    const address = {
        street: document.getElementById('addressStreet').value.trim(),
        city: document.getElementById('addressCity').value.trim(),
        zip: document.getElementById('addressZip').value.trim(),
        country: document.getElementById('addressCountry').value.trim()
    };

    if (!address.street || !address.city || !address.zip) {
        return showToast("Vui lòng điền đầy đủ thông tin địa chỉ giao hàng!", true);
    }

    const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked').value;
    const btn = document.getElementById('placeOrderBtn');
    btn.disabled = true;
    btn.textContent = "Đang xử lý...";

    try {
        createdOrderIds = [];

        // B. Tạo Đơn hàng (Order) vào Backend cho TỪNG sản phẩm trong Giỏ
        // (Do validateCreateOrder yêu cầu truyền productId đơn lẻ)
        for (const item of cartItems) {
            const payload = {
                productId: item.id,
                quantity: item.quantity,
                shippingAddress: address
            };

            const response = await fetch(`${API_BASE_URL}/orders`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();
            if (response.ok && data.success) {
                createdOrderIds.push(data.data.orderId);
            } else {
                throw new Error(data.message || `Lỗi khi tạo đơn hàng cho SP: ${item.name}`);
            }
        }

        // C. Khởi tạo Giao dịch Thanh toán
        // Sử dụng ID của đơn hàng đầu tiên làm đại diện giao dịch (Theo thiết kế Backend hiện tại)
        const representativeOrderId = createdOrderIds[0];

        if (paymentMethod === 'momo') {
            await processMoMo(representativeOrderId, finalTotalAmount);
        } else if (paymentMethod === 'qr') {
            await processVietQR(representativeOrderId, finalTotalAmount);
        }

    } catch (error) {
        showToast(error.message, true);
        btn.disabled = false;
        btn.textContent = "Xác nhận Đặt hàng";
    }
}

// ── 4. Xử lý MoMo ─────────────────────────────────────────
async function processMoMo(orderId, amount) {
    const response = await fetch(`${API_BASE_URL}/payments/momo/create`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({ orderId, amount })
    });
    
    const data = await response.json();
    if (response.ok && data.success) {
        // Xóa giỏ hàng trước khi bay sang MoMo
        localStorage.removeItem(CART_KEY);
        // Chuyển hướng tới trang thanh toán của MoMo
        window.location.href = data.data.payUrl;
    } else {
        throw new Error(data.message || "Không thể tạo giao dịch MoMo");
    }
}

// ── 5. Xử lý VietQR (Ký quỹ Bán tự động) ──────────────────
async function processVietQR(orderId, amount) {
    const response = await fetch(`${API_BASE_URL}/payments/qr/create`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({ orderId, amount })
    });
    
    const data = await response.json();
    if (response.ok && data.success) {
        // Xóa giỏ hàng
        localStorage.removeItem(CART_KEY);
        
        // Hiện QR lên Modal
        const qrImg = data.data.qrCodeImage || data.data.qrCode;
        document.getElementById('qrCodeContainer').innerHTML = `<img src="${qrImg}" alt="Mã QR Ký quỹ" style="max-width: 100%; border-radius: 8px;">`;
        document.getElementById('qrModal').style.display = 'flex';
    } else {
        throw new Error(data.message || "Không thể tạo mã VietQR");
    }
}

// ── 6. Hành động trên Modal VietQR ────────────────────────
window.confirmTransfer = function() {
    // KHÔNG gọi API success ở đây. Chỉ báo cho User chờ Admin xác nhận.
    document.getElementById('qrModal').style.display = 'none';
    alert("Cảm ơn bạn! Đơn hàng đang ở trạng thái 'Chờ thanh toán'. Hệ thống sẽ cập nhật ngay khi Admin xác nhận được số tiền chuyển khoản.");
    window.location.href = '../buyer-orders/index.html';
}

window.cancelTransfer = function() {
    document.getElementById('qrModal').style.display = 'none';
    alert("Giao dịch đã được hủy. Đơn hàng của bạn sẽ ở trạng thái chờ thanh toán.");
    window.location.href = '../buyer-orders/index.html';
}

// ── Khởi chạy ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    if (checkAuth()) {
        loadCheckoutData();
    }
});