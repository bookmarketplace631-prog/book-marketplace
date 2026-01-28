// Using API_BASE from config.js

const studentId = localStorage.getItem('student_id');
const studentName = localStorage.getItem('student_name');

if (!studentId) {
    window.location.href = 'student-login.html';
} else {
    document.getElementById('user-info').innerHTML = `Logged in as: ${studentName}`;
}

// Load profile
async function loadProfile() {
    const response = await fetch(`${API_BASE}/students/${studentId}`);
    const data = await response.json();
    if (data) {
        document.getElementById('name').value = data.name || '';
        document.getElementById('phone').value = data.phone || '';
        document.getElementById('address').value = data.address || '';
    }
}

// Update profile
document.getElementById('profile-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('name').value;
    const phone = document.getElementById('phone').value;
    const address = document.getElementById('address').value;

    const response = await fetch(`${API_BASE}/students/${studentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, address })
    });

    if (response.ok) {
        alert('Profile updated successfully!');
        // Update localStorage
        localStorage.setItem('student_name', name);
        localStorage.setItem('student_phone', phone);
        location.reload();
    } else {
        alert('Failed to update profile');
    }
});

loadProfile();
loadNotifications();

// Load notifications
async function loadNotifications() {
    const notifications = await fetch(`${API_BASE}/notifications/student/${studentId}`).then(r => r.json());
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
