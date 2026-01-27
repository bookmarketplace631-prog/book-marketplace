const API_BASE = 'http://localhost:3000';

const shopId = localStorage.getItem('shop_id');

if (!shopId) {
    window.location.href = 'shop-login.html';
}

// Load profile
async function loadProfile() {
    const response = await fetch(`${API_BASE}/shops/${shopId}/profile`);
    const data = await response.json();
    if (data) {
        document.getElementById('shop_name').value = data.shop_name || '';
        document.getElementById('owner_name').value = data.owner_name || '';
        document.getElementById('phone').value = data.phone || '';
        document.getElementById('address').value = data.address || '';
        document.getElementById('city').value = data.city || '';
        if (data.logo_url) document.getElementById('current-logo').src = data.logo_url;
        if (data.banner_url) document.getElementById('current-banner').src = data.banner_url;
    }
}

// Update profile
document.getElementById('profile-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('shop_name', document.getElementById('shop_name').value);
    formData.append('owner_name', document.getElementById('owner_name').value);
    formData.append('phone', document.getElementById('phone').value);
    formData.append('address', document.getElementById('address').value);
    formData.append('city', document.getElementById('city').value);
    if (document.getElementById('logo').files[0]) formData.append('logo', document.getElementById('logo').files[0]);
    if (document.getElementById('banner').files[0]) formData.append('banner', document.getElementById('banner').files[0]);

    const response = await fetch(`${API_BASE}/shops/${shopId}/profile`, {
        method: 'PUT',
        body: formData
    });

    if (response.ok) {
        alert('Profile updated successfully!');
        loadProfile();
    } else {
        alert('Failed to update profile');
    }
});

loadProfile();
loadNotifications();

// Load notifications
async function loadNotifications() {
    const notifications = await fetch(`${API_BASE}/notifications/shop/${shopId}`).then(r => r.json());
    const list = document.getElementById('notifications-list');
    list.innerHTML = notifications.map(n => `
        <div class="notification ${n.is_read ? 'read' : 'unread'}">
            <p>${n.message}</p>
            <small>${new Date(n.created_at).toLocaleString()}</small>
            ${!n.is_read ? `<button onclick="markRead(${n.id})">Mark as Read</button>` : ''}
        </div>
    `).join('');
}

async function markRead(id) {
    await fetch(`${API_BASE}/notifications/${id}/read`, { method: 'PUT' });
    loadNotifications();
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