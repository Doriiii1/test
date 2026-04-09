// ============================================================
// O'Future - Complete Profile Handler
// Tích hợp fetchAPI & Điều hướng Role-based
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
    // 1. Kiểm tra Token (Chặn khách vãng lai)
    const token = localStorage.getItem('accessToken');
    if (!token) {
        window.location.href = '../login.html';
        return;
    }

    const form = document.getElementById('completeProfileForm');
    const saveBtn = document.getElementById('saveBtn');

    // 2. Xử lý gửi Form
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const payload = {
            phone: document.getElementById('phone').value.trim(),
            address: document.getElementById('address').value.trim(),
            city: document.getElementById('city').value.trim(),
            store_name: document.getElementById('storeName').value.trim(),
            category: document.getElementById('category').value,
            scale: document.getElementById('scale').value
        };

        saveBtn.disabled = true;
        saveBtn.textContent = 'Đang lưu hồ sơ...';

        try {
            // Gọi API Cập nhật Profile (Sử dụng hàm fetchAPI từ api.js)
            // Backend sẽ tự lấy user.id từ accessToken trong header
            const result = await fetchAPI('/auth/profile', {
                method: 'PUT',
                body: JSON.stringify(payload)
            });

            if (result.success) {
                // Cập nhật lại thông tin user trong LocalStorage
                const user = JSON.parse(localStorage.getItem('user'));
                const updatedUser = { ...user, ...payload, fullName: user.fullName }; // Giữ lại name cũ
                localStorage.setItem('user', JSON.stringify(updatedUser));

                alert('Hồ sơ đã được hoàn thiện!');

                // 3. Điều hướng theo vai trò (Buyer -> Home, Seller -> indexSeller)
                if (user.role === 'buyer') {
                    window.location.href = '../dashboard-buyer/buyer-home/index.html';
                } else if (user.role === 'seller') {
                    window.location.href = '../dashboard-seller/indexSeller.html';
                } else {
                    window.location.href = '../index.html';
                }
            } else {
                throw new Error(result.message || 'Cập nhật thất bại.');
            }
        } catch (error) {
            alert('Lỗi: ' + error.message);
        } finally {
            saveBtn.disabled = false;
            saveBtn.textContent = 'Hoàn tất & Vào TRANG CHỦ';
        }
    });
});