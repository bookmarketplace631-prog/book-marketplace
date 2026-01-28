// Using API_BASE from config.js

const studentId = localStorage.getItem('student_id');
const studentName = localStorage.getItem('student_name');

if (!studentId) {
    window.location.href = 'student-login.html';
} else {
    document.getElementById('user-info').innerHTML = `Logged in as: ${studentName}`;
}

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

async function fetchData(endpoint) {
    const response = await fetch(`${API_BASE}${endpoint}`);
    return await response.json();
}

// Load orders
async function loadOrders() {
    console.log('Loading orders for studentId:', studentId);
    try {
        const orders = await fetchData(`/orders/student/${studentId}`);
        console.log('Orders received:', orders);
        const ordersList = document.getElementById('orders-list');
        if (orders && Array.isArray(orders) && orders.length > 0) {
            ordersList.innerHTML = orders.map(order => `
                <div class="order-item">
                    <p>Order ID: ${order.order_id}</p>
                    <p>Book: ${order.book_name}</p>
                    <p>Status: ${order.status}</p>
                    <p>Payment: ${order.payment_method}</p>
                    <p>Payment Status: ${order.payment_status}</p>
                    <p>Date: ${new Date(order.created_at).toLocaleDateString()}</p>
                    ${order.status === 'pending' ? `<button onclick="cancelOrder(${order.id})">Cancel Order</button>` : ''}
                </div>
            `).join('');
        } else {
            ordersList.innerHTML = '<p>No orders found.</p>';
        }
    } catch (error) {
        console.error('Error loading orders:', error);
        document.getElementById('orders-list').innerHTML = '<p>Error loading orders. Please try again.</p>';
    }
}

async function cancelOrder(orderId) {
    if (confirm('Are you sure you want to cancel this order?')) {
        const result = await fetch(`${API_BASE}/orders/${orderId}/cancel`, { method: 'PUT' });
        if (result.ok) {
            alert('Order cancelled successfully');
            loadOrders();
        } else {
            alert('Failed to cancel order');
        }
    }
}

loadOrders();
