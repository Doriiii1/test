// ============================================================
// O'Future Buyer Reviews Controller
// ============================================================

// Đọc URL Params (Từ buyer-orders truyền sang)
const urlParams = new URLSearchParams(window.location.search);
const orderId = urlParams.get('orderId');
const productId = urlParams.get('productId');

let selectedRating = 0;

// Guard: Kiểm tra đăng nhập
document.addEventListener('DOMContentLoaded', () => {
  if (!localStorage.getItem('accessToken')) {
    window.location.href = '../../login.html';
    return;
  }
  
  initializeReviewForm();
  loadMyReviews();
});

// ── TOAST NOTIFICATION ────────────────────────────────────
function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.className = `toast toast-${type} show`;
  // Set background dựa vào type nếu chưa setup trong CSS chung
  toast.style.backgroundColor = type === 'success' ? '#10b981' : '#ef4444';
  
  setTimeout(() => toast.classList.remove('show'), 3000);
}

// ── KHỞI TẠO FORM & NGÔI SAO ──────────────────────────────
function initializeReviewForm() {
  const formContainer = document.getElementById('reviewFormContainer');
  const noOrderMsg = document.getElementById('noOrderMessage');
  const orderIdSpan = document.getElementById('selectedOrderId');

  // Kiểm tra có đang review đơn hàng nào không
  if (orderId) {
    formContainer.style.display = 'block';
    noOrderMsg.style.display = 'none';
    if(orderIdSpan) orderIdSpan.textContent = '#' + orderId.substring(0, 8).toUpperCase();
  } else {
    formContainer.style.display = 'none';
    noOrderMsg.style.display = 'block';
  }

  // Tương tác với Star Rating
  const stars = document.querySelectorAll('.star');
  stars.forEach(star => {
    star.addEventListener('click', () => {
      selectedRating = parseInt(star.dataset.rating);
      document.getElementById('rating').value = selectedRating;
      updateStarsUI();
    });

    star.addEventListener('mouseenter', () => {
      const hoverRating = parseInt(star.dataset.rating);
      stars.forEach((s, index) => s.classList.toggle('active', index < hoverRating));
    });
  });

  const starRatingContainer = document.querySelector('.star-rating');
  if (starRatingContainer) {
    starRatingContainer.addEventListener('mouseleave', updateStarsUI);
  }

  // Xử lý Submit
  const reviewForm = document.getElementById('reviewForm');
  if (reviewForm) {
    reviewForm.addEventListener('submit', handleReviewSubmit);
  }
}

function updateStarsUI() {
  document.querySelectorAll('.star').forEach((s, index) => {
    s.classList.toggle('active', index < selectedRating);
  });
}

// ── XỬ LÝ SUBMIT ĐÁNH GIÁ ─────────────────────────────────
async function handleReviewSubmit(e) {
  e.preventDefault();

  if (!orderId) return showToast('Không tìm thấy thông tin đơn hàng', 'error');
  if (selectedRating === 0) return showToast('Vui lòng chọn số sao đánh giá', 'error');

  const title = document.getElementById('title').value.trim();
  const body = document.getElementById('body').value.trim();

  if (!body) return showToast('Vui lòng nhập nội dung đánh giá', 'error');

  const submitBtn = e.target.querySelector('button[type="submit"]');
  submitBtn.disabled = true; 
  submitBtn.textContent = 'Đang gửi...';

  try {
    const res = await fetchAPI('/reviews', {
      method: 'POST',
      body: JSON.stringify({
        orderId,
        rating: selectedRating,
        title: title || null,
        body,
      }),
    });

    if (res.success || res.data) {
      showToast('Gửi đánh giá thành công!');
      e.target.reset();
      selectedRating = 0;
      updateStarsUI();
      
      // Load lại list review & ẩn form
      loadMyReviews();
      setTimeout(() => { 
        window.location.href = '../buyer-orders/index.html'; 
      }, 1500);
    }
  } catch (error) {
    showToast(error.message || 'Không thể gửi đánh giá', 'error');
  } finally {
    submitBtn.disabled = false; 
    submitBtn.textContent = 'Gửi Đánh Giá';
  }
}

// ── TẢI DANH SÁCH ĐÁNH GIÁ (LỊCH SỬ) ──────────────────────
async function loadMyReviews() {
  const listContainer = document.getElementById('myReviewsList');
  if (!listContainer) return;

  listContainer.innerHTML = '<p class="text-muted col-12 text-center">Đang tải dữ liệu...</p>';

  try {
    const res = await fetchAPI('/reviews/my');
    const reviews = res.data || [];
    renderMyReviews(reviews);
  } catch (error) {
    listContainer.innerHTML = `<div class="alert alert-info w-100">Không thể tải đánh giá: ${error.message}</div>`;
  }
}

function renderMyReviews(reviews) {
  const listContainer = document.getElementById('myReviewsList');
  
  if (reviews.length === 0) {
    listContainer.innerHTML = `
      <div class="alert alert-info w-100 text-center" style="grid-column: 1 / -1;">
        <p class="mb-2">Bạn chưa có đánh giá nào.</p>
        <a href="../buyer-orders/index.html" class="btn btn-primary btn-sm">Xem đơn hàng để đánh giá</a>
      </div>`;
    return;
  }

  listContainer.innerHTML = reviews.map(review => {
    const starsHTML = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
    const dateStr = new Date(review.createdAt).toLocaleDateString('vi-VN');
    
    return `
      <div class="review-item">
        <div class="review-item-header">
          <div>
            <div class="review-product-name">${review.product?.name || review.productName || 'Sản phẩm O\'Future'}</div>
            <div class="review-rating">${starsHTML}</div>
          </div>
          <div class="review-actions">
            <button class="btn btn-secondary btn-sm" onclick="editReview('${review.id}')"><i class="fa-solid fa-pen"></i></button>
            <button class="btn btn-danger btn-sm" onclick="deleteReview('${review.id}')"><i class="fa-solid fa-trash"></i></button>
          </div>
        </div>
        
        ${review.title ? `<div class="review-title">${review.title}</div>` : ''}
        <div class="review-body">${review.body || ''}</div>
        <div class="review-date"><i class="fa-regular fa-clock"></i> ${dateStr}</div>
        
        ${review.isHidden ? `
          <div class="hidden-warning">
            <i class="fa-solid fa-triangle-exclamation"></i> Đánh giá này đã bị ẩn bởi quản trị viên.
          </div>
        ` : ''}
      </div>
    `;
  }).join('');
}

// ── SỬA & XÓA ĐÁNH GIÁ ────────────────────────────────────
window.editReview = async function(reviewId) {
  const ratingStr = prompt('Đánh giá mới (1-5 sao, để trống để giữ nguyên):');
  if (ratingStr === null) return;
  const title = prompt('Tiêu đề mới (để trống để giữ nguyên):');
  if (title === null) return;
  const body = prompt('Nội dung mới (để trống để giữ nguyên):');
  if (body === null) return;

  const payload = {};
  if (title.trim()) payload.title = title.trim();
  if (body.trim()) payload.body = body.trim();
  if (ratingStr.trim()) {
    const r = parseInt(ratingStr);
    if (r >= 1 && r <= 5) payload.rating = r;
  }

  if (Object.keys(payload).length === 0) return showToast('Không có thay đổi nào', 'info');

  try {
    await fetchAPI(`/reviews/${reviewId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    showToast('Cập nhật thành công!');
    loadMyReviews();
  } catch (error) {
    showToast(error.message || 'Lỗi khi cập nhật', 'error');
  }
};

window.deleteReview = async function(reviewId) {
  if (!confirm('Bạn có chắc chắn muốn xóa đánh giá này vĩnh viễn?')) return;
  try {
    await fetchAPI(`/reviews/${reviewId}`, { method: 'DELETE' });
    showToast('Xóa thành công!');
    loadMyReviews();
  } catch (error) {
    showToast(error.message || 'Lỗi khi xóa', 'error');
  }
};

// ── ĐĂNG XUẤT ─────────────────────────────────────────────
document.getElementById('logoutBtn')?.addEventListener('click', async () => {
  try {
    await fetchAPI('/auth/logout', { method: 'POST', body: JSON.stringify({ allDevices: false }) });
  } catch (e) { console.warn('Logout API failed', e); }
  localStorage.clear();
  window.location.href = '../../login.html';
});