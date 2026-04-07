let currentOrderId = null;

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

function formatDate(dateString) {
    if (!dateString) return '';
    return new Date(dateString).toLocaleString('vi-VN', {
        hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric'
    });
}

function getStatusInfo(status) {
    const map = {
        pending: { text: 'Chờ thanh toán', class: 'pending' },
        paid: { text: 'Đã thanh toán (Ký quỹ)', class: 'paid' },
        shipped: { text: 'Đang giao hàng', class: 'shipped' },
        completed: { text: 'Hoàn tất', class: 'completed' },
        cancelled: { text: 'Đã hủy', class: 'cancelled' },
        refunded: { text: 'Đã hoàn tiền', class: 'refunded' }
    };
    return map[status] || { text: status, class: 'pending' };
}

// ── LOAD ORDER DETAIL ───────────────────────────────────────
async function loadOrderDetail() {
    const urlParams = new URLSearchParams(window.location.search);
    currentOrderId = urlParams.get('id');

    if (!currentOrderId) {
        showToast('Không tìm thấy mã đơn hàng.', 'error');
        setTimeout(() => window.location.href = '../buyer-orders/index.html', 1500);
        return;
    }

    try {
        const response = await fetchAPI(`/orders/${currentOrderId}`);
        const data = response.data;

        // 1. Map Dữ liệu Tiêu đề
        document.getElementById('orderIdDisplay').textContent = `#${data.id}`;
        const statusInfo = getStatusInfo(data.status);
        const badge = document.getElementById('orderStatusBadge');
        badge.textContent = statusInfo.text;
        badge.className = `badge badge-${statusInfo.class}`;

        // 2. Map Dữ liệu Sản phẩm
        document.getElementById('productName').textContent = data.product?.name || 'Sản phẩm không xác định';
        document.getElementById('sellerName').textContent = data.seller?.username || 'Nhà cung cấp';
        document.getElementById('unitPrice').textContent = formatCurrency(data.unitPrice || 0);
        document.getElementById('quantity').textContent = data.quantity || 0;

        // 3. Map Tóm tắt Thanh toán
        const total = data.totalAmount || 0;
        document.getElementById('subtotalAmount').textContent = formatCurrency(total);
        document.getElementById('totalAmount').textContent = formatCurrency(total);
        document.getElementById('escrowStatus').textContent = data.escrow?.status === 'Held' ? 'Hệ thống đang giữ tiền' : (data.escrow?.status || 'Chưa ký quỹ');
        
        if (data.notes) {
            document.getElementById('orderNotes').textContent = data.notes;
        }

        // 4. Build Timeline (Dựa trên status và timestamps)
        buildTimeline(data);

        // 5. Hiển thị nút Xác nhận nếu đang giao hàng
        if (data.status === 'shipped') {
            document.getElementById('actionContainer').style.display = 'block';
        }

    } catch (error) {
        showToast(error.message || 'Lỗi tải dữ liệu đơn hàng.', 'error');
    }
}

// ── BUILD TIMELINE LOGIC ────────────────────────────────────
function buildTimeline(data) {
    const timeline = document.getElementById('orderTimeline');
    const status = data.status;
    let html = '';

    // Step 1: Đã tạo đơn
    html += `
        <div class="timeline-step active">
            <div class="timeline-dot"></div>
            <h4>Đã tạo đơn hàng</h4>
            <div class="timeline-date">${formatDate(data.createdAt)}</div>
        </div>
    `;

    // Step 2: Đã ký quỹ
    const isPaid = ['paid', 'shipped', 'completed', 'refunded'].includes(status);
    html += `
        <div class="timeline-step ${isPaid ? 'active' : ''}">
            <div class="timeline-dot"></div>
            <h4>Đã thanh toán ký quỹ</h4>
            <div class="timeline-date">${isPaid ? 'Chờ xác nhận...' : 'Chưa thanh toán'}</div>
        </div>
    `;

    // Step 3: Đang giao hàng
    const isShipped = ['shipped', 'completed'].includes(status);
    html += `
        <div class="timeline-step ${isShipped ? 'active' : ''}">
            <div class="timeline-dot"></div>
            <h4>Đang giao hàng</h4>
            <div class="timeline-date">${isShipped ? 'Nhà cung cấp đã gửi hàng' : ''}</div>
        </div>
    `;

    // Step 4: Hoàn tất hoặc Hủy
    if (['cancelled', 'refunded'].includes(status)) {
        html += `
            <div class="timeline-step danger">
                <div class="timeline-dot"></div>
                <h4>Đơn hàng đã bị hủy / Hoàn tiền</h4>
                <div class="timeline-date">${formatDate(data.cancelledAt || data.updatedAt)}</div>
            </div>
        `;
    } else {
        const isCompleted = status === 'completed';
        html += `
            <div class="timeline-step ${isCompleted ? 'active' : ''}">
                <div class="timeline-dot"></div>
                <h4>Giao dịch hoàn tất</h4>
                <div class="timeline-date">${isCompleted ? formatDate(data.completedAt) : 'Tiền sẽ được nhả khi nhận hàng'}</div>
            </div>
        `;
    }

    timeline.innerHTML = html;
}

// ── ACTION LOGIC ────────────────────────────────────────────
async function confirmDelivery() {
    if (!confirm('Xác nhận bạn đã nhận đủ hàng? Tiền ký quỹ sẽ ngay lập tức chuyển cho người bán.')) return;

    const btn = document.getElementById('confirmBtn');
    btn.disabled = true;
    btn.textContent = 'Đang xử lý...';

    try {
        await fetchAPI(`/orders/${currentOrderId}/confirm-delivery`, { method: 'POST' });
        showToast('Xác nhận thành công! Đơn hàng đã hoàn tất.');
        setTimeout(() => window.location.reload(), 1500);
    } catch (error) {
        showToast(error.message || 'Lỗi xác nhận nhận hàng.', 'error');
        btn.disabled = false;
        btn.textContent = 'Xác nhận Đã nhận hàng';
    }
}

// ── INIT ────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', loadOrderDetail);