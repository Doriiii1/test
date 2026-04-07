let cart = JSON.parse(localStorage.getItem('checkoutCart')) || [];
let currentOrderIds = [];
let currentPaymentId = null;
let totalAmountToPay = 0;

// Lấy orderIds từ URL
const urlParams = new URLSearchParams(window.location.search);
const ordersParam = urlParams.get('orders');
if (ordersParam) {
    currentOrderIds = ordersParam.split(',');
}

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

// ── LOAD USER DATA ──────────────────────────────────────────
async function loadUserInfo() {
    try {
        const res = await fetchAPI('/auth/me');
        document.getElementById('buyerName').value = res.data.fullName || 'Chưa cập nhật';
        document.getElementById('buyerPhone').value = res.data.phone || 'Chưa cập nhật';
        document.getElementById('buyerEmail').value = res.data.email || 'Chưa cập nhật';
    } catch (e) {
        console.warn("Không thể tải thông tin người dùng.");
    }
}

// ── RENDER SUMMARY ──────────────────────────────────────────
function renderSummary() {
    const orderItemsList = document.getElementById('orderItemsList');
    
    if (cart.length === 0 || currentOrderIds.length === 0) {
        orderItemsList.innerHTML = '<p class="muted">Không có dữ liệu đơn hàng để thanh toán.</p>';
        document.getElementById('checkoutBtn').disabled = true;
        return;
    }

    // Render danh sách sản phẩm (chỉ để xem lại)
    orderItemsList.innerHTML = cart.map(item => `
        <div class="checkout-item">
            <img src="${item.img || 'https://picsum.photos/100/100'}" alt="product">
            <div style="flex: 1;">
                <h4 style="font-size: 15px; margin-bottom: 4px;">${item.name}</h4>
                <div class="muted" style="font-size: 12px;">SL: ${item.quantity} | Cung cấp bởi: ${item.sellerName || 'Hệ thống'}</div>
            </div>
            <div style="font-weight: 700; color: var(--primary);">
                ${formatCurrency(item.price * item.quantity)}
            </div>
        </div>
    `).join('');

    // Tính toán tiền
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const platformFee = subtotal * 0.025; // 2.5% phí nền tảng
    totalAmountToPay = subtotal + platformFee;

    document.getElementById('subtotal').textContent = formatCurrency(subtotal);
    document.getElementById('platformFee').textContent = formatCurrency(platformFee);
    document.getElementById('totalAmount').textContent = formatCurrency(totalAmountToPay);
}

// ── PROCESS PAYMENT (GENERATE QR) ───────────────────────────
async function processPayment() {
    if (currentOrderIds.length === 0) return showToast("Lỗi: Không tìm thấy mã đơn hàng.", "error");

    const btn = document.getElementById('checkoutBtn');
    btn.disabled = true;
    btn.textContent = "Đang kết nối cổng thanh toán...";

    try {
        // Dùng Order ID đầu tiên đại diện cho phiên thanh toán (theo logic cũ)
        const orderId = currentOrderIds[0]; 
        
        // Gọi API tạo mã QR từ Backend
        const response = await fetchAPI('/payments/qr', {
            method: 'POST',
            body: JSON.stringify({ orderId: orderId, amount: totalAmountToPay })
        });

        currentPaymentId = response.data.paymentId;
        const qrImageBase64 = response.data.qrCodeImage || response.data.qrCode;

        // Mở Modal và hiển thị QR
        const qrContainer = document.getElementById('qrCodeContainer');
        qrContainer.innerHTML = `<img src="${qrImageBase64}" alt="QR Code MoMo">`;
        document.getElementById('qrModal').style.display = 'block';
        document.getElementById('modalOverlay').style.display = 'block';

    } catch (error) {
        showToast(error.message || "Không thể tạo mã thanh toán", "error");
    } finally {
        btn.disabled = false;
        btn.textContent = "Thanh toán Ký quỹ (Tạo QR)";
    }
}

// ── CONFIRM PAYMENT ─────────────────────────────────────────
async function confirmQRPayment() {
    if (!currentPaymentId) return;

    try {
        // Gửi xác nhận cho backend xử lý cập nhật trạng thái đơn (Paid -> Escrow)
        await fetchAPI(`/payments/qr/${currentPaymentId}/status`, {
            method: 'PUT',
            body: JSON.stringify({ success: true })
        });

        closeQRModal();
        showToast('Thanh toán thành công! Hệ thống đã ghi nhận.');
        
        // Xóa giỏ hàng tạm sau khi thanh toán xong
        localStorage.removeItem('checkoutCart');
        localStorage.removeItem('currentOrderIds');
        localStorage.removeItem('cart'); // Xóa luôn giỏ hàng chính

        // Chuyển hướng sang trang theo dõi đơn hàng sau 1.5s
        setTimeout(() => {
            window.location.href = '../buyer-orders/index.html';
        }, 1500);

    } catch (error) {
        showToast(error.message || 'Xác nhận thanh toán thất bại', 'error');
    }
}

function closeQRModal() {
    document.getElementById('qrModal').style.display = 'none';
    document.getElementById('modalOverlay').style.display = 'none';
}

// ── INIT ────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    loadUserInfo();
    renderSummary();
});