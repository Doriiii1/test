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

## Ghi chú nghiệp vụ
- Seller không được sửa trực tiếp hồ sơ qua `PUT /api/auth/profile`.
- Seller chỉ được gửi yêu cầu qua `POST /api/auth/profile-change-request`.
- Mật khẩu vẫn cho đổi trực tiếp qua `POST /api/auth/change-password`.
