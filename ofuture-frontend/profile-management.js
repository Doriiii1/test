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
        // Dùng fetchAPI chuẩn, không cần header hay parse json thủ công
        const response = await fetchAPI('/auth/me');
        const data = response.data;

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
    } catch (error) {
        console.error(error);
        showToast('Không thể tải thông tin tài khoản', 'error');
    }
}

// ── Update Profile — FIX: Submit to correct PUT /auth/profile endpoint
document.getElementById('profileForm').addEventListener('submit', async e => {
    e.preventDefault();
    const fullName = document.getElementById('fullName').value;
    const phone = document.getElementById('phone').value;
    
    try {
        const res = await fetchAPI('/auth/profile', {
            method: 'PUT',
            body: JSON.stringify({ fullName, phone })
        });
        showToast(res.message || 'Cập nhật hồ sơ thành công!', 'success');
        loadProfile(); // Refresh visual data
    } catch(err) {
        showToast(err.message || 'Cập nhật thất bại', 'error');
    }
});

// ── MFA Setup — POST /api/mfa/setup (exists) ─────────────
async function enableMFA() {
    try {
        const response = await fetchAPI('/mfa/setup', {
            method  : 'POST'
        });
        const data = response.data;

        document.getElementById('mfaSetup').style.display = 'block';
        document.getElementById('qrCode').innerHTML =
          `<img src="${data.qrCode}" alt="QR Code" style="max-width:200px"><br>
           <small>Manual key: ${data.secret}</small>`;
    } catch (error) {
        showToast(error.message || 'Không thể thiết lập MFA', 'error');
    }
}

// ── Verify / Confirm MFA — POST /api/mfa/confirm (exists) ─
async function verifyMFA() {
    const code = document.getElementById('mfaCode').value;
    if (code.length < 6) { showToast('Mã xác thực phải có 6 chữ số', 'error'); return; }
    try {
        await fetchAPI('/mfa/confirm', {
            method  : 'POST',
            body    : JSON.stringify({ code }),
        });
        showToast('Bật MFA thành công!');
        document.getElementById('mfaSetup').style.display = 'none';
        loadProfile();
    } catch (error) { 
        showToast(error.message || 'Mã xác thực không đúng', 'error'); 
    }
}

// ── Disable MFA — POST /api/mfa/disable (exists) ─────────
async function disableMFA() {
    if (!confirm('Bạn có chắc muốn tắt MFA?')) return;
    const password = prompt('Nhập mật khẩu hiện tại:');
    const code     = prompt('Nhập mã TOTP 6 chữ số:');
    if (!password || !code) return;
    try {
        await fetchAPI('/mfa/disable', {
            method  : 'POST',
            body    : JSON.stringify({ password, code }),
        });
        showToast('Tắt MFA thành công!');
        loadProfile();
    } catch (error) { 
        showToast(error.message || 'Không thể tắt MFA', 'error'); 
    }
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
        await fetchAPI('/auth/logout', {
            method  : 'POST',
            body    : JSON.stringify({ allDevices: false }),
        });
    } catch (e) {
        console.error('Logout error:', e);
    }
    localStorage.clear();
    window.location.href = 'login.html';
});

// ── Init ──────────────────────────────────────────────────
loadProfile();
loadDevices();