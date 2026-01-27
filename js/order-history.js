const API_BASE = 'http://localhost:3000';
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
    const orders = await fetchData(`/orders/shop/${shopId}?status=delivered`);
    const list = document.getElementById('history-list');
    list.innerHTML = '';
    orders.forEach(order => {
        const div = document.createElement('div');
        div.innerHTML = `
            <h3>Order ${order.order_id}</h3>
            <p>Book: ${order.book_name}</p>
            <p>Student: ${order.student_name} | Phone: ${order.student_phone}</p>
            <p>Address: ${order.student_address}</p>
            <p>Payment: ${order.payment_method}</p>
            <p>Status: Delivered | Delivered on: ${new Date(order.created_at).toLocaleDateString()}</p>
        `;
        list.appendChild(div);
    });
}

loadHistory();