let products = [];
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let selectedProduct = null;
let modalQuantity = 1;

// ── UTILITIES ───────────────────────────────────────────────
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    setTimeout(() => toast.classList.remove('show'), 3000);
}

function updateCartCount() {
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    document.getElementById('cartCount').textContent = count;
}

function getCategoryName(cat) {
    const names = {
        'SHIRT': 'Áo sơ mi', 'CLOCK': 'Đồng hồ', 'PERFUME': 'Nước hoa',
        'HAND': 'Túi xách', 'FASHION': 'Thời trang', 'FOOD': 'Thực phẩm'
    };
    return names[cat?.toUpperCase()] || cat || 'Chung';
}

// ── LOAD PRODUCTS FROM API ──────────────────────────────────
async function loadProductsFromAPI() {
    const list = document.getElementById('productList');
    list.innerHTML = `<p class="muted" style="grid-column: 1/-1; text-align: center;">Đang tải dữ liệu...</p>`;
    
    try {
        const response = await fetchAPI('/products?limit=100');
        
        products = response.data.map(p => ({
            id: p.id,
            name: p.name,
            price: p.price,
            cat: p.category || 'FASHION',
            img: (p.imageUrls && p.imageUrls.length > 0) ? `${CONFIG.BASE_URL}${p.imageUrls[0]}` : 'https://picsum.photos/400/240', 
            desc: p.description || 'Chưa có mô tả chi tiết.',
            sellerName: p.sellerName || 'Đang cập nhật'
        }));

        renderProducts();
    } catch (error) {
        list.innerHTML = `<p style="grid-column: 1/-1; color: var(--danger); text-align: center;">Lỗi tải sản phẩm: ${error.message}</p>`;
    }
}

// ── FILTER & RENDER LOGIC ───────────────────────────────────
function renderProducts() {
    const list = document.getElementById('productList');
    
    const searchVal = document.getElementById('filterName').value.toLowerCase();
    const catVal = document.getElementById('filterCategory').value;
    const priceVal = document.getElementById('filterPrice').value;
    const sortVal = document.getElementById('filterSort').value;

    // Lọc dữ liệu
    let filtered = products.filter(p => {
        const matchSearch = p.name.toLowerCase().includes(searchVal);
        const matchCat = catVal === "ALL" || p.cat.toUpperCase() === catVal;
        
        let matchPrice = true;
        if (priceVal === "UNDER_100") matchPrice = p.price < 100000;
        if (priceVal === "100_500") matchPrice = p.price >= 100000 && p.price <= 500000;
        if (priceVal === "OVER_500") matchPrice = p.price > 500000;

        return matchSearch && matchCat && matchPrice;
    });

    // Sắp xếp
    if (sortVal === "PRICE_ASC") filtered.sort((a, b) => a.price - b.price);
    if (sortVal === "PRICE_DESC") filtered.sort((a, b) => b.price - a.price);
    // NEWEST: Giữ nguyên thứ tự API (hoặc sort theo ID nếu cần)

    if (filtered.length === 0) {
        list.innerHTML = `<p class="muted" style="grid-column: 1/-1; text-align: center;">Không tìm thấy sản phẩm phù hợp.</p>`;
        return;
    }

    list.innerHTML = filtered.map(p => `
        <div class="product-card">
          <img src="${p.img}" alt="${p.name}" style="cursor:pointer;" onclick="openModal('${p.id}')">
          <div class="product-body">
            <h3 style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                <a href="javascript:void(0)" onclick="openModal('${p.id}')">${p.name}</a>
            </h3>
            <div class="muted">Nhà cung cấp: ${p.sellerName}</div>
            <div class="price">${p.price.toLocaleString('vi-VN')}đ</div>
            <p class="muted" style="margin-bottom: 12px;">MOQ: 10 sản phẩm</p>
            <div style="display:flex; gap:8px;">
                <button class="btn btn-primary" style="flex:1;" onclick="quickAddToCart('${p.id}')">Thêm giỏ</button>
                <button class="btn btn-outline" onclick="openModal('${p.id}')">Xem</button>
            </div>
          </div>
        </div>
    `).join('');
}

// Lắng nghe sự kiện bộ lọc
document.getElementById('filterName').addEventListener('input', renderProducts);
document.getElementById('filterCategory').addEventListener('change', renderProducts);
document.getElementById('filterPrice').addEventListener('change', renderProducts);
document.getElementById('filterSort').addEventListener('change', renderProducts);

// ── CART LOGIC ──────────────────────────────────────────────
function quickAddToCart(id) {
    const product = products.find(p => p.id === id);
    if (!product) return;
    addToCartLogic(product, 1);
    showToast('Đã thêm sản phẩm vào giỏ hàng!');
}

function addModalToCart() {
    if (!selectedProduct) return;
    addToCartLogic(selectedProduct, modalQuantity);
    closeModal();
    showToast('Đã thêm sản phẩm vào giỏ hàng!');
}

function addToCartLogic(product, quantity) {
    const existIndex = cart.findIndex(i => i.id === product.id);
    if (existIndex >= 0) {
        cart[existIndex].quantity += quantity;
    } else {
        cart.push({ ...product, quantity });
    }
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
}

// ── MODAL LOGIC ─────────────────────────────────────────────
async function openModal(id) {
    // Ưu tiên lấy từ cache frontend cho mượt, nếu cần thông tin sâu hơn thì gọi lại API /products/{id}
    selectedProduct = products.find(p => p.id === id);
    if(!selectedProduct) return;

    modalQuantity = 1;
    
    document.getElementById('modalImage').src = selectedProduct.img;
    document.getElementById('modalCategory').textContent = getCategoryName(selectedProduct.cat);
    document.getElementById('modalName').textContent = selectedProduct.name;
    document.getElementById('modalPrice').textContent = selectedProduct.price.toLocaleString('vi-VN') + 'đ';
    document.getElementById('modalDescription').textContent = selectedProduct.desc;
    document.getElementById('modalQuantity').textContent = modalQuantity;

    document.getElementById('productModal').style.display = 'block';
    document.getElementById('modalOverlay').style.display = 'block';
}

function closeModal() {
    document.getElementById('productModal').style.display = 'none';
    document.getElementById('modalOverlay').style.display = 'none';
}

function changeQuantity(delta) {
    modalQuantity = Math.max(1, modalQuantity + delta);
    document.getElementById('modalQuantity').textContent = modalQuantity;
}

// Đóng modal khi click ra ngoài
document.getElementById('modalOverlay').addEventListener('click', closeModal);

// ── INIT ────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    loadProductsFromAPI();
    updateCartCount();
});