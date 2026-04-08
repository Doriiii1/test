// ============================================================
// O'Future Checkout - E2E MO-MO & BANK QR INTEGRATION
// ============================================================

const currentUser = JSON.parse(localStorage.getItem('user')) || {};
const CART_KEY = currentUser.id ? `cart_${currentUser.id}` : 'cart';

let checkoutCart = JSON.parse(localStorage.getItem('checkoutCart')) || [];
let totalPayAmount = 0;
let currentPaymentId = null;

// ── 1. UTILITIES ──────────────────────────────────────────
function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast ${type} show`;
  setTimeout(() => toast.classList.remove('show'), 3000);
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

// ── 2. INITIALIZE UI ──────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  if (checkoutCart.length === 0) {
    showToast('Không có sản phẩm nào để thanh toán', 'error');
    setTimeout(() => window.location.href = '../buyer-cart/index.html', 1500);
    return;
  }

  // Auto-fill thông tin người dùng
  if(currentUser.fullName) document.getElementById('shipName').value = currentUser.fullName;
  if(currentUser.phone) document.getElementById('shipPhone').value = currentUser.phone;

  renderSummary();
});

function renderSummary() {
  // Đã trỏ đúng vào ID orderSummaryList trong file HTML của bạn
  const container = document.getElementById('orderSummaryList');

  if (!container) {
      console.warn("Không tìm thấy vùng chứa sản phẩm trên HTML");
      return;
  }

  const subtotal = checkoutCart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const platformFee = subtotal * 0.025; // Phí 2.5% theo logic cũ
  totalPayAmount = subtotal + platformFee;

  container.innerHTML = checkoutCart.map(item => `
    <div class="checkout-item" style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px dashed #eee;">
      <span>${item.name} (x${item.quantity})</span>
      <strong>${formatCurrency(item.price * item.quantity)}</strong>
    </div>
  `).join('');

  document.getElementById('subtotal').textContent = formatCurrency(subtotal);
  document.getElementById('platformFee').textContent = formatCurrency(platformFee);
  document.getElementById('totalAmount').textContent = formatCurrency(totalPayAmount);
}

// ── 3. MAIN PAYMENT LOGIC ──────────────────────────────────
document.getElementById('confirmCheckoutBtn').onclick = async function() {
  const btn = this;
  
  const paymentMethodInput = document.querySelector('input[name="payMethod"]:checked');
  if (!paymentMethodInput) {
      return showToast('Vui lòng chọn phương thức thanh toán!', 'error');
  }
  const paymentMethod = paymentMethodInput.value;

  const street = document.getElementById('shipStreet').value;
  const city = document.getElementById('shipCity').value;
  const country = document.getElementById('shipCountry').value;
  const zip = document.getElementById('shipZip').value;

  const shipData = {
    name: document.getElementById('shipName').value,
    phone: document.getElementById('shipPhone').value,
    address: `${street}, ${city}, ${country}, ZIP: ${zip}`,
    notes: document.getElementById('orderNotes') ? document.getElementById('orderNotes').value : ''
  };

  if (!shipData.name || !shipData.phone || !street || !city) {
    return showToast('Vui lòng điền đầy đủ thông tin giao hàng', 'error');
  }

  try {
    btn.disabled = true;
    btn.textContent = "Đang xử lý...";

    // ==========================================
    // BƯỚC 1: TẠO ĐƠN HÀNG (SỬA LỖI 422 Ở ĐÂY)
    // ==========================================
    let firstOrderId = null;

    // Lặp qua từng sản phẩm trong giỏ và gọi API chuẩn 1 Đơn = 1 Sản phẩm
    for (const item of checkoutCart) {
      const itemSubtotal = item.price * item.quantity;
      const itemTotalAmount = itemSubtotal + (itemSubtotal * 0.025); // Giá + 2.5% phí

      const payload = {
        productId: item.id,
        sellerId: item.sellerId || item.sellerUsername || null,
        quantity: item.quantity,
        unitPrice: item.price,
        totalAmount: itemTotalAmount,
        shippingAddress: shipData,
        notes: shipData.notes
      };

      const res = await fetchAPI('/orders', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      
      // Lấy Order ID của đơn hàng đầu tiên để gắn vào phiên thanh toán MoMo/QR
      if (!firstOrderId) {
        firstOrderId = res.data.id || res.data.orderId;
      }
    }

    // ==========================================
    // BƯỚC 2: GỌI THANH TOÁN MOMO HOẶC BANK QR
    // ==========================================
    if (paymentMethod === 'MOMO_QR') {
      await handleMoMoPayment(firstOrderId, totalPayAmount);
    } else {
      await handleBankQRPayment(firstOrderId, totalPayAmount);
    }

  } catch (error) {
    showToast(error.message || 'Lỗi xử lý đơn hàng: Validation Failed', 'error');
    btn.disabled = false;
    btn.textContent = "Xác nhận & Thanh Toán";
  }
};

// ── 4. XỬ LÝ MOMO (REDIRECT E2E) ────────────────────────────
async function handleMoMoPayment(orderId, amount) {
  showToast('Đang kết nối cổng thanh toán MoMo...');
  
  try {
    const response = await fetchAPI('/payments/momo/create', {
      method: 'POST',
      body: JSON.stringify({ orderId, amount })
    });

    // Chuyển hướng trình duyệt sang cổng thanh toán của MoMo
    if (response.data && response.data.payUrl) {
      window.location.href = response.data.payUrl;
    } else {
      throw new Error("Không nhận được link thanh toán từ MoMo");
    }
  } catch (error) {
    throw error;
  }
}

// ── 5. XỬ LÝ BANK QR (ESCROW) ───────────────────────────────
async function handleBankQRPayment(orderId, amount) {
  showToast('Đang tạo mã QR...');

  try {
    const response = await fetchAPI('/payments/qr/create', {
      method: 'POST',
      body: JSON.stringify({ orderId, amount })
    });

    currentPaymentId = response.data.paymentId;
    const qrCodeData = response.data.qrCodeImage || response.data.qrCode;

    // Bật Modal QR
    const modal = document.getElementById('qrModal');
    const qrImg = document.getElementById('qrCodeImg');
    const title = document.getElementById('qrTitle');
    
    qrImg.src = qrCodeData;
    title.textContent = "Quét mã thanh toán";
    
    document.getElementById('qrModalOverlay').style.display = 'block';
    modal.style.display = 'block';

    document.getElementById('finishPaymentBtn').onclick = async () => {
      showToast('Đã ghi nhận! Vui lòng chờ hệ thống xác nhận tiền vào ví.', 'success');
      
      localStorage.removeItem('checkoutCart');
      localStorage.setItem(CART_KEY, JSON.stringify([]));

      setTimeout(() => {
        window.location.href = '../buyer-orders/index.html';
      }, 2000);
    };

  } catch (error) {
    throw error;
  }
}

window.closeQrModal = function() {
  document.getElementById('qrModalOverlay').style.display = 'none';
  document.getElementById('qrModal').style.display = 'none';
  document.getElementById('confirmCheckoutBtn').disabled = false;
  document.getElementById('confirmCheckoutBtn').textContent = "Xác nhận & Lấy Mã QR";
};