# 🗺️ Hướng dẫn điều hướng O'Future

## 📋 Tổng quan

Website O'Future đã được tích hợp hoàn chỉnh với thiết kế thống nhất và navigation liên kết giữa các trang.

## 🏠 Các trang chính

### 1. **Trang chủ** (`index.html`)
- Giới thiệu về O'Future
- Các tính năng nổi bật
- Quy trình giao dịch
- Navigation đến tất cả các trang khác

### 2. **Sản phẩm** (`product.html`) ⭐ MỚI
- Danh sách sản phẩm với 30 items
- Lọc theo 7 danh mục: Tất cả, Áo sơ mi, Đồng hồ, Nước hoa, Túi xách, Thời trang, Mũ
- Thêm vào giỏ hàng
- Thiết kế O'Future hoàn chỉnh

### 3. **Giỏ hàng** (`cart.html`) ⭐ MỚI
- Xem sản phẩm trong giỏ
- Điều chỉnh số lượng
- Tính tổng tiền
- Chuyển đến thanh toán

### 4. **Thanh toán** (`checkout.html`) ⭐ MỚI
- Nhập thông tin giao hàng
- Chọn phương thức thanh toán (COD, MoMo, QR)
- Xem tóm tắt đơn hàng
- Đặt hàng

### 5. **Đơn hàng** (`orders.html`) ⭐ MỚI
- Xem lịch sử đơn hàng
- Lọc theo trạng thái (Tất cả, Chờ xử lý, Đã thanh toán, Đang giao, Hoàn thành, Đã hủy)
- Hủy đơn hàng
- Xác nhận đã nhận hàng
- Tạo khiếu nại

### 6. **Hồ sơ cá nhân** (`profile.html`) ⭐ MỚI
- Cập nhật thông tin cá nhân
- Đổi mật khẩu
- Cài đặt bảo mật (MFA, thông báo email, ghi nhớ thiết bị)
- Avatar động

### 7. **Quản lý tài khoản** (`profile-management.html`) ⭐ MỚI
- Thông tin cá nhân chi tiết
- Bảo mật nâng cao
- Quản lý thiết bị tin cậy
- Cài đặt MFA với QR code

### 8. **Đánh giá** (`review.html`) ⭐ MỚI
- Viết đánh giá cho đơn hàng đã hoàn thành
- Đánh giá sao (1-5)
- Xem lịch sử đánh giá

### 9. **Liên hệ** (`contact.html`) ⭐ MỚI
- Form liên hệ
- Thông tin liên hệ (Email, Hotline, Địa chỉ)
- Chọn chủ đề

### 10. **Sơ đồ trang** (`sitemap.html`) ⭐ MỚI
- Xem tất cả các trang
- Thống kê trang web
- Điều hướng nhanh

## 🎨 Thiết kế thống nhất

Tất cả các trang đều sử dụng:
- ✅ Header O'Future với logo và navigation menu
- ✅ Màu xanh accent (#2563eb)
- ✅ Font Inter
- ✅ Card bo tròn 22px
- ✅ Shadow mềm mại
- ✅ Responsive design
- ✅ Toast notifications

## 🔗 Navigation Menu

Mỗi trang có navigation menu thống nhất:
- **Trang chủ** → `index.html`
- **Sản phẩm** → `product.html`
- **Giỏ hàng** → `cart.html`
- **Đơn hàng** → `orders.html`
- **Tài khoản** → `profile-management.html`

## 📱 Responsive

Tất cả các trang đều responsive và hoạt động tốt trên:
- 💻 Desktop (1200px+)
- 📱 Tablet (768px - 1199px)
- 📱 Mobile (< 768px)

## 🚀 Cách sử dụng

1. **Khởi động server:**
   ```bash
   # Nếu đang chạy
   http://localhost:8080/
   
   # Nếu chưa chạy
   python -m http.server 8080
   ```

2. **Truy cập các trang:**
   - Trang chủ: `http://localhost:8080/index.html`
   - Sơ đồ trang: `http://localhost:8080/sitemap.html`
   - Sản phẩm: `http://localhost:8080/product.html`

3. **Luồng mua hàng:**
   ```
   Sản phẩm → Thêm vào giỏ → Giỏ hàng → Thanh toán → Đơn hàng
   ```

4. **Luồng tài khoản:**
   ```
   Đăng nhập → Hồ sơ cá nhân / Quản lý tài khoản
   ```

## 📦 Tính năng LocalStorage

Các trang sử dụng localStorage để lưu trữ:
- 🛒 Giỏ hàng (`cart`)
- 👤 Thông tin người dùng (`user`)
- 📦 Đơn hàng (`orders`)

## 🎯 Các trang cần Backend API

Các trang sau cần kết nối backend để hoạt động đầy đủ:
- ✅ Đăng nhập/Đăng ký
- ✅ Quản lý tài khoản
- ✅ Đơn hàng
- ✅ Thanh toán
- ✅ Đánh giá

Hiện tại các trang đang sử dụng localStorage để demo.

## 📝 Ghi chú

- Tất cả các trang đã được tích hợp với thiết kế O'Future
- Navigation menu thống nhất trên tất cả các trang
- Các link liên kết giữa các trang hoạt động đầy đủ
- Toast notifications cho feedback người dùng
- Form validation cơ bản

## 🔄 Cập nhật gần đây

- ✅ Tích hợp thiết kế O'Future cho tất cả các trang
- ✅ Thêm navigation menu thống nhất
- ✅ Tạo trang sơ đồ (sitemap)
- ✅ Cập nhật product.html với thiết kế mới
- ✅ Cập nhật contact.html với thiết kế mới
- ✅ Tạo profile.html mới
- ✅ Liên kết tất cả các trang với nhau

---

**Tác giả:** Kiro AI Assistant  
**Ngày cập nhật:** 2024  
**Phiên bản:** 2.0
