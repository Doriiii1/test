// ── UTILITIES ───────────────────────────────────────────────
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    setTimeout(() => toast.classList.remove('show'), 3000);
}

// ── AUTO-FILL USER DATA ─────────────────────────────────────
async function loadUserData() {
    try {
        const response = await fetchAPI('/auth/me');
        const data = response.data;
        
        // Tự động điền nếu có dữ liệu
        if (data.fullName) document.getElementById('contactName').value = data.fullName;
        if (data.email) document.getElementById('contactEmail').value = data.email;
        
        // Cập nhật Avatar góc phải trên
        if (data.avatarUrl) {
            document.getElementById('userAvatar').innerHTML = `<img src="${CONFIG.BASE_URL}${data.avatarUrl}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">`;
        }
    } catch (error) {
        console.warn("Chưa đăng nhập hoặc lỗi tải thông tin", error);
    }
}

// ── FORM VALIDATION & SUBMIT ────────────────────────────────
function showError(id, message) {
    const el = document.getElementById(id);
    el.classList.add('input-error');
    
    let errorSpan = el.nextElementSibling;
    if (!errorSpan || !errorSpan.classList.contains('error-msg')) {
        errorSpan = document.createElement('span');
        errorSpan.className = 'error-msg';
        el.parentNode.insertBefore(errorSpan, el.nextSibling);
    }
    errorSpan.textContent = message;
}

function clearErrors() {
    document.querySelectorAll('.input-error').forEach(el => el.classList.remove('input-error'));
    document.querySelectorAll('.error-msg').forEach(el => el.remove());
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

window.handleContactSubmit = async function(e) {
    e.preventDefault();
    clearErrors();
    
    let isValid = true;
    const fields = {
        name: document.getElementById('contactName'),
        email: document.getElementById('contactEmail'),
        subject: document.getElementById('contactSubject'),
        message: document.getElementById('contactMessage')
    };

    // Validation
    if (!fields.name.value.trim()) { showError('contactName', 'Vui lòng nhập họ tên.'); isValid = false; }
    
    const emailVal = fields.email.value.trim();
    if (!emailVal) { 
        showError('contactEmail', 'Vui lòng nhập Email.'); isValid = false; 
    } else if (!isValidEmail(emailVal)) {
        showError('contactEmail', 'Email không đúng định dạng.'); isValid = false; 
    }

    if (!fields.subject.value) { showError('contactSubject', 'Vui lòng chọn chủ đề cần hỗ trợ.'); isValid = false; }
    if (!fields.message.value.trim()) { showError('contactMessage', 'Vui lòng nhập chi tiết vấn đề.'); isValid = false; }

    if (!isValid) return;

    // Submit Process
    const btn = document.getElementById('submitBtn');
    btn.disabled = true;
    btn.textContent = "Đang gửi yêu cầu...";

    try {
        // Giả lập API call (Vì Backend của bạn hiện chưa có route POST /contact)
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Nếu sau này bạn làm Backend API liên hệ, chỉ cần mở comment dòng này:
        // await fetchAPI('/contact', { method: 'POST', body: JSON.stringify({
        //     name: fields.name.value, email: fields.email.value, 
        //     subject: fields.subject.value, message: fields.message.value
        // }) });

        showToast('Tin nhắn của bạn đã được gửi thành công! Chúng tôi sẽ phản hồi sớm nhất qua Email.');
        
        // Xóa nội dung phần tin nhắn, giữ lại tên và email
        fields.subject.value = '';
        fields.message.value = '';

    } catch (error) {
        showToast('Lỗi khi gửi tin nhắn: ' + error.message, 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = "Gửi yêu cầu hỗ trợ";
    }
}

// ── INIT ────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', loadUserData);