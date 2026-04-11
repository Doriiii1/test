# O'Future E-Commerce - System Completion & Refactoring Guide
**Target Audience:** AI Coding Agent (Cursor, GitHub Copilot, etc.)
**Project Type:** Node.js, Express, MySQL backend + Vanilla HTML/CSS/JS frontend.
**Domain:** B2B/B2C Wholesale E-commerce Platform (Buyer, Seller, Admin).

## 🚨 CRITICAL DIRECTIVES (MUST FOLLOW) 🚨
1. **PRESERVE UI/UX EXACTLY:** Do NOT completely rewrite existing HTML structures or CSS files. You must keep the exact current layout, color scheme, and CSS conventions. When adding new features (e.g., a Wallet section or Variant dropdown), integrate them seamlessly into the existing design framework. Append, do not overwrite.
2. **CURRENCY IS strictly VND:** All financial calculations, database fields, and UI displays MUST be in Vietnamese Dong (VND). Format dynamically where necessary (e.g., `100,000 đ` or `100.000 VNĐ`). No USD or decimal cents.
3. **VIRTUAL MONEY FLOW:** The system operates on "Virtual Money" for now. Real bank withdrawals are not required. Ensure the logic flow is mathematically perfect.
4. SERVER CONFIGURATION: The backend strictly runs on port 5000. Whenever running curl commands, API tests, or checking server health, YOU MUST explicitly use http://localhost:5000. NEVER assume port 3000.

---

## 🛠 TASK LIST: MISSING FEATURES & REFACTORING

### 1. Wallet & Payment Integration (Virtual Flow)
- **MoMo Sandbox Integration:** The MoMo Dev test code exists but is disconnected. Wire it properly to the frontend checkout and wallet deposit flows.
- **Internal Wallet System:**
  - Create `wallets` and `wallet_transactions` tables.
  - When Escrow is `released`, the system MUST logically add the `net_amount` to the Seller's Wallet balance.
  - When Escrow is `refunded`, add funds back to the Buyer's Wallet.
  - Build UI components in Seller/Buyer dashboards to view current Wallet Balance and transaction history.

### 2. Multi-Item Cart & Order Workflow
- **Database Schema Update:** Refactor the `orders` table. Currently, it links directly to 1 `product_id`. 
  - Create an `order_items` table to support multi-item carts.
  - Create an `order_histories` table to track state changes (Pending -> Paid -> Shipped) with timestamps.
- **Vouchers & Shipping:** Add basic logic/fields for `shipping_fee` and `discount_amount` in the calculation of `total_amount`.

### 3. Wholesale & Catalog Features
- **Product Entity Updates:**
  - Add `minimum_quantity` (int) to products. Validate this during Cart/Checkout.
  - Add `wholesale_price` (or tier pricing) for bulk orders.
- **Product Variants:** Add a `product_variants` table (Size, Color, SKU, specific stock) to allow users to choose attributes before adding to the cart.
- **Categories:** Create an independent `categories` table (id, name, parent_id) instead of relying on raw VARCHAR strings. Update the frontend filtering to use this table.

### 4. Communication & Disputes
- **Dispute Negotiation Chat:** Before Admin resolves a dispute, Buyers and Sellers need a dedicated chat interface inside the Dispute details page to negotiate. 
- **Evidence Uploads:** Change `evidence_url` to `evidence_urls` (JSON array) to support multiple images/videos.
- **Review Replies:** Add functionality for Sellers to reply to Buyer reviews (`reply_text` in `reviews` table).

### 5. Notifications System
- **Database & API:** Create a `notifications` table (user_id, title, message, is_read, type, link).
- **Triggers:** Automatically generate notifications for:
  - Order status changes (e.g., "Your order #123 has shipped").
  - Escrow releases.
  - New chat messages.
- **Frontend:** Add a notification bell dropdown in the header that fetches and displays these alerts.

### 6. Security & Performance Refactoring
- **Failed Login Attempts:** Move the `failed_attempts` counter from MySQL to **Redis** to prevent database bottlenecks during Brute-force attacks.
- **Audit Logs:** The `logs` table will grow too fast. Implement a mechanism to archive old logs or ensure the AI ignores fetching massive log payloads on general Admin dashboard loads.

## [BUG TRACKER] Seller Dashboard & Synchronization Issues (Date: April 2026)

### 1. Issue: Self-Inflicted DDoS (HTTP 429 Too Many Requests)
* **Nguyên nhân:** Hàm `loadDashboardData()` trong `dashboard-seller/script.js` sử dụng `Promise.all()` để tải 6 luồng dữ liệu (Products, Orders, Escrow, Reviews, Disputes, Samples) cùng một lúc. Điều này ngay lập tức kích hoạt cơ chế phòng thủ `rateLimiter` của Backend (vượt quá số request cho phép trên 1 giây/phút).
* **Ảnh hưởng phụ:** Khi API bị block (429), module `notifications.js` (polling) tiếp tục gửi request khiến lỗi lặp lại liên tục (vòng lặp vô tận trên Console).
* **Giải pháp:** Chuyển từ "Tải song song" (`Promise.all`) sang "Tải tuần tự" (`await` từng dòng) ở Frontend, hoặc tăng ngưỡng giới hạn (limit) trong `middleware/rateLimiter.ts` của Backend.

### 2. Issue: Sai đường dẫn CSS / Lỗi MIME Type (text/html)
* **Nguyên nhân:** File `indexSeller.html` nhúng các file CSS (`buyer.css`, `notifications.css`) với đường dẫn sai. Hệ thống không tìm thấy file CSS nên trả về trang báo lỗi HTML (404 Not Found), khiến trình duyệt từ chối render vì sai MIME type.
* **Giải pháp:** Sửa lại đường dẫn thành `../dashboard-buyer/shared/...` hoặc tách hẳn một thư mục `shared/` nằm ở gốc dự án để cả Buyer và Seller cùng dùng chung. Tuyệt đối không để Seller dùng `buyer.css` để tránh xung đột UI.

### 3. Issue: Chưa đồng bộ Notification Component
* **Nguyên nhân:** Luồng Notifications được thiết kế chủ yếu cho Buyer, khi mang sang Seller, module `ws-client.js` và `notifications.js` thiết lập WebSockets thành công nhưng polling API bị chặn bởi Rate Limit.
* **Giải pháp:** Cần đồng bộ khoảng thời gian Polling (Interval) giãn ra (ví dụ 30-60 giây/lần) hoặc chuyển hoàn toàn sang WebSocket để tránh gọi API `/unread` liên tục.

---

## 💡 AI AGENT WORKFLOW INSTRUCTIONS
When the user asks you to implement one of the above features:
1. **Review Schema:** Check `config/schema.sql` first to understand existing foreign keys and relationships.
2. **Write SQL Migration:** Propose the exact `ALTER TABLE` or `CREATE TABLE` statements before modifying models.
3. **Update Backend:** Modify/Create the relevant Model, Controller, and Route.
4. **Update Frontend:** Wire the frontend JS (`api.js` or specific script files) to the new endpoints.
5. **UI Injection:** Carefully inject HTML/CSS using the exact class naming conventions found in the current files.