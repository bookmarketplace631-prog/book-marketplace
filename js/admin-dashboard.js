// Using API_BASE from config.js

if (!localStorage.getItem('admin_logged_in')) {
    window.location.href = 'admin-login.html';
}

async function fetchData(endpoint, options = {}) {
    try {
        const response = await fetch(`${API_BASE}${endpoint}`, options);
        return await response.json();
    } catch (error) {
        console.error('Fetch error:', error);
    }
}

// Load analytics
async function loadAnalytics() {
    const analytics = await fetchData('/admin/analytics');
    if (analytics && !analytics.error) {
        document.getElementById('total-shops').textContent = analytics.totalShops;
        document.getElementById('verified-shops').textContent = analytics.verifiedShops;
        document.getElementById('total-books').textContent = analytics.totalBooks;
        document.getElementById('total-orders').textContent = analytics.totalOrders;
        document.getElementById('total-revenue').textContent = analytics.totalRevenue;
        document.getElementById('avg-rating').textContent = analytics.avgRating.toFixed(1);

        // Top books
        const topBooksList = document.getElementById('top-books');
        topBooksList.innerHTML = analytics.topBooks.map(book => `<li>${book.book_name} - ${book.sales} sales</li>`).join('');

        // Monthly revenue
        const monthlyList = document.getElementById('monthly-revenue');
        monthlyList.innerHTML = analytics.monthlyRevenue.map(m => `<li>${m.month}: ₹${m.revenue}</li>`).join('');
    } else {
        console.error('Error loading analytics:', analytics?.error);
    }
}

// Load shops
async function loadShops() {
    const shops = await fetchData('/admin/shops');
    if (!shops || shops.error) {
        console.error('Error loading shops:', shops?.error);
        return;
    }
    const tbody = document.getElementById('shops-table');
    tbody.innerHTML = shops.map(shop => `
        <tr>
            <td>${shop.shop_name}</td>
            <td>${shop.owner_name}</td>
            <td>${shop.phone}</td>
            <td>${shop.city}</td>
            <td>${shop.avg_rating.toFixed(1)} (${shop.review_count})</td>
            <td>${shop.verified ? 'Yes' : 'No'}</td>
            <td>
                ${!shop.verified ? `<button class="approve-btn" data-id="${shop.id}">Approve</button>` : ''}
                <button class="reject-btn" data-id="${shop.id}">Reject</button>
            </td>
        </tr>
    `).join('');

    // Add event listeners
    tbody.querySelectorAll('.approve-btn').forEach(btn => {
        btn.addEventListener('click', (e) => approveShop(e.target.dataset.id));
    });
    tbody.querySelectorAll('.reject-btn').forEach(btn => {
        btn.addEventListener('click', (e) => rejectShop(e.target.dataset.id));
    });
}

async function approveShop(id) {
    const result = await fetchData(`/admin/shops/${id}/verify`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verified: 1, notification: 'Your shop has been approved!' })
    });
    if (result.message) {
        loadShops();
    }
}

async function rejectShop(id) {
    const notification = prompt('Reason for rejection:');
    const result = await fetchData(`/admin/shops/${id}/verify`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verified: 0, notification })
    });
    if (result.message) {
        loadShops();
    }
}

async function loadShopRequests() {
    const shops = await fetchData('/admin/shops?verified=0');
    const list = document.getElementById('shops-list');
    list.innerHTML = shops.map(shop => `
        <div>
            <h3>${shop.shop_name}</h3>
            <p>Owner: ${shop.owner_name}, Phone: ${shop.phone}, City: ${shop.city}</p>
            <button class="approve-btn" data-id="${shop.id}">Approve</button>
            <button class="reject-btn" data-id="${shop.id}">Reject</button>
        </div>
    `).join('');

    // Add event listeners
    list.querySelectorAll('.approve-btn').forEach(btn => {
        btn.addEventListener('click', (e) => approveShop(e.target.dataset.id));
    });
    list.querySelectorAll('.reject-btn').forEach(btn => {
        btn.addEventListener('click', (e) => rejectShop(e.target.dataset.id));
    });
}

async function loadStudents() {
    const students = await fetchData('/admin/students');
    const list = document.getElementById('students-list');
    list.innerHTML = students.map(student => `
        <div>
            <h3>${student.student_name}</h3>
            <p>Phone: ${student.phone}, Grade: ${student.grade}</p>
            <button onclick="deleteStudent(${student.id})">Delete</button>
        </div>
    `).join('');
}

async function loadOrders() {
    const orders = await fetchData('/admin/orders');
    const list = document.getElementById('orders-list');
    list.innerHTML = orders.map(order => `
        <div>
            <h3>Order ${order.order_id}</h3>
            <p>Student: ${order.student_name}, Book: ${order.book_name}, Amount: ₹${order.amount}, Status: ${order.payment_status}</p>
            <button onclick="updateOrderStatus(${order.id})">Update Status</button>
        </div>
    `).join('');
}

async function deleteStudent(id) {
    if (confirm('Delete this student?')) {
        await fetchData(`/admin/students/${id}`, { method: 'DELETE' });
        loadStudents();
    }
}

async function updateOrderStatus(id) {
    const status = prompt('New status:');
    if (status) {
        await fetchData(`/admin/orders/${id}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ payment_status: status })
        });
        loadOrders();
    }
}

loadAnalytics();
loadShops();

// Event listeners
document.getElementById('shop-requests-btn').addEventListener('click', () => {
    document.getElementById('shop-requests-section').style.display = 'block';
    document.getElementById('manage-shops-section').style.display = 'none';
    document.getElementById('manage-students-section').style.display = 'none';
    document.getElementById('manage-orders-section').style.display = 'none';
    // Load shop requests (unverified shops)
    loadShopRequests();
});

document.getElementById('manage-shops-btn').addEventListener('click', () => {
    document.getElementById('shop-requests-section').style.display = 'none';
    document.getElementById('manage-shops-section').style.display = 'block';
    document.getElementById('manage-students-section').style.display = 'none';
    document.getElementById('manage-orders-section').style.display = 'none';
});

document.getElementById('manage-students-btn').addEventListener('click', () => {
    document.getElementById('shop-requests-section').style.display = 'none';
    document.getElementById('manage-shops-section').style.display = 'none';
    document.getElementById('manage-students-section').style.display = 'block';
    document.getElementById('manage-orders-section').style.display = 'none';
    loadStudents();
});

document.getElementById('manage-orders-btn').addEventListener('click', () => {
    document.getElementById('shop-requests-section').style.display = 'none';
    document.getElementById('manage-shops-section').style.display = 'none';
    document.getElementById('manage-students-section').style.display = 'none';
    document.getElementById('manage-orders-section').style.display = 'block';
    loadOrders();
});

document.getElementById('bulk-approve-btn').addEventListener('click', async () => {
    if (confirm('Approve all pending shops?')) {
        const result = await fetchData('/admin/shops/bulk-approve', { method: 'POST' });
        if (result.message) {
            alert(result.message);
            loadAnalytics();
            loadShops();
        }
    }
});

document.getElementById('export-orders-btn').addEventListener('click', () => {
    window.open('/admin/export/orders', '_blank');
});

document.getElementById('export-shops-btn').addEventListener('click', () => {
    window.open('/admin/export/shops', '_blank');
});