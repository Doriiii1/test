// ── UTILITIES ───────────────────────────────────────────────
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    setTimeout(() => toast.classList.remove('show'), 3000);
}

// ── SLIDER UX LOGIC ─────────────────────────────────────────
window.switchPanel = function(panel) {
    const wrapper = document.getElementById('sliderWrapper');
    const titleA = document.getElementById('titleA');
    const titleB = document.getElementById('titleB');

    if (panel === 'A') {
        wrapper.style.transform = 'translateX(0)';
        titleA.style.color = 'var(--text)';
        titleA.style.fontSize = '32px';
        titleB.style.color = 'var(--muted)';
        titleB.style.fontSize = '24px';
    } else if (panel === 'B') {
        wrapper.style.transform = 'translateX(-50%)';
        titleB.style.color = 'var(--text)';
        titleB.style.fontSize = '32px';
        titleA.style.color = 'var(--muted)';
        titleA.style.fontSize = '24px';
    }
}

// ── FORM VALIDATION (Panel B) ───────────────────────────────
function showError(id, message) {
    const input = document.getElementById(id);
    input.style.borderColor = 'var(--danger)';
    let errorSpan = input.nextElementSibling;
    if (!errorSpan || !errorSpan.classList.contains('error-msg')) {
        errorSpan = document.createElement('span');
        errorSpan.className = 'error-msg';
        input.parentNode.insertBefore(errorSpan, input.nextSibling);
    }
    errorSpan.textContent = message;
}

function hideError(id) {
    const input = document.getElementById(id);
    input.style.borderColor = 'var(--line)';
    const errorSpan = input.nextElementSibling;
    if (errorSpan && errorSpan.classList.contains('error-msg')) {
        errorSpan.remove();
    }
}

function validateField(id, message) {
    const val = document.getElementById(id).value.trim();
    if (!val) { showError(id, message); return false; }
    hideError(id); return true;
}

['storeName', 'category', 'scale', 'city', 'address'].forEach(id => {
    document.getElementById(id)?.addEventListener('blur', () => validateField(id, 'Vui lòng không để trống.'));
});

// ── LOAD DATA ───────────────────────────────────────────────
async function loadProfile() {
    try {
        const response = await fetchAPI('/auth/me');
        const data = response.data;

        // Render Panel A
        document.getElementById('username').value = data.email || data.username || '';
        document.getElementById('fullName').value = data.fullName || '';
        document.getElementById('phone').value = data.phone || '';
        
        if(data.avatarUrl) {
            const avatarSrc = `${CONFIG.BASE_URL}${data.avatarUrl}`;
            document.getElementById('avatarPreview').src = avatarSrc;
            const topAvatar = document.getElementById('topAvatar');
            if(topAvatar) topAvatar.innerHTML = `<img src="${avatarSrc}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">`;
        }

        // Render MFA Status
        const mfaStatus = document.getElementById('mfaStatus');
        const mfaBtn = document.getElementById('mfaToggleBtn');
        if (data.mfaEnabled) {
            mfaStatus.innerHTML = "<span style='color: var(--success);'>● Đã bật</span>";
            mfaBtn.textContent = "Tắt MFA"; 
            mfaBtn.className = "btn btn-danger"; 
            mfaBtn.onclick = () => openModal('mfaDisableModal');
        } else {
            mfaStatus.innerHTML = "<span style='color: var(--danger);'>● Chưa bật</span>";
            mfaBtn.textContent = "Bật MFA"; 
            mfaBtn.className = "btn btn-primary"; 
            mfaBtn.onclick = initMfaSetup;
        }

        // Render Panel B (Thông tin doanh nghiệp)
        document.getElementById('storeName').value = data.storeName || '';
        document.getElementById('address').value = data.address || '';
        if(data.category) document.getElementById('category').value = data.category;
        if(data.scale) document.getElementById('scale').value = data.scale;
        if(data.city) document.getElementById('city').value = data.city;

    } catch (error) {
        showToast(error.message || 'Lỗi tải dữ liệu hồ sơ', 'error');
    }
}

// ── LƯU HỒ SƠ ───────────────────────────────────────────────
async function updateProfile() {
    const fullName = document.getElementById('fullName').value;
    const phone = document.getElementById('phone').value;
    try {
        await fetchAPI('/auth/profile', { method: 'PUT', body: JSON.stringify({ fullName, phone }) });
        showToast('Lưu thông tin cá nhân thành công!');
    } catch (e) { showToast(e.message || 'Lỗi lưu thông tin', 'error'); }
}

async function submitBusinessProfile() {
    const isValid = ['storeName', 'category', 'scale', 'city', 'address'].every(id => validateField(id, 'Vui lòng hoàn thiện.'));
    if (!isValid) return showToast('Vui lòng điền đủ thông tin kinh doanh!', 'error');

    const businessData = {
        storeName: document.getElementById('storeName').value.trim(),
        category: document.getElementById('category').value,
        scale: document.getElementById('scale').value,
        city: document.getElementById('city').value,
        address: document.getElementById('address').value.trim()
    };

    try {
        await fetchAPI('/auth/profile', { method: 'PUT', body: JSON.stringify(businessData) });
        showToast('Lưu hồ sơ kinh doanh thành công!');
        switchPanel('A'); 
    } catch (e) { showToast(e.message || 'Lỗi lưu dữ liệu', 'error'); }
}

// ── ĐỔI MẬT KHẨU ────────────────────────────────────────────
async function updatePassword() {
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (!newPassword) return showToast('Vui lòng nhập mật khẩu mới!', 'error');
    if (newPassword !== confirmPassword) return showToast('Mật khẩu xác nhận không khớp!', 'error');

    try {
        // Yêu cầu mật khẩu cũ (nếu backend bắt buộc, bạn cần thêm 1 ô input currentPassword)
        // Hiện tại tạm để oldPassword rỗng hoặc mockup theo file cũ
        await fetchAPI('/auth/change-password', {
            method: 'POST',
            body: JSON.stringify({ oldPassword: '', newPassword }), 
        });
        showToast('Đổi mật khẩu thành công!');
        document.getElementById('newPassword').value = '';
        document.getElementById('confirmPassword').value = '';
    } catch (error) {
        showToast(error.message || 'Lỗi khi đổi mật khẩu', 'error');
    }
}

// ── UPLOAD AVATAR ───────────────────────────────────────────
document.getElementById('avatarInput')?.addEventListener('change', async function(e) {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('avatar', file);

    try {
        const response = await fetchAPI('/auth/avatar', { method: 'POST', body: formData });
        document.getElementById('avatarPreview').src = response.data.avatarUrl;
        showToast('Cập nhật ảnh đại diện thành công!');
        loadProfile(); 
    } catch (error) {
        showToast(error.message || 'Lỗi khi tải ảnh lên.', 'error');
    }
});

// ── BẢO MẬT 2 LỚP (MFA) ─────────────────────────────────────
window.openModal = function(id) { 
    document.getElementById(id).style.display = 'block'; 
    document.getElementById('modalOverlay').style.display = 'block'; 
}
window.closeModal = function(id) { 
    document.getElementById(id).style.display = 'none'; 
    document.getElementById('modalOverlay').style.display = 'none'; 
}
window.closeAllModals = function() { 
    ['mfaSetupModal', 'mfaDisableModal'].forEach(closeModal); 
}

async function initMfaSetup() {
    try {
        const response = await fetchAPI("/mfa/setup", { method: "POST" });
        document.getElementById('mfaQrCode').src = response.data.qrCode;
        document.getElementById('mfaConfirmCode').value = '';
        openModal('mfaSetupModal');
    } catch (error) {
        showToast("Lỗi khởi tạo mã QR.", 'error');
    }
}

window.confirmMfaSetup = async function() {
    const code = document.getElementById("mfaConfirmCode").value.trim();
    if (!code || code.length < 6) return showToast("Nhập đủ 6 số OTP.", "error");

    try {
        await fetchAPI("/mfa/confirm", { method: "POST", body: JSON.stringify({ code }) });
        showToast("Tuyệt vời! Đã bật MFA thành công.");
        closeModal('mfaSetupModal');
        loadProfile();
    } catch (error) {
        showToast(error.message || "Mã OTP không chính xác.", "error");
    }
}

window.confirmMfaDisable = async function() {
    const password = document.getElementById('mfaDisablePassword').value;
    const code = document.getElementById('mfaDisableCode').value.trim();

    if (!password || !code) return showToast('Nhập đủ mật khẩu và OTP!', 'error');

    try {
        await fetchAPI('/mfa/disable', { method: 'POST', body: JSON.stringify({ password, code }) });
        showToast('Tắt MFA thành công!');
        closeModal('mfaDisableModal');
        loadProfile();
    } catch (error) { 
        showToast(error.message || 'Sai mật khẩu hoặc mã OTP', 'error'); 
    }
}

// ── THIẾT BỊ TIN CẬY ─────────────────────────────────────────
async function loadDevices() {
    try {
        const response = await fetchAPI('/auth/devices');
        const devices = response.data;
        const container = document.getElementById('devicesList');

        if (!devices || devices.length === 0) {
            container.innerHTML = '<p class="muted">Không có thiết bị tin cậy nào.</p>';
            return;
        }

        container.innerHTML = devices.map(d => `
            <div class="device-item">
                <div>
                    <strong>${d.device_name || 'Thiết bị không tên'}</strong>
                    <div style="font-size:12px; color:var(--muted); margin-top:4px;">
                        IP: ${d.ip_address} <br>
                        Dùng cuối: ${d.last_used_at ? new Date(d.last_used_at).toLocaleString() : 'N/A'}
                    </div>
                </div>
                <button onclick="revokeDevice(${d.id})" class="btn btn-outline" style="color:var(--danger); border-color:var(--danger);">Gỡ bỏ</button>
            </div>
        `).join('');
    } catch (error) {
        document.getElementById('devicesList').innerHTML = '<p class="muted">Không thể tải danh sách thiết bị.</p>';
    }
}

window.revokeDevice = async function(deviceId) {
    if (!confirm('Bạn có chắc chắn muốn đăng xuất thiết bị này?')) return;
    try {
        await fetchAPI(`/auth/devices/${deviceId}`, { method: 'DELETE' });
        showToast('Đã đăng xuất thiết bị thành công!');
        loadDevices();
    } catch (error) {
        showToast(error.message || 'Lỗi đăng xuất thiết bị.', 'error');
    }
};

// ── LOGOUT ──────────────────────────────────────────────────
document.getElementById('logoutBtn')?.addEventListener('click', async () => {
    try {
        await fetchAPI('/auth/logout', { method: 'POST', body: JSON.stringify({ allDevices: false }) });
    } catch (err) { console.warn('Lỗi server khi đăng xuất', err); }
    
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    window.location.href = '../../login.html';
});

// ── INITIALIZATION ──────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    loadProfile();
    loadDevices();
});