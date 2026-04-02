// api.js - Xử lý mọi kết nối từ FE gọi lên BE Node.js
const CONFIG = {
  // Tự động nhận diện môi trường để chuyển URL, tránh hardcode chết
  API_BASE_URL: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
    ? 'http://localhost:5000/api' 
    : 'https://your-production-api.com/api'
};

async function fetchAPI(endpoint, options = {}) {
  // Lấy token chuẩn từ localStorage (do login.js đã lưu trước đó)
  const token = localStorage.getItem('accessToken');
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${CONFIG.API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    // Xử lý mất phiên đăng nhập (Token hết hạn / bị BE từ chối)
    if (response.status === 401) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      window.location.href = 'loginbd.html/login.html';
      throw new Error('Phiên đăng nhập hết hạn');
    }

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || `Lỗi HTTP: ${response.status}`);
    }
    return data;
  } catch (error) {
    console.error('[API Error]:', error);
    throw error;
  }
}