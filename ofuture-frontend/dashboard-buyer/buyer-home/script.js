// ── UTILITIES ───────────────────────────────────────────────
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    setTimeout(() => toast.classList.remove('show'), 3000);
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
}

// ── LOAD DASHBOARD DATA ─────────────────────────────────────
async function loadDashboard() {
    try {
        // 1. Tải thông tin cá nhân
        const userRes = await fetchAPI('/auth/me');
        document.getElementById('welcomeName').textContent = userRes.data.fullName || userRes.data.username;

        // 2. Tải Thống kê Ký quỹ (API cũ: /escrow/stats)
        const statsRes = await fetchAPI('/escrow/stats');
        const stats = statsRes.data;
        document.getElementById('statTotalSpent').textContent = formatCurrency(stats.totalSpent);
        document.getElementById('statActiveOrders').textContent = stats.activeOrdersCount || 0;
        document.getElementById('statEscrowHeld').textContent = formatCurrency(stats.escrowHeldAmount);

        // 3. Tải Sản phẩm Nổi bật (API: /products?limit=3)
        const prodRes = await fetchAPI('/products?limit=3');
        const products = prodRes.data;
        const prodContainer = document.getElementById('featuredProducts');
        
        prodContainer.innerHTML = products.map(p => `
            <div class="featured-item">
                <img src="${p.imageUrls?.[0] ? CONFIG.BASE_URL + p.imageUrls[0] : 'https://picsum.photos/100/100'}" alt="prod">
                <div class="info">
                    <div style="font-weight:600; font-size:14px;">${p.name}</div>
                    <div class="muted" style="font-size:12px;">SL tối thiểu: ${p.moq || 1}</div>
                </div>
                <div class="price">${formatCurrency(p.price)}</div>
            </div>
        `).join('');

        // 4. Tải Đơn hàng Gần đây (API: /orders/my?limit=5)
        const orderRes = await fetchAPI('/orders/my?limit=5');
        const orders = orderRes.data;
        const orderTable = document.getElementById('recentOrdersTable');

        if (!orders || orders.length === 0) {
            orderTable.innerHTML = '<tr><td colspan="3" class="muted" style="text-align:center;">Chưa có đơn hàng nào.</td></tr>';
        } else {
            const statusMap = { pending: 'warning', paid: 'info', shipped: 'info', completed: 'success' };
            const statusText = { pending: 'Chờ thanh toán', paid: 'Đã ký quỹ', shipped: 'Đang giao', completed: 'Hoàn tất' };

            orderTable.innerHTML = orders.map(o => `
                <tr>
                    <td><a href="../buyer-order-detail/index.html?id=${o.id}" style="font-weight:600;">#${o.id.substring(0, 8)}</a></td>
                    <td><span class="badge badge-${statusMap[o.status] || 'warning'}">${statusText[o.status] || o.status}</span></td>
                    <td>${formatCurrency(o.total_amount)}</td>
                </tr>
            `).join('');
        }

    } catch (error) {
        showToast("Lỗi tải dữ liệu dashboard: " + error.message, "error");
    }
}

// ── INITIALIZE ──────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', loadDashboard);