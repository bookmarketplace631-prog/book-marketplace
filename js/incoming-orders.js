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

// In loadOrders:
async function loadOrders() {
    const orders = await fetchData(`/orders/shop/${shopId}`);
    console.log('Fetched orders:', orders);
    const list = document.getElementById('orders-list');
    list.innerHTML = '';
    orders.forEach(order => {
        console.log('Processing order:', order);
        
        const div = document.createElement('div');
        let buttons = '';
        if (order.status === 'pending') {
            buttons = `<button onclick="updateStatus(${order.id}, 'confirmed')">Confirm</button>
                       <button onclick="updateStatus(${order.id}, 'rejected')">Reject</button>`;
        } else if (order.status === 'confirmed') {
            if (order.payment_method === 'upi' && order.payment_status === 'pending') {
                buttons = `<button onclick="markPaid(${order.id})">Mark Paid</button>`;
            } else {
                buttons = `<button onclick="updateStatus(${order.id}, 'delivered')">Mark Delivered</button>`;
            }
        }
                div.innerHTML = `
            <h3>Order ${order.order_id}</h3>
            <p>Book: ${order.book_name}</p>
            <p>Student: ${order.student_name} | Phone: ${order.student_phone}</p>
            <p>Address: ${order.student_address}</p>
            <p>Payment: ${order.payment_method} (${order.payment_status})</p>
            ${order.transaction_id ? `<p>Transaction ID: ${order.transaction_id}</p>` : ''}
            <p>Status: ${order.status}</p>
            ${buttons}
        `;
        list.appendChild(div);
    });
}

async function updateStatus(id, status) {
    const result = await fetchData(`/orders/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
    if (status === 'confirmed') {
        // Update stock
        await fetchData(`/books/${result.book_id}/stock`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ in_stock: 0 }) });
    }
    loadOrders();
}

// Mark payment as paid
async function markPaid(id) {
    await fetchData(`/orders/${id}/pay`, { method: 'PUT' });
    loadOrders();
}
loadOrders();

// Sidebar toggle
document.getElementById('sidebar-toggle').addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('open');
});

// Close sidebar when clicking outside
document.addEventListener('click', (e) => {
    const sidebar = document.getElementById('sidebar');
    const toggle = document.getElementById('sidebar-toggle');
    if (!sidebar.contains(e.target) && !toggle.contains(e.target)) {
        sidebar.classList.remove('open');
    }
});
