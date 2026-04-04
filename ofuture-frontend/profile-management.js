// ofuture-frontend/profile-management.js — FULL REPLACEMENT

const API_URL     = 'http://localhost:5000/api';
const accessToken = localStorage.getItem('accessToken');

// ── Navigation ────────────────────────────────────────────
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', e => {
        e.preventDefault();
        const section = e.currentTarget.dataset.section;
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
        e.currentTarget.classList.add('active');
        document.getElementById(`${section}-section`).classList.add('active');
    });
});

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className   = `toast ${type} show`;
    setTimeout(() => toast.classList.remove('show'), 3000);
}

// ── Load Profile — uses GET /api/auth/me (exists) ─────────
async function loadProfile() {
    try {
        // FIX: correct endpoint — GET /api/auth/me
        const res = await fetch(`${API_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!res.ok) throw new Error('Unauthorized');
        const { data } = await res.json();

        document.getElementById('email').value    = data.email     || '';
        document.getElementById('username').value = data.username  || '';
        document.getElementById('fullName').value = data.fullName  || '';
        document.getElementById('phone').value    = data.phone     || '';
        if (data.avatarUrl) document.getElementById('avatarPreview').src = data.avatarUrl;

        // MFA status
        const mfaStatus = document.getElementById('mfaStatus');
        const mfaBtn    = document.getElementById('mfaToggleBtn');
        if (data.mfaEnabled) {
            mfaStatus.textContent = '✓ MFA đã được bật';
            mfaBtn.textContent    = 'Tắt MFA';
            mfaBtn.onclick        = disableMFA;
        } else {
            mfaStatus.textContent = '✗ MFA chưa được bật';
            mfaBtn.textContent    = 'Bật MFA';
            mfaBtn.onclick        = enableMFA;
        }
    } catch {
        showToast('Không thể tải thông tin tài khoản', 'error');
    }
}

// ── Update Profile — FIX: No PUT /auth/me endpoint exists
// Use PATCH via a user-profile route if added, or advise user this is read-only
document.getElementById('profileForm').addEventListener('submit', async e => {
    e.preventDefault();
    // Note: Backend currently has no profile-update endpoint.
    // Recommended fix: add PUT /api/auth/profile in authRoutes.ts
    showToast('Tính năng cập nhật hồ sơ đang được phát triển.', 'error');
});

// ── MFA Setup — POST /api/mfa/setup (exists) ─────────────
async function enableMFA() {
    try {
        const res = await fetch(`${API_URL}/mfa/setup`, {
            method  : 'POST',
            headers : { Authorization: `Bearer ${accessToken}` },
        });
        if (!res.ok) throw new Error('Setup failed');
        const { data } = await res.json();

        document.getElementById('mfaSetup').style.display = 'block';
        document.getElementById('qrCode').innerHTML =
          `<img src="${data.qrCode}" alt="QR Code" style="max-width:200px"><br>
           <small>Manual key: ${data.secret}</small>`;
    } catch {
        showToast('Không thể thiết lập MFA', 'error');
    }
}

// ── Verify / Confirm MFA — POST /api/mfa/confirm (exists) ─
async function verifyMFA() {
    const code = document.getElementById('mfaCode').value;
    if (code.length < 6) { showToast('Mã xác thực phải có 6 chữ số', 'error'); return; }
    try {
        const res = await fetch(`${API_URL}/mfa/confirm`, {
            method  : 'POST',
            headers : { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
            body    : JSON.stringify({ code }),
        });
        if (!res.ok) throw new Error('Invalid code');
        showToast('Bật MFA thành công!');
        document.getElementById('mfaSetup').style.display = 'none';
        loadProfile();
    } catch { showToast('Mã xác thực không đúng', 'error'); }
}

// ── Disable MFA — POST /api/mfa/disable (exists) ─────────
async function disableMFA() {
    if (!confirm('Bạn có chắc muốn tắt MFA?')) return;
    const password = prompt('Nhập mật khẩu hiện tại:');
    const code     = prompt('Nhập mã TOTP 6 chữ số:');
    if (!password || !code) return;
    try {
        const res = await fetch(`${API_URL}/mfa/disable`, {
            method  : 'POST',
            headers : { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
            body    : JSON.stringify({ password, code }),
        });
        if (!res.ok) throw new Error('Failed');
        showToast('Tắt MFA thành công!');
        loadProfile();
    } catch { showToast('Không thể tắt MFA', 'error'); }
}

// ── Trusted Devices — FIX: No GET /mfa/devices endpoint exists
// Render placeholder until endpoint is created
function loadDevices() {
    document.getElementById('devicesList').innerHTML =
      '<p style="color:#64748b">Tính năng quản lý thiết bị đang được phát triển.</p>';
}

// ── Logout ────────────────────────────────────────────────
document.getElementById('logoutBtn')?.addEventListener('click', async () => {
    try {
        await fetch(`${API_URL}/auth/logout`, {
            method  : 'POST',
            headers : { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
            body    : JSON.stringify({ allDevices: false }),
        });
    } catch (e) {}
    localStorage.clear();
    window.location.href = 'login.html';
});

// ── Init ──────────────────────────────────────────────────
loadProfile();
loadDevices();