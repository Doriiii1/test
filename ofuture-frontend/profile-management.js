const API_URL = 'http://localhost:5000/api';
let accessToken = localStorage.getItem('accessToken');

// Navigation
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const section = e.target.dataset.section;
        
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
        
        e.target.classList.add('active');
        document.getElementById(`${section}-section`).classList.add('active');
    });
});

// Toast notification
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    setTimeout(() => toast.classList.remove('show'), 3000);
}

// Load user profile
async function loadProfile() {
    try {
        const response = await fetch(`${API_URL}/auth/me`, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        
        if (!response.ok) throw new Error('Failed to load profile');
        
        const { data } = await response.json();
        
        document.getElementById('email').value = data.email;
        document.getElementById('username').value = data.username;
        document.getElementById('fullName').value = data.fullName || '';
        document.getElementById('phone').value = data.phone || '';
        
        if (data.avatarUrl) {
            document.getElementById('avatarPreview').src = data.avatarUrl;
        }
        
        // MFA status
        const mfaStatus = document.getElementById('mfaStatus');
        const mfaBtn = document.getElementById('mfaToggleBtn');
        
        if (data.mfaEnabled) {
            mfaStatus.textContent = '✓ MFA đã được bật';
            mfaBtn.textContent = 'Tắt MFA';
            mfaBtn.onclick = disableMFA;
        } else {
            mfaStatus.textContent = '✗ MFA chưa được bật';
            mfaBtn.textContent = 'Bật MFA';
            mfaBtn.onclick = enableMFA;
        }
        
    } catch (error) {
        showToast('Không thể tải thông tin tài khoản', 'error');
    }
}

// Update profile
document.getElementById('profileForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const fullName = document.getElementById('fullName').value;
    const phone = document.getElementById('phone').value;
    
    try {
        const response = await fetch(`${API_URL}/auth/me`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify({ fullName, phone })
        });
        
        if (!response.ok) throw new Error('Update failed');
        
        showToast('Cập nhật thông tin thành công!');
    } catch (error) {
        showToast('Cập nhật thất bại', 'error');
    }
});

// Avatar upload
document.getElementById('avatarInput').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (file.size > 2 * 1024 * 1024) {
        showToast('Ảnh không được vượt quá 2MB', 'error');
        return;
    }
    
    const formData = new FormData();
    formData.append('avatar', file);
    
    try {
        const response = await fetch(`${API_URL}/auth/avatar`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${accessToken}` },
            body: formData
        });
        
        if (!response.ok) throw new Error('Upload failed');
        
        const { data } = await response.json();
        document.getElementById('avatarPreview').src = data.avatarUrl;
        showToast('Cập nhật ảnh đại diện thành công!');
    } catch (error) {
        showToast('Tải ảnh thất bại', 'error');
    }
});

// Change password
document.getElementById('passwordForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (newPassword !== confirmPassword) {
        showToast('Mật khẩu xác nhận không khớp', 'error');
        return;
    }
    
    if (newPassword.length < 8) {
        showToast('Mật khẩu mới phải có ít nhất 8 ký tự', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/auth/change-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify({ currentPassword, newPassword })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message);
        }
        
        showToast('Đổi mật khẩu thành công!');
        document.getElementById('passwordForm').reset();
    } catch (error) {
        showToast(error.message || 'Đổi mật khẩu thất bại', 'error');
    }
});

// Enable MFA
async function enableMFA() {
    try {
        const response = await fetch(`${API_URL}/mfa/setup`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        
        if (!response.ok) throw new Error('Setup failed');
        
        const { data } = await response.json();
        
        document.getElementById('mfaSetup').style.display = 'block';
        document.getElementById('qrCode').innerHTML = `<img src="${data.qrCode}" alt="QR Code">`;
    } catch (error) {
        showToast('Không thể thiết lập MFA', 'error');
    }
}

// Verify MFA
async function verifyMFA() {
    const code = document.getElementById('mfaCode').value;
    
    if (code.length !== 6) {
        showToast('Mã xác thực phải có 6 chữ số', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/mfa/verify-setup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify({ code })
        });
        
        if (!response.ok) throw new Error('Verification failed');
        
        showToast('Bật MFA thành công!');
        document.getElementById('mfaSetup').style.display = 'none';
        loadProfile();
    } catch (error) {
        showToast('Mã xác thực không đúng', 'error');
    }
}

// Disable MFA
async function disableMFA() {
    if (!confirm('Bạn có chắc muốn tắt MFA?')) return;
    
    try {
        const response = await fetch(`${API_URL}/mfa/disable`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        
        if (!response.ok) throw new Error('Disable failed');
        
        showToast('Tắt MFA thành công!');
        loadProfile();
    } catch (error) {
        showToast('Không thể tắt MFA', 'error');
    }
}

// Load trusted devices
async function loadDevices() {
    try {
        const response = await fetch(`${API_URL}/mfa/devices`, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        
        if (!response.ok) throw new Error('Failed to load devices');
        
        const { data } = await response.json();
        const devicesList = document.getElementById('devicesList');
        
        if (data.length === 0) {
            devicesList.innerHTML = '<p>Chưa có thiết bị tin cậy nào</p>';
            return;
        }
        
        devicesList.innerHTML = data.map(device => `
            <div class="device-card">
                <div class="device-info">
                    <h4>${device.deviceName || 'Thiết bị không xác định'}</h4>
                    <p>IP: ${device.ipAddress}</p>
                    <p>Lần cuối: ${new Date(device.lastUsedAt).toLocaleString('vi-VN')}</p>
                    <p>Hết hạn: ${new Date(device.rememberedUntil).toLocaleString('vi-VN')}</p>
                </div>
                <button class="btn-danger" onclick="revokeDevice('${device.id}')">Xóa</button>
            </div>
        `).join('');
    } catch (error) {
        document.getElementById('devicesList').innerHTML = '<p>Không thể tải danh sách thiết bị</p>';
    }
}

// Revoke device
async function revokeDevice(deviceId) {
    if (!confirm('Bạn có chắc muốn xóa thiết bị này?')) return;
    
    try {
        const response = await fetch(`${API_URL}/mfa/devices/${deviceId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        
        if (!response.ok) throw new Error('Revoke failed');
        
        showToast('Xóa thiết bị thành công!');
        loadDevices();
    } catch (error) {
        showToast('Không thể xóa thiết bị', 'error');
    }
}

// Initialize
loadProfile();
loadDevices();
