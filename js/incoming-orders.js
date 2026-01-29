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

// In loadOrders:
async function loadOrders() {
    console.log('📋 Loading orders for shop:', shopId);
    const orders = await fetchData(`/orders/shop/${shopId}`);
    console.log('Fetched orders:', orders);
    const list = document.getElementById('orders-list');
    list.innerHTML = '';
    
    if (!orders || orders.length === 0) {
        list.innerHTML = '<p>No orders yet</p>';
        return;
    }
    
    orders.forEach(order => {
        console.log('Processing order:', order);
        
        const div = document.createElement('div');
        let buttons = '';
        if (order.order_status === 'pending') {
            buttons = `<button class="confirm-btn" data-id="${order.id}">Confirm</button>
                       <button class="reject-btn" data-id="${order.id}">Reject</button>`;
        } else if (order.order_status === 'confirmed') {
            if (order.payment_method === 'upi' && order.payment_status === 'pending') {
                buttons = `<button class="mark-paid-btn" data-id="${order.id}">Mark Paid</button>`;
            } else {
                buttons = `<button class="deliver-btn" data-id="${order.id}">Mark Delivered</button>`;
            }
        }
        div.innerHTML = `
            <h3>Order ${order.order_id}</h3>
            <p>Book: ${order.book_name || 'N/A'}</p>
            <p>Student: ${order.student_name} | Phone: ${order.student_phone}</p>
            <p>Address: ${order.student_address}</p>
            <p>Payment: ${order.payment_method} (${order.payment_status})</p>
            ${order.transaction_id ? `<p>Transaction ID: ${order.transaction_id}</p>` : ''}
            <p>Status: ${order.order_status}</p>
            ${buttons}
        `;
        list.appendChild(div);
    });
    
    // Attach event listeners
    document.querySelectorAll('.confirm-btn').forEach(btn => {
        btn.addEventListener('click', (e) => updateStatus(e.target.dataset.id, 'confirmed'));
    });
    document.querySelectorAll('.reject-btn').forEach(btn => {
        btn.addEventListener('click', (e) => updateStatus(e.target.dataset.id, 'rejected'));
    });
    document.querySelectorAll('.deliver-btn').forEach(btn => {
        btn.addEventListener('click', (e) => updateStatus(e.target.dataset.id, 'delivered'));
    });
    document.querySelectorAll('.mark-paid-btn').forEach(btn => {
        btn.addEventListener('click', (e) => markPaid(e.target.dataset.id));
    });
}

async function updateStatus(id, status) {
    console.log('Updating order', id, 'to status:', status);
    const result = await fetchData(`/orders/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
    if (status === 'confirmed') {
        // Update stock
        await fetchData(`/books/${result.book_id}/stock`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ in_stock: 0 }) });
    }
    loadOrders();
}

// Mark payment as paid
async function markPaid(id) {
    console.log('Marking order', id, 'as paid');
    await fetchData(`/orders/${id}/pay`, { method: 'PUT' });
    loadOrders();
}

loadOrders();

// Auto-refresh orders every 5 seconds
setInterval(() => {
    console.log('🔄 Auto-refreshing orders...');
    loadOrders();
}, 5000);

// Sidebar toggle
const sidebarToggle = document.getElementById('sidebar-toggle');
const sidebar = document.getElementById('sidebar');

if (sidebarToggle) {
    sidebarToggle.addEventListener('click', () => {
        sidebar.classList.toggle('open');
    });
}

// Close sidebar when clicking outside
document.addEventListener('click', (e) => {
    if (sidebar && sidebarToggle && !sidebar.contains(e.target) && !sidebarToggle.contains(e.target)) {        sidebar.classList.remove('open');
    }
});