// ============================================================
// O'Future Admin Dashboard - Core Logic (Optimized for BE/DB)
// ============================================================

let allUsers = [];
let allLogs = [];

// ── 1. KHỞI TẠO HỆ THỐNG ─────────────────────────────────────
async function initializeDashboard() {
    const token = localStorage.getItem('accessToken');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    // Kiểm tra quyền Admin ngay tại đầu phễu
    if (!token || user.role !== 'admin') {
        alert('Bạn không có quyền truy cập! Đang chuyển hướng về trang Login.');
        window.location.href = '../loginbd.html/login.html';
        return;
    }

    document.getElementById('username').textContent = user.username || 'Admin';
    
    setupEventListeners();
    await loadDashboardData();
}

// ── 2. KẾT NỐI API & TẢI DỮ LIỆU ──────────────────────────────
async function loadDashboardData() {
    try {
        // Tải song song để tăng tốc độ hiển thị
        await Promise.all([
            loadStats(),
            loadUsers(),
            loadLogs()
        ]);
    } catch (error) {
        console.error('Lỗi kết nối Backend:', error);
    }
}

// Lấy số liệu tổng quát từ API /admin/stats
async function loadStats() {
    try {
        const res = await fetchAPI('/admin/stats');
        const stats = res.data || {};
        
        document.getElementById('totalUsers').textContent = stats.totalUsers || 0;
        document.getElementById('totalSellers').textContent = stats.totalSellers || 0;
        document.getElementById('totalTransactions').textContent = stats.totalOrders || 0;
        document.getElementById('totalEscrowBalance').textContent = '$' + (stats.totalEscrowHeld || 0).toLocaleString();
    } catch (err) {
        console.warn('Không thể tải thống kê stats');
    }
}

// Lấy danh sách User từ API /admin/users
async function loadUsers() {
    try {
        const res = await fetchAPI('/admin/users');
        allUsers = res.data || [];
        renderUsersTable();
    } catch (err) {
        document.getElementById('usersTableBody').innerHTML = '<tr><td colspan="7" class="text-center" style="color:red;">Lỗi tải dữ liệu người dùng</td></tr>';
    }
}

// Lấy Nhật ký hoạt động từ API /admin/logs
async function loadLogs() {
    try {
        const res = await fetchAPI('/admin/logs');
        allLogs = res.data || [];
        renderLogsTable();
    } catch (err) {
        // ĐÃ SỬA: Đổi id thành systemLogsTableBody
        const tbody = document.getElementById('systemLogsTableBody');
        if (tbody) tbody.innerHTML = '<tr><td colspan="7" class="text-center">Lỗi tải nhật ký hệ thống</td></tr>';
    }
}

// ── 3. HIỂN THỊ DỮ LIỆU (RENDERING) ──────────────────────────
function renderUsersTable(data = allUsers) {
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;

    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">Chưa có người dùng nào</td></tr>';
        return;
    }

    tbody.innerHTML = data.map(u => {
        // Map chuẩn với cột is_active trong Database
        const activeStatus = u.is_active === 1 || u.is_active === true;
        
        return `
        <tr>
            <td>${u.email}</td>
            <td>${u.username}</td>
            <td>${u.full_name || '-'}</td>
            <td><span class="badge ${u.role === 'admin' ? 'badge-admin' : 'badge-info'}">${u.role.toUpperCase()}</span></td>
            <td>
                <span class="badge ${activeStatus ? 'badge-success' : 'badge-danger'}">
                    ${activeStatus ? 'Hoạt động' : 'Bị khóa'}
                </span>
            </td>
            <td>${new Date(u.created_at).toLocaleDateString()}</td>
            <td>
                <button class="btn btn-small ${activeStatus ? 'btn-danger' : 'btn-success'}" 
                        onclick="handleSuspendUser('${u.id}', ${activeStatus})">
                    ${activeStatus ? 'Khóa' : 'Mở khóa'}
                </button>
            </td>
        </tr>
    `}).join('');
}

function renderLogsTable() {
    // ĐÃ SỬA: Đổi id thành systemLogsTableBody
    const tbody = document.getElementById('systemLogsTableBody');
    if (!tbody) return;

    if (allLogs.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">Không có nhật ký nào</td></tr>';
        return;
    }

    tbody.innerHTML = allLogs.map(log => `
        <tr>
            <td class="text-muted">${new Date(log.created_at).toLocaleString()}</td>
            <td><span class="badge badge-info">${log.severity || 'info'}</span></td>
            <td>${log.event_type || '-'}</td>
            <td title="${log.message}">${log.message?.substring(0, 50)}...</td>
            <td>${log.user_id || 'System'}</td>
            <td>${log.ip_address || '-'}</td>
            <td>${log.endpoint || '-'}</td>
        </tr>
    `).join('');
}

// ── 4. THỰC THI HÀNH ĐỘNG (ACTIONS) ──────────────────────────
// Khớp với route PUT /admin/users/:id/suspend
async function handleSuspendUser(userId, currentIsActive) {
    const actionText = currentIsActive ? 'Khóa' : 'Mở khóa';
    const reason = prompt(`Lý do ${actionText} người dùng này:`);
    
    if (currentIsActive && !reason) {
        alert('Phải có lý do khi khóa tài khoản!');
        return;
    }

    try {
        await fetchAPI(`/admin/users/${userId}/suspend`, {
            method: 'PUT',
            body: JSON.stringify({ 
                suspend: currentIsActive, // Nếu đang active (true) thì gửi suspend = true
                reason: reason || 'Thay đổi bởi Admin' 
            })
        });
        alert(`Đã ${actionText} tài khoản thành công.`);
        await loadUsers(); // Refresh lại bảng
    } catch (error) {
        alert('Lỗi thực hiện: ' + error.message);
    }
}

// ── 5. ĐIỀU HƯỚNG & SỰ KIỆN ──────────────────────────────────
function setupEventListeners() {
    // Chuyển Tab Menu
    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const section = item.getAttribute('data-section');
            
            // Cập nhật UI Menu
            document.querySelectorAll('.menu-item').forEach(i => i.classList.remove('active'));
            item.classList.add('active');

            // Cập nhật Section hiển thị
            document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
            document.getElementById(`${section}-section`).classList.add('active');
            
            // Cập nhật Tiêu đề trang
            document.getElementById('pageTitle').textContent = item.textContent.trim();
        });
    });

    // Tìm kiếm User theo Email/Username
    const searchInput = document.getElementById('userSearch');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            const filtered = allUsers.filter(u => 
                u.username.toLowerCase().includes(term) || u.email.toLowerCase().includes(term)
            );
            renderUsersTable(filtered);
        });
    }

    // Đăng xuất
    document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.clear();
        window.location.href = '../loginbd.html/login.html';
    });
}

// Chạy ứng dụng
document.addEventListener('DOMContentLoaded', initializeDashboard);