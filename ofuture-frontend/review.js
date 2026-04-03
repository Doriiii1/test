const API_URL = 'http://localhost:5000/api';
const accessToken = localStorage.getItem('accessToken');
const urlParams = new URLSearchParams(window.location.search);
const orderId = urlParams.get('orderId');
const productId = urlParams.get('productId');

let selectedRating = 0;

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    setTimeout(() => toast.classList.remove('show'), 3000);
}

// Star rating interaction
document.querySelectorAll('.star').forEach(star => {
    star.addEventListener('click', () => {
        selectedRating = parseInt(star.dataset.rating);
        document.getElementById('rating').value = selectedRating;
        updateStars();
    });

    star.addEventListener('mouseenter', () => {
        const rating = parseInt(star.dataset.rating);
        document.querySelectorAll('.star').forEach((s, index) => {
            s.classList.toggle('active', index < rating);
        });
    });
});

document.querySelector('.star-rating').addEventListener('mouseleave', updateStars);

function updateStars() {
    document.querySelectorAll('.star').forEach((s, index) => {
        s.classList.toggle('active', index < selectedRating);
    });
}

// Submit review
document.getElementById('reviewForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!accessToken) {
        showToast('Vui lòng đăng nhập', 'error');
        window.location.href = 'loginbd.html/login.html';
        return;
    }

    if (selectedRating === 0) {
        showToast('Vui lòng chọn số sao đánh giá', 'error');
        return;
    }

    const title = document.getElementById('title').value;
    const body = document.getElementById('body').value;

    try {
        const response = await fetch(`${API_URL}/reviews`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify({
                orderId,
                rating: selectedRating,
                title: title || null,
                body
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message);
        }

        showToast('Gửi đánh giá thành công!');
        
        // Reset form
        document.getElementById('reviewForm').reset();
        selectedRating = 0;
        updateStars();

        // Reload reviews
        loadMyReviews();

        // Redirect after delay
        setTimeout(() => {
            window.location.href = 'orders.html';
        }, 2000);

    } catch (error) {
        showToast(error.message || 'Không thể gửi đánh giá', 'error');
    }
});

// Load user's reviews
async function loadMyReviews() {
    if (!accessToken) return;

    try {
        const response = await fetch(`${API_URL}/reviews/my`, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });

        if (!response.ok) throw new Error('Failed to load reviews');

        const { data } = await response.json();
        renderMyReviews(data);
    } catch (error) {
        document.getElementById('myReviewsList').innerHTML = `
            <div class="empty-state">
                <p>Không thể tải đánh giá</p>
            </div>
        `;
    }
}

function renderMyReviews(reviews) {
    const list = document.getElementById('myReviewsList');

    if (reviews.length === 0) {
        list.innerHTML = `
            <div class="empty-state">
                <p>Bạn chưa có đánh giá nào</p>
            </div>
        `;
        return;
    }

    list.innerHTML = reviews.map(review => `
        <div class="review-card">
            <div class="review-header">
                <div class="review-product">
                    <h4>${review.product.name}</h4>
                    <div class="review-rating">${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}</div>
                </div>
                <div class="review-actions">
                    <button class="btn btn-secondary" onclick="editReview('${review.id}')">Sửa</button>
                    <button class="btn btn-danger" onclick="deleteReview('${review.id}')">Xóa</button>
                </div>
            </div>

            <div class="review-content">
                ${review.title ? `<div class="review-title">${review.title}</div>` : ''}
                <div class="review-body">${review.body}</div>
                <div class="review-date">
                    ${new Date(review.createdAt).toLocaleDateString('vi-VN')}
                </div>
            </div>

            ${review.isHidden ? `
                <div class="review-hidden">
                    ⚠️ Đánh giá này đã bị ẩn bởi quản trị viên
                </div>
            ` : ''}
        </div>
    `).join('');
}

async function editReview(reviewId) {
    const title = prompt('Tiêu đề mới:');
    const body = prompt('Nội dung mới:');
    const rating = prompt('Đánh giá mới (1-5):');

    if (!body && !rating) return;

    try {
        const payload = {};
        if (title !== null) payload.title = title;
        if (body) payload.body = body;
        if (rating) payload.rating = parseInt(rating);

        const response = await fetch(`${API_URL}/reviews/${reviewId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message);
        }

        showToast('Cập nhật đánh giá thành công!');
        loadMyReviews();
    } catch (error) {
        showToast(error.message || 'Không thể cập nhật đánh giá', 'error');
    }
}

async function deleteReview(reviewId) {
    if (!confirm('Bạn có chắc muốn xóa đánh giá này?')) return;

    try {
        const response = await fetch(`${API_URL}/reviews/${reviewId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message);
        }

        showToast('Xóa đánh giá thành công!');
        loadMyReviews();
    } catch (error) {
        showToast(error.message || 'Không thể xóa đánh giá', 'error');
    }
}

// Initialize
if (!orderId || !productId) {
    document.querySelector('.review-form-container').style.display = 'none';
}

loadMyReviews();
