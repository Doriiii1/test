# TODO Admin UI (Xử lý sau)

## Mục tiêu
- Bổ sung giao diện Admin để duyệt yêu cầu thay đổi hồ sơ Seller.
- Không triển khai trong đợt demo hiện tại theo yêu cầu.

## API đã sẵn sàng
- `GET /api/admin/seller-profile-change-requests`
- `PUT /api/admin/seller-profile-change-requests/:id`
  - body: `{ "decision": "approved" | "rejected", "adminNote": "..." }`

## Hạng mục UI cần làm sau
- Tab mới trong dashboard admin: `Duyệt hồ sơ Seller`.
- Bảng danh sách yêu cầu:
  - Seller, thời gian gửi, nội dung thay đổi, trạng thái.
- Chi tiết yêu cầu:
  - So sánh dữ liệu hiện tại vs dữ liệu đề xuất.
- Nút xử lý:
  - `Duyệt`
  - `Từ chối` + nhập ghi chú bắt buộc.
- Bộ lọc:
  - `pending`, `approved`, `rejected`.

  # UI Phê duyệt thay đổi hồ sơ (Admin Approval)

## 1. Cấu trúc bảng `profile_change_requests`
- `id`: UUID
- `user_id`: UUID (FK)
- `old_data`: JSON (Dữ liệu cũ)
- `new_data`: JSON (Dữ liệu mới yêu cầu)
- `status`: enum('pending', 'approved', 'rejected')
- `admin_note`: Text (Lý do từ chối nếu có)

## 2. Luồng xử lý Admin
1. **Màn hình danh sách:**
   - Hiển thị các yêu cầu có status = 'pending'.
   - Hiển thị tên Seller, Tên shop, và ngày gửi.
2. **Màn hình chi tiết (So sánh):**
   - Hiển thị 2 cột: "Dữ liệu hiện tại" vs "Dữ liệu yêu cầu".
   - Highlight các trường có sự thay đổi (VD: Phone, Address).
3. **Hành động:**
   - Nút **[Phê duyệt]**: 
     - Update bảng `users` với dữ liệu từ `new_data`.
     - Update status yêu cầu thành 'approved'.
     - Gửi thông báo (Notification) cho Seller.
   - Nút **[Từ chối]**:
     - Mở modal nhập lý do.
     - Update status yêu cầu thành 'rejected' kèm `admin_note`.

## Ghi chú nghiệp vụ
- Seller không được sửa trực tiếp hồ sơ qua `PUT /api/auth/profile`.
- Seller chỉ được gửi yêu cầu qua `POST /api/auth/profile-change-request`.
- Mật khẩu vẫn cho đổi trực tiếp qua `POST /api/auth/change-password`.
