let currentStatus = 'all';
let currentOrderId = null;

// ── UTILITIES ───────────────────────────────────────────────
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    setTimeout(() => toast.classList.remove('show'), 3000);
}

function getStatusText(status) {
    const statusMap = {
        pending: 'Chờ thanh toán',
        paid: 'Đã ký quỹ',
        shipped: 'Đang giao',
        completed: 'Hoàn tất',
        cancelled: 'Đã hủy',
        refunded: 'Đã hoàn tiền'
    };
    return statusMap[status] || status;
}

// ── LOAD ORDERS FROM API ────────────────────────────────────
async function loadOrders() {
    const tbody = document.getElementById('orderTableBody');
    const search = document.getElementById('orderSearch').value;

    try {
        // Gọi API với query params trạng thái
        const url = `/orders?status=${currentStatus === 'all' ? '' : currentStatus}&search=${search}`;
        const response = await fetchAPI(url);
        const orders = response.data;

        if (!orders || orders.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:40px;">Bạn chưa có đơn hàng nào.</td></tr>';
            return;
        }

        tbody.innerHTML = orders.map(order => `
            <tr>
                <td><strong>#${order.id}</strong></td>
                <td>${new Date(order.created_at).toLocaleDateString('vi-VN')}</td>
                <td>${order.seller_name || 'Nhà cung cấp'}</td>
                <td>${new Intl.NumberFormat('vi-VN').format(order.total_amount)}đ</td>
                <td><span class="badge badge-${order.status}">${getStatusText(order.status)}</span></td>
                <td>
                    <div style="display:flex; gap:8px;">
                        <a href="../buyer-order-detail/index.html?id=${order.id}" class="btn btn-outline" style="padding:6px 12px; font-size:13px;">Chi tiết</a>
                        ${order.status === 'shipped' ? `
                            <button onclick="confirmDelivery(${order.id})" class="btn btn-primary" style="padding:6px 12px; font-size:13px;">Đã nhận hàng</button>
                            <button onclick="openDisputeModal(${order.id})" class="btn btn-outline" style="padding:6px 12px; font-size:13px; color:var(--danger);">Khiếu nại</button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `).join('');

    } catch (error) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:var(--danger);">Lỗi: ${error.message}</td></tr>`;
    }
}

// ── XỬ LÝ XÁC NHẬN NHẬN HÀNG ────────────────────────────────
async function confirmDelivery(orderId) {
    if (!confirm('Xác nhận bạn đã nhận được hàng? Tiền ký quỹ sẽ được chuyển cho người bán.')) return;

    try {
        await fetchAPI(`/orders/${orderId}/confirm-delivery`, { method: 'POST' });
        showToast('Xác nhận thành công! Cảm ơn bạn đã mua hàng.');
        loadOrders();
    } catch (error) {
        showToast(error.message || 'Không thể xác nhận nhận hàng', 'error');
    }
}

// ── XỬ LÝ KHIẾU NẠI (DISPUTE) ───────────────────────────────
function openDisputeModal(orderId) {
    currentOrderId = orderId;
    document.getElementById('disputeReason').value = '';
    document.getElementById('disputeModal').style.display = 'block';
    document.getElementById('modalOverlay').style.display = 'block';
}

function closeDisputeModal() {
    document.getElementById('disputeModal').style.display = 'none';
    document.getElementById('modalOverlay').style.display = 'none';
}

async function submitDispute() {
    const reason = document.getElementById('disputeReason').value.trim();
    if (reason.length < 10) return showToast('Lý do khiếu nại quá ngắn (tối thiểu 10 ký tự)', 'error');

    try {
        await fetchAPI('/escrow/dispute', {
            method: 'POST',
            body: JSON.stringify({ orderId: currentOrderId, reason })
        });
        showToast('Đã gửi khiếu nại. Admin sẽ liên hệ với bạn sớm nhất.');
        closeDisputeModal();
        loadOrders();
    } catch (error) {
        showToast(error.message || 'Lỗi khi gửi khiếu nại', 'error');
    }
}

// ── LISTENERS ───────────────────────────────────────────────
document.getElementById('statusFilter').addEventListener('change', (e) => {
    currentStatus = e.target.value;
    loadOrders();
});

document.getElementById('orderSearch').addEventListener('input', loadOrders);
document.getElementById('modalOverlay').addEventListener('click', closeDisputeModal);

// ── INITIALIZE ──────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', loadOrders);