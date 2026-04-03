const API_URL = 'http://localhost:5000/api';
const accessToken = localStorage.getItem('accessToken');
let currentStatus = 'all';
let currentPage = 1;
let currentOrderId = null;

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    setTimeout(() => toast.classList.remove('show'), 3000);
}

function formatPrice(price) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(price);
}

function getStatusText(status) {
    const statusMap = {
        pending: 'Chờ thanh toán',
        paid: 'Đã thanh toán',
        shipped: 'Đang giao hàng',
        completed: 'Hoàn thành',
        cancelled: 'Đã hủy',
        refunded: 'Đã hoàn tiền'
    };
    return statusMap[status] || status;
}

// Tab navigation
document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        currentStatus = tab.dataset.status;
        currentPage = 1;
        loadOrders();
    });
});

async function loadOrders() {
    if (!accessToken) {
        window.location.href = 'loginbd.html/login.html';
        return;
    }

    try {
        const params = new URLSearchParams({
            page: currentPage,
            limit: 10
        });

        if (currentStatus !== 'all') {
            params.append('status', currentStatus);
        }

        const response = await fetch(`${API_URL}/orders/my?${params}`, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });

        if (!response.ok) throw new Error('Failed to load orders');

        const { data } = await response.json();
        renderOrders(data);
    } catch (error) {
        document.getElementById('ordersList').innerHTML = `
            <div class="empty-state">
                <h2>Không thể tải đơn hàng</h2>
                <p>${error.message}</p>
            </div>
        `;
    }
}

function renderOrders(orders) {
    const ordersList = document.getElementById('ordersList');

    if (orders.length === 0) {
        ordersList.innerHTML = `
            <div class="empty-state">
                <h2>Chưa có đơn hàng nào</h2>
                <p>Hãy bắt đầu mua sắm ngay!</p>
                <a href="product.html" class="btn btn-primary">Xem sản phẩm</a>
            </div>
        `;
        return;
    }

    ordersList.innerHTML = orders.map(order => `
        <div class="order-card">
            <div class="order-header">
                <div>
                    <div class="order-id">Mã đơn: ${order.id}</div>
                    <div style="font-size: 13px; color: #999; margin-top: 5px;">
                        ${new Date(order.createdAt).toLocaleString('vi-VN')}
                    </div>
                </div>
                <span class="order-status status-${order.status}">
                    ${getStatusText(order.status)}
                </span>
            </div>

            <div class="order-body">
                <div class="product-info">
                    <h3>${order.productName}</h3>
                    <p>Người bán: ${order.sellerUsername}</p>
                    <p>Số lượng: ${order.quantity}</p>
                </div>
                <div class="order-price">${formatPrice(order.totalAmount)}</div>
            </div>

            <div class="order-actions">
                <button class="btn btn-secondary" onclick="viewOrderDetail('${order.id}')">
                    Chi tiết
                </button>
                
                ${order.status === 'pending' || order.status === 'paid' ? `
                    <button class="btn btn-danger" onclick="cancelOrder('${order.id}')">
                        Hủy đơn
                    </button>
                ` : ''}
                
                ${order.status === 'shipped' ? `
                    <button class="btn btn-success" onclick="confirmDelivery('${order.id}')">
                        Đã nhận hàng
                    </button>
                    <button class="btn btn-danger" onclick="openDispute('${order.id}')">
                        Khiếu nại
                    </button>
                ` : ''}
                
                ${order.status === 'completed' ? `
                    <button class="btn btn-primary" onclick="writeReview('${order.id}', '${order.productId}')">
                        Đánh giá
                    </button>
                ` : ''}
            </div>
        </div>
    `).join('');
}

async function viewOrderDetail(orderId) {
    try {
        const response = await fetch(`${API_URL}/orders/${orderId}`, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });

        if (!response.ok) throw new Error('Failed to load order detail');

        const { data } = await response.json();
        showOrderDetail(data);
    } catch (error) {
        showToast('Không thể tải chi tiết đơn hàng', 'error');
    }
}

function showOrderDetail(order) {
    const modal = document.getElementById('orderModal');
    const detail = document.getElementById('orderDetail');

    detail.innerHTML = `
        <h2>Chi tiết đơn hàng</h2>
        
        <div class="detail-section">
            <h3>Thông tin đơn hàng</h3>
            <div class="detail-row">
                <span>Mã đơn:</span>
                <strong>${order.id}</span>
            </div>
            <div class="detail-row">
                <span>Trạng thái:</span>
                <span class="order-status status-${order.status}">${getStatusText(order.status)}</span>
            </div>
            <div class="detail-row">
                <span>Ngày đặt:</span>
                <span>${new Date(order.createdAt).toLocaleString('vi-VN')}</span>
            </div>
        </div>

        <div class="detail-section">
            <h3>Sản phẩm</h3>
            <div class="detail-row">
                <span>${order.product.name}</span>
                <strong>${formatPrice(order.unitPrice)}</strong>
            </div>
            <div class="detail-row">
                <span>Số lượng:</span>
                <span>${order.quantity}</span>
            </div>
            <div class="detail-row">
                <span>Tổng cộng:</span>
                <strong>${formatPrice(order.totalAmount)}</strong>
            </div>
        </div>

        <div class="detail-section">
            <h3>Địa chỉ giao hàng</h3>
            <p>${order.shippingAddress.fullName}</p>
            <p>${order.shippingAddress.phone}</p>
            <p>${order.shippingAddress.street}, ${order.shippingAddress.city}</p>
        </div>

        ${order.notes ? `
            <div class="detail-section">
                <h3>Ghi chú</h3>
                <p>${order.notes}</p>
            </div>
        ` : ''}

        ${order.escrow ? `
            <div class="detail-section">
                <h3>Trạng thái Escrow</h3>
                <div class="detail-row">
                    <span>Trạng thái:</span>
                    <span>${order.escrow.status}</span>
                </div>
                <div class="detail-row">
                    <span>Số tiền:</span>
                    <span>${formatPrice(order.escrow.amount)}</span>
                </div>
            </div>
        ` : ''}
    `;

    modal.classList.add('show');
}

function closeOrderModal() {
    document.getElementById('orderModal').classList.remove('show');
}

async function cancelOrder(orderId) {
    if (!confirm('Bạn có chắc muốn hủy đơn hàng này?')) return;

    const reason = prompt('Lý do hủy đơn:');
    if (!reason) return;

    try {
        const response = await fetch(`${API_URL}/orders/${orderId}/cancel`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify({ reason })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message);
        }

        showToast('Hủy đơn hàng thành công!');
        loadOrders();
    } catch (error) {
        showToast(error.message || 'Không thể hủy đơn hàng', 'error');
    }
}

async function confirmDelivery(orderId) {
    if (!confirm('Xác nhận bạn đã nhận được hàng?')) return;

    try {
        const response = await fetch(`${API_URL}/orders/${orderId}/confirm-delivery`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message);
        }

        showToast('Xác nhận nhận hàng thành công! Tiền đã được chuyển cho người bán.');
        loadOrders();
    } catch (error) {
        showToast(error.message || 'Không thể xác nhận nhận hàng', 'error');
    }
}

function openDispute(orderId) {
    currentOrderId = orderId;
    document.getElementById('disputeModal').classList.add('show');
}

function closeDisputeModal() {
    document.getElementById('disputeModal').classList.remove('show');
    currentOrderId = null;
}

document.getElementById('disputeForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const reason = document.getElementById('disputeReason').value;

    try {
        const response = await fetch(`${API_URL}/escrow/dispute`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify({ orderId: currentOrderId, reason })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message);
        }

        showToast('Gửi khiếu nại thành công! Admin sẽ xem xét.');
        closeDisputeModal();
        loadOrders();
    } catch (error) {
        showToast(error.message || 'Không thể gửi khiếu nại', 'error');
    }
});

function writeReview(orderId, productId) {
    window.location.href = `review.html?orderId=${orderId}&productId=${productId}`;
}

// Initialize
loadOrders();
