// Using API_BASE from config.js
const shopId = localStorage.getItem('shop_id');

if (!shopId) window.location.href = 'shop-login.html';

async function fetchData(endpoint, options = {}) {
  try {
    // Add cache-busting timestamp to ensure fresh data
    const separator = endpoint.includes('?') ? '&' : '?';
    const url = `${API_BASE}${endpoint}${separator}t=${Date.now()}`;
    const response = await fetch(url, {
      ...options,
      cache: 'no-store' // Don't cache this request
    });
    return await response.json();
  } catch (error) {
    console.error('Fetch error:', error);
  }
}

// Load delivered orders
async function loadHistory() {
    console.log('📋 Loading delivered orders for shop:', shopId);
    const orders = await fetchData(`/orders/shop/${shopId}?status=delivered`);
    console.log('Fetched delivered orders:', orders);
    const list = document.getElementById('history-list');
    list.innerHTML = '';
    
    if (!orders || orders.length === 0) {
        list.innerHTML = '<p>No delivered orders yet</p>';
        return;
    }
    
    orders.forEach(order => {
        const div = document.createElement('div');
        div.innerHTML = `
            <h3>Order ${order.order_id}</h3>
            <p>Book: ${order.book_name || 'N/A'}</p>
            <p>Student: ${order.student_name} | Phone: ${order.student_phone}</p>
            <p>Address: ${order.student_address}</p>
            <p>Payment: ${order.payment_method}</p>
            <p>Status: Delivered | Delivered on: ${new Date(order.created_at).toLocaleDateString()}</p>
        `;
        list.appendChild(div);
    });
}

loadHistory();

// Auto-refresh orders every 5 seconds
setInterval(() => {
    console.log('🔄 Auto-refreshing delivered orders...');
    loadHistory();
}, 5000);
