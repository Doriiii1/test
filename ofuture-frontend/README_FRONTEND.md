# O'Future Frontend - Hướng dẫn sử dụng

## Các tính năng đã hoàn thành

### 1. Quản lý Tài khoản (Profile Management)
**File:** `profile-management.html`, `profile-management.css`, `profile-management.js`

**Tính năng:**
- ✅ Cập nhật thông tin cá nhân (họ tên, số điện thoại)
- ✅ Upload ảnh đại diện (avatar)
- ✅ Đổi mật khẩu
- ✅ Bật/Tắt MFA (Multi-Factor Authentication)
- ✅ Quét mã QR để thiết lập MFA
- ✅ Quản lý thiết bị tin cậy
- ✅ Xóa thiết bị tin cậy

**API Endpoints sử dụng:**
- `GET /api/auth/me` - Lấy thông tin user
- `PUT /api/auth/me` - Cập nhật thông tin
- `POST /api/auth/avatar` - Upload avatar
- `POST /api/auth/change-password` - Đổi mật khẩu
- `POST /api/mfa/setup` - Thiết lập MFA
- `POST /api/mfa/verify-setup` - Xác nhận MFA
- `POST /api/mfa/disable` - Tắt MFA
- `GET /api/mfa/devices` - Lấy danh sách thiết bị
- `DELETE /api/mfa/devices/:id` - Xóa thiết bị

---

### 2. Giỏ hàng (Shopping Cart)
**File:** `cart.html`, `cart.css`, `cart.js`

**Tính năng:**
- ✅ Hiển thị danh sách sản phẩm trong giỏ
- ✅ Tăng/giảm số lượng sản phẩm
- ✅ Xóa sản phẩm khỏi giỏ
- ✅ Tính tổng tiền tự động
- ✅ Hiển thị phí nền tảng (2.5%)
- ✅ Lưu giỏ hàng vào localStorage

**Lưu ý:**
- Giỏ hàng được lưu trên client-side (localStorage)
- Mỗi sản phẩm sẽ tạo một đơn hàng riêng khi checkout

---

### 3. Thanh toán (Checkout)
**File:** `checkout.html`, `checkout.css`, `checkout.js`

**Tính năng:**
- ✅ Điền thông tin giao hàng (địa chỉ, thành phố, số điện thoại)
- ✅ Ghi chú đơn hàng
- ✅ Chọn phương thức thanh toán:
  - 💵 COD (Thanh toán khi nhận hàng)
  - 📱 Ví MoMo
  - 📷 Quét mã QR
- ✅ Tạo nhiều đơn hàng cùng lúc (mỗi sản phẩm = 1 đơn)
- ✅ Hiển thị mã QR thanh toán
- ✅ Xác nhận thanh toán QR

**API Endpoints sử dụng:**
- `POST /api/orders` - Tạo đơn hàng
- `POST /api/payments/momo` - Thanh toán MoMo
- `POST /api/payments/qr` - Tạo mã QR
- `PUT /api/payments/qr/:id/status` - Xác nhận thanh toán QR

---

### 4. Quản lý Đơn hàng (Order Management)
**File:** `orders.html`, `orders.css`, `orders.js`

**Tính năng:**
- ✅ Xem danh sách đơn hàng
- ✅ Lọc theo trạng thái:
  - Tất cả
  - Chờ thanh toán
  - Đã thanh toán
  - Đang giao hàng
  - Hoàn thành
  - Đã hủy
- ✅ Xem chi tiết đơn hàng
- ✅ Hủy đơn hàng (khi chưa ship)
- ✅ Xác nhận đã nhận hàng (để release escrow)
- ✅ Mở khiếu nại (dispute)
- ✅ Chuyển đến trang đánh giá

**API Endpoints sử dụng:**
- `GET /api/orders/my` - Lấy danh sách đơn hàng
- `GET /api/orders/:id` - Chi tiết đơn hàng
- `POST /api/orders/:id/cancel` - Hủy đơn
- `POST /api/orders/:id/confirm-delivery` - Xác nhận nhận hàng
- `POST /api/escrow/dispute` - Mở khiếu nại

---

### 5. Đánh giá sản phẩm (Product Reviews)
**File:** `review.html`, `review.css`, `review.js`

**Tính năng:**
- ✅ Viết đánh giá (rating 1-5 sao)
- ✅ Thêm tiêu đề và nội dung đánh giá
- ✅ Xem danh sách đánh giá của mình
- ✅ Sửa đánh giá
- ✅ Xóa đánh giá
- ✅ Hiển thị trạng thái ẩn (nếu admin ẩn)

**API Endpoints sử dụng:**
- `POST /api/reviews` - Tạo đánh giá
- `GET /api/reviews/my` - Lấy đánh giá của mình
- `PUT /api/reviews/:id` - Sửa đánh giá
- `DELETE /api/reviews/:id` - Xóa đánh giá

---

## Cấu trúc thư mục

```
ofuture-frontend/
├── profile-management.html     # Quản lý tài khoản
├── profile-management.css
├── profile-management.js
├── cart.html                   # Giỏ hàng
├── cart.css
├── cart.js
├── checkout.html               # Thanh toán
├── checkout.css
├── checkout.js
├── orders.html                 # Quản lý đơn hàng
├── orders.css
├── orders.js
├── review.html                 # Đánh giá sản phẩm
├── review.css
├── review.js
└── README_FRONTEND.md          # File này
```

---

## Cách sử dụng

### 1. Cấu hình API URL
Trong mỗi file `.js`, có biến `API_URL`:
```javascript
const API_URL = 'http://localhost:5000/api';
```
Thay đổi URL này nếu backend chạy ở địa chỉ khác.

### 2. Authentication
Tất cả các trang đều yêu cầu đăng nhập. Token được lưu trong `localStorage`:
```javascript
const accessToken = localStorage.getItem('accessToken');
```

### 3. Luồng sử dụng cơ bản

**A. Mua hàng:**
1. Xem sản phẩm → Thêm vào giỏ hàng
2. `cart.html` → Xem giỏ hàng, điều chỉnh số lượng
3. `checkout.html` → Điền thông tin, chọn thanh toán
4. `orders.html` → Theo dõi đơn hàng

**B. Quản lý đơn hàng:**
1. `orders.html` → Xem danh sách đơn
2. Hủy đơn (nếu chưa ship)
3. Xác nhận nhận hàng (khi đã ship)
4. Mở khiếu nại (nếu có vấn đề)

**C. Đánh giá:**
1. `orders.html` → Đơn hoàn thành → Click "Đánh giá"
2. `review.html` → Viết đánh giá
3. Xem/sửa/xóa đánh giá của mình

**D. Quản lý tài khoản:**
1. `profile-management.html` → Cập nhật thông tin
2. Đổi mật khẩu
3. Bật MFA để bảo mật
4. Quản lý thiết bị tin cậy

---

## Tính năng chưa hoàn thành (cần backend hỗ trợ)

### Quản lý Hàng mẫu (Sample Management)
Các tính năng này cần backend tạo thêm API:

1. **Gửi yêu cầu xin hàng mẫu**
   - API cần: `POST /api/samples/request`
   - Body: `{ productId, reason, duration }`

2. **Quản lý tiền đặt cọc**
   - API cần: `POST /api/samples/:id/deposit`
   - Body: `{ amount, paymentMethod }`

3. **Hoàn trả hàng mẫu**
   - API cần: `POST /api/samples/:id/return`
   - Body: `{ condition, notes }`

4. **Chuyển đổi mẫu sang mua**
   - API cần: `POST /api/samples/:id/convert-to-order`

**Gợi ý schema database:**
```sql
CREATE TABLE sample_requests (
  id CHAR(36) PRIMARY KEY,
  buyer_id CHAR(36) NOT NULL,
  seller_id CHAR(36) NOT NULL,
  product_id CHAR(36) NOT NULL,
  status ENUM('pending', 'approved', 'shipped', 'returned', 'converted') DEFAULT 'pending',
  deposit_amount DECIMAL(12,2),
  reason TEXT,
  duration_days INT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## Lưu ý kỹ thuật

### 1. Xử lý lỗi
Tất cả các API call đều có try-catch và hiển thị toast notification:
```javascript
try {
    const response = await fetch(url, options);
    if (!response.ok) throw new Error('...');
    // Success
} catch (error) {
    showToast(error.message, 'error');
}
```

### 2. Format tiền tệ
Sử dụng `Intl.NumberFormat` để format VND:
```javascript
function formatPrice(price) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(price);
}
```

### 3. LocalStorage
- `cart`: Lưu giỏ hàng
- `accessToken`: Lưu JWT token
- `refreshToken`: Lưu refresh token

### 4. Responsive Design
Tất cả các trang đều responsive với breakpoint 768px.

---

## Testing

### Test Checkout Flow:
1. Thêm sản phẩm vào giỏ
2. Kiểm tra tính toán phí
3. Điền thông tin giao hàng
4. Chọn từng phương thức thanh toán
5. Xác nhận đơn hàng được tạo

### Test Order Management:
1. Tạo đơn hàng
2. Kiểm tra các trạng thái
3. Test hủy đơn
4. Test xác nhận nhận hàng
5. Test mở khiếu nại

### Test Review System:
1. Hoàn thành đơn hàng
2. Viết đánh giá
3. Sửa đánh giá
4. Xóa đánh giá

---

## Liên hệ & Hỗ trợ

Nếu có vấn đề hoặc cần thêm tính năng, vui lòng tạo issue hoặc liên hệ team phát triển.
