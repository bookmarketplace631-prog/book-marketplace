// Using API_BASE from config.js
const shopId = localStorage.getItem('shop_id');

if (!shopId) window.location.href = 'shop-login.html';

async function fetchData(endpoint, options = {}) {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, options);
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
