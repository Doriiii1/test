let currentProduct = null;

// ── UTILITIES ───────────────────────────────────────────────
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    setTimeout(() => toast.classList.remove('show'), 3000);
}

function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    document.getElementById('cartCount').textContent = count;
}

// ── LOAD PRODUCT DATA ───────────────────────────────────────
async function loadProductDetail() {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');

    if (!productId) {
        showToast("Không tìm thấy thông tin sản phẩm!", "error");
        setTimeout(() => window.location.href = "../buyer-products/index.html", 1500);
        return;
    }

    try {
        const response = await fetchAPI(`/products/${productId}`);
        currentProduct = response.data;

        // Render Data
        const elImage = document.getElementById('productImage');
        if (currentProduct.imageUrls && currentProduct.imageUrls.length > 0) {
            elImage.src = `${CONFIG.BASE_URL}${currentProduct.imageUrls[0]}`;
        } else {
            elImage.src = 'https://picsum.photos/700/420'; // Fallback
        }

        document.getElementById('productName').textContent = currentProduct.name;
        document.getElementById('productPrice').textContent = currentProduct.price.toLocaleString('vi-VN') + 'đ';
        document.getElementById('productSeller').textContent = currentProduct.sellerName || 'Đang cập nhật';
        document.getElementById('productDesc').textContent = currentProduct.description || 'Chưa có mô tả chi tiết.';
        
        const moq = currentProduct.moq || 1;
        document.getElementById('productMoq').textContent = moq;
        document.getElementById('cartQuantity').value = moq;
        document.getElementById('cartQuantity').min = moq;

    } catch (error) {
        showToast(error.message || "Lỗi khi lấy thông tin chi tiết.", "error");
    }
}

// ── UI LOGIC (Toggle Sample Form) ───────────────────────────
document.getElementById('sampleSelect')?.addEventListener('change', function() {
    const form = document.getElementById('sampleForm');
    const btn = document.getElementById('addToCartBtn');
    
    if (this.value === 'YES') {
        form.style.display = 'block';
        btn.textContent = "Gửi Yêu Cầu Mẫu Thử";
        btn.className = "btn btn-outline"; // Đổi màu nút cho khác biệt
    } else {
        form.style.display = 'none';
        btn.textContent = "Thêm vào giỏ hàng";
        btn.className = "btn btn-primary";
    }
});

// ── HANDLE ACTION (ADD CART OR SAMPLE) ──────────────────────
document.getElementById('addToCartBtn')?.addEventListener('click', async function() {
    if (!currentProduct) return showToast("Dữ liệu chưa tải xong!", "error");

    const btn = this;
    const isSample = document.getElementById('sampleSelect').value === 'YES';
    const quantity = parseInt(document.getElementById('cartQuantity').value);
    const notes = document.getElementById('orderNotes').value.trim();
    const moq = currentProduct.moq || 1;

    // Validate MOQ (chỉ check nếu mua hàng thật, mua mẫu thì quantity = 1 vẫn được tuỳ rule của bạn)
    if (!isSample && quantity < moq) {
        document.getElementById('moqWarning').style.display = 'block';
        return showToast(`Bạn phải mua tối thiểu ${moq} sản phẩm!`, "error");
    } else {
        document.getElementById('moqWarning').style.display = 'none';
    }

    try {
        btn.disabled = true;
        btn.textContent = "Đang xử lý...";

        if (isSample) {
            // LOGIC YÊU CẦU MẪU THỬ
            const deposit = document.getElementById('sampleDeposit').value || 0;
            await fetchAPI('/samples', {
                method: 'POST',
                body: JSON.stringify({
                    product_id: currentProduct.id,
                    deposit_amount: deposit,
                    notes: notes
                })
            });
            showToast("Đã gửi yêu cầu hàng mẫu tới nhà cung cấp!");
            
        } else {
            // LOGIC THÊM GIỎ HÀNG (API hoặc LocalStorage)
            // 1. Gọi API Backend (giữ nguyên logic cũ của bạn)
            await fetchAPI('/cart', {
                method: 'POST',
                body: JSON.stringify({
                    product_id: currentProduct.id,
                    quantity: quantity,
                    notes: notes
                })
            });

            // 2. Fallback lưu LocalStorage để update UI icon giỏ hàng nhanh chóng
            const cart = JSON.parse(localStorage.getItem('cart')) || [];
            const existIndex = cart.findIndex(i => i.id === currentProduct.id);
            if (existIndex >= 0) {
                cart[existIndex].quantity += quantity;
            } else {
                cart.push({ ...currentProduct, quantity });
            }
            localStorage.setItem('cart', JSON.stringify(cart));
            updateCartCount();

            showToast("Đã thêm vào giỏ hàng thành công!");
        }

    } catch (error) {
        showToast(error.message || "Đã có lỗi xảy ra.", "error");
    } finally {
        btn.disabled = false;
        btn.textContent = isSample ? "Gửi Yêu Cầu Mẫu Thử" : "Thêm vào giỏ hàng";
    }
});

// ── INITIALIZATION ──────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    loadProductDetail();
    updateCartCount();
});