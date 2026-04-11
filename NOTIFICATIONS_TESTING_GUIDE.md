# Task 5: Notifications System - Testing Guide

## 🎯 Overview
This guide provides step-by-step instructions to test the complete notifications system implementation, including:
- Backend API endpoints
- Real-time WebSocket delivery
- Frontend UI integration
- Cross-dashboard deployment

---

## 📋 Pre-Testing Checklist

### Backend Setup
- ✅ Install Socket.io: `npm install socket.io`
- ✅ WebSocket service created: `services/webSocketService.ts`
- ✅ Notification service updated with WebSocket emit
- ✅ Server.ts configured to initialize Socket.io on port 5000
- ✅ All notification routes registered

### Frontend Setup
- ✅ Notification bell component created
- ✅ WebSocket client created: `ws-client.js`
- ✅ Notification bell deployed to:
  - ✅ Buyer dashboard (all pages)
  - ✅ Seller dashboard (indexSeller.html)
  - ✅ Admin dashboard (indexAdmin.html)

### Database
- ✅ `notifications` table created with proper schema
- ✅ Indexes on user_id and is_read for performance

---

## 🚀 Testing Scenarios

### Test 1: Order Status Change Notification

**Setup:**
1. Start backend: `npm run dev`
2. Login as buyer in browser
3. Verify notification bell appears in header with badge

**Execute:**
```bash
# Via API or Admin Panel:
# Update order status from 'paid' -> 'shipped'
PUT /api/orders/{orderId}/status
{
  "status": "shipped",
  "reason": "Order is on the way"
}
```

**Expected Results:**
- ✅ Seller receives real-time notification (WebSocket or polling)
- ✅ Notification shows: "Order #... shipped"
- ✅ Badge count updates immediately
- ✅ Notification appears in dropdown
- ✅ Entry saved to database with `is_read = 0`

---

### Test 2: Escrow Release Notification

**Setup:**
1. Create order with buyer logged in
2. Pay for order (escrow status: `held`)
3. Login as seller

**Execute:**
```bash
# Buyer confirms delivery
PUT /api/orders/{orderId}/confirm-delivery
```

**Expected Results:**
- ✅ Seller receives notification: "Escrow released - {amount} đ"
- ✅ Notification link points to wallet
- ✅ Badge updates in real-time
- ✅ Database shows notification created

---

### Test 3: Escrow Refund Notification

**Setup:**
1. Create order with escrow held
2. Login as buyer

**Execute:**
```bash
# Request refund
POST /api/escrow/refund
{
  "orderId": "{orderId}",
  "reason": "Item damaged"
}
```

**Expected Results:**
- ✅ Buyer receives notification: "Refund processed - {amount} đ"
- ✅ Badge updates immediately
- ✅ Notification appears in dropdown with timestamp

---

### Test 4: Dispute Chat Message Notification

**Setup:**
1. Create order and mark as shipped
2. Create dispute as buyer
3. Login as seller

**Execute:**
```bash
# Buyer sends chat message
POST /api/disputes/{disputeId}/chat
{
  "message": "The product arrived damaged",
  "attachments": []
}
```

**Expected Results:**
- ✅ Seller receives notification: "Buyer replied to dispute"
- ✅ Message preview shows in notification
- ✅ Badge updates
- ✅ Link navigates to dispute detail page

---

### Test 5: Real-time WebSocket Delivery

**Prerequisite:** Browser console open (F12)

**Execute:**
1. Login as buyer in two browser windows/tabs
2. In Window A, trigger order status change
3. Watch Window B's console

**Expected Results:**
- ✅ Window B console shows: `📨 New notification received`
- ✅ Badge updates without page refresh
- ✅ Browser notification pops up (if permission granted)
- ✅ Polling fallback if WebSocket unavailable

---

### Test 6: Notification Bell UI (Buyer Dashboard)

**Execute:**
1. Login as buyer
2. Navigate to buyer-home

**Expected Results:**
- ✅ 🔔 bell appears in top-right header
- ✅ Badge shows red count (if unread > 0)
- ✅ Click bell → dropdown opens
- ✅ Dropdown shows last 10 notifications
- ✅ Each notification shows: icon, title, message, time
- ✅ Unread notifications have blue highlight + left border
- ✅ Click notification → marked as read, highlight removed
- ✅ "Mark all as read" button works
- ✅ Delete button (✕) appears on hover
- ✅ Close dropdown when clicking outside

---

### Test 7: Notification Bell UI (Seller Dashboard)

**Execute:**
1. Login as seller
2. Navigate to seller dashboard (indexSeller.html)
3. Repeat same interactions as Test 6

**Expected Results:**
- ✅ Bell appears in seller dashboard topbar
- ✅ All functionality works identically to buyer dashboard
- ✅ Seller notifications display correctly

---

### Test 8: Notification Bell UI (Admin Dashboard)

**Execute:**
1. Login as admin
2. Navigate to admin dashboard (indexAdmin.html)
3. Repeat same interactions

**Expected Results:**
- ✅ Bell appears in admin dashboard topbar
- ✅ All functionality works
- ✅ Admin can see all types of notifications

---

### Test 9: API Endpoints

#### 9a. GET /api/notifications (Paginated List)

**Execute:**
```bash
curl -H "Authorization: Bearer {token}" \
  http://localhost:5000/api/notifications?page=1&limit=10
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": "uuid",
        "user_id": "uuid",
        "type": "order",
        "title": "Order shipped",
        "message": "Your order has shipped",
        "link": "/buyer/orders/...",
        "is_read": 0,
        "created_at": "2026-04-11T10:00:00Z"
      }
    ],
    "unreadCount": 3,
    "total": 15
  }
}
```

#### 9b. GET /api/notifications/unread (Quick Preview)

**Execute:**
```bash
curl -H "Authorization: Bearer {token}" \
  http://localhost:5000/api/notifications/unread
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "notifications": [/* 5 most recent unread */],
    "unreadCount": 3
  }
}
```

#### 9c. PUT /api/notifications/{id}/read (Mark As Read)

**Execute:**
```bash
curl -X PUT -H "Authorization: Bearer {token}" \
  http://localhost:5000/api/notifications/{notifId}/read \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Notification marked as read",
  "data": { "id": "uuid" }
}
```

#### 9d. PUT /api/notifications/read-all (Mark All As Read)

**Execute:**
```bash
curl -X PUT -H "Authorization: Bearer {token}" \
  http://localhost:5000/api/notifications/read-all \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "All notifications marked as read",
  "data": { "updated": 5 }
}
```

#### 9e. DELETE /api/notifications/{id} (Delete Single)

**Execute:**
```bash
curl -X DELETE -H "Authorization: Bearer {token}" \
  http://localhost:5000/api/notifications/{notifId}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Notification deleted",
  "data": { "id": "uuid" }
}
```

#### 9f. DELETE /api/notifications/delete-all (Delete All with Confirmation)

**Execute:**
```bash
curl -X DELETE -H "Authorization: Bearer {token}" \
  http://localhost:5000/api/notifications/delete-all \
  -H "Content-Type: application/json" \
  -d '{"confirmed": true}'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "All notifications deleted",
  "data": { "deleted": 5 }
}
```

---

### Test 10: Polling Fallback

**Setup:**
1. Open Chrome DevTools
2. Disable WebSocket in DevTools Network settings
3. Or use a browser without WebSocket support

**Execute:**
1. Login and observe notification behavior
2. Trigger a notification event

**Expected Results:**
- ✅ System falls back to 5-second polling
- ✅ Notifications still arrive (with ~5s delay)
- ✅ Badge still updates
- ✅ No JavaScript errors

---

### Test 11: Multi-Tab Synchronization

**Execute:**
1. Open 2 tabs of buyer dashboard
2. In Tab A, click "Mark all as read"
3. Watch Tab B

**Expected Results:**
- ✅ Tab B updates within 5 seconds (polling)
- ✅ Or instantly (if WebSocket enabled)
- ✅ Both tabs stay in sync

---

### Test 12: Logout/Login Behavior

**Execute:**
1. Login as buyer → notifications load
2. Click logout
3. Login as different user

**Expected Results:**
- ✅ Previous user's notifications cleared
- ✅ New user's notifications load
- ✅ No data leakage
- ✅ WebSocket connection reestablished

---

## 🐛 Troubleshooting

### Issue: Bell doesn't appear

**Solution:**
- Check: `localStorage.getItem('accessToken')` returns a token
- Check: JavaScript console for errors
- Check: `notification-visibility.js` is loaded

### Issue: Notifications not arriving

**Solution:**
- Check server is running: `npm run dev`
- Check: Network tab → WebSocket connection or /api/notifications requests
- Check: Browser console → any errors?
- Check: Database has notification records: `SELECT * FROM notifications;`

### Issue: WebSocket disconnects

**Solution:**
- Check backend logs for socket errors
- Verify auth token is valid
- Check CORS settings in webSocketService.ts

### Issue: Browser notification permission

**Solution:**
- Allow notifications when prompted
- Or manually enable in browser settings
- Not required for dropdown notifications to work

---

## ✅ Final Validation Checklist

- [ ] All 6 API endpoints respond with proper status codes
- [ ] Notifications appear in real-time via WebSocket
- [ ] Notifications appear with polling fallback
- [ ] Badge counter accurate
- [ ] Dropdown shows last 10 notifications
- [ ] Mark as read works (unread disappears, is_read → 1)
- [ ] Delete notification works
- [ ] Bell visible on buyer, seller, admin dashboards
- [ ] No console errors
- [ ] Database records created properly
- [ ] Multi-user isolation (no data leakage)
- [ ] Logout/login cycle works correctly

---

## 📊 Expected Database State After Tests

```sql
-- Check notifications table
SELECT COUNT(*) as total, 
       SUM(is_read = 0) as unread,
       SUM(is_read = 1) as read
FROM notifications;

-- Check by type
SELECT type, COUNT(*) as count
FROM notifications
GROUP BY type;

-- Sample recent notifications
SELECT id, user_id, type, title, is_read, created_at
FROM notifications
ORDER BY created_at DESC
LIMIT 10;
```

---

## 🎉 Success Criteria

All tests pass when:
1. ✅ Backend API responds correctly
2. ✅ Real-time WebSocket works
3. ✅ Polling fallback functional
4. ✅ Frontend UI displays properly on all 3 dashboards
5. ✅ Database records created/updated correctly
6. ✅ No security issues or data leaks
7. ✅ Performance acceptable (instant UI updates)
