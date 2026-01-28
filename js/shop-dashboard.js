// Using API_BASE from config.js

const shopId = localStorage.getItem('shop_id');
const shopName = localStorage.getItem('shop_name');

if (!shopId) {
    window.location.href = 'shop-login.html';
}

async function fetchData(endpoint, options = {}) {
    try {
        const response = await fetch(`${API_BASE}${endpoint}`, options);
        return await response.json();
    } catch (error) {
        console.error('Fetch error:', error);
    }
}

// Global chart instance
let revenueChart = null;

// Load shop profile
async function loadShopProfile() {
    const profile = await fetchData(`/shops/${shopId}/profile`);
    if (profile) {
        document.getElementById('shop-info').textContent = `Welcome, ${profile.shop_name} (${profile.city})`;
        document.getElementById('upi-id').value = profile.upi_id || '';
    }
}

// Load analytics
async function loadAnalytics() {
    const analytics = await fetchData(`/shops/${shopId}/analytics`);
    if (analytics) {
        document.getElementById('total-orders').textContent = analytics.totalOrders;
        document.getElementById('total-revenue').textContent = analytics.totalRevenue;
        document.getElementById('today-revenue').textContent = analytics.todayRevenue;
        const monthlySum = analytics.monthlyRevenue ? analytics.monthlyRevenue.reduce((sum, r) => sum + (r.revenue || 0), 0) : 0;
        document.getElementById('monthly-revenue').textContent = monthlySum;
        document.getElementById('avg-rating').textContent = analytics.avgRating ? analytics.avgRating.toFixed(1) : '0';
    }
    loadRevenueChart();
}

// Load revenue chart
async function loadRevenueChart() {
    const analytics = await fetchData(`/shops/${shopId}/analytics`);
    if (analytics && analytics.monthlyRevenue) {
        const labels = analytics.monthlyRevenue.map(r => r.month);
        const data = analytics.monthlyRevenue.map(r => r.revenue || 0);
        const ctx = document.getElementById('revenueChart').getContext('2d');
        
        // Destroy existing chart if it exists
        if (revenueChart) {
            revenueChart.destroy();
        }
        
        revenueChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Monthly Revenue (₹)',
                    data: data,
                    backgroundColor: 'rgba(16, 185, 129, 0.6)',
                    borderColor: 'rgba(16, 185, 129, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }
}

// Update UPI ID
async function updateUpi() {
    const upiId = document.getElementById('upi-id').value.trim();
    const result = await fetchData(`/shops/${shopId}/upi`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ upi_id: upiId })
    });
    if (result.message) {
        alert('UPI ID updated successfully');
    } else {
        alert('Failed to update UPI ID');
    }
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
document.getElementById('logout').addEventListener('click', () => {
    localStorage.removeItem('shop_id');
    localStorage.removeItem('shop_name');
    window.location.href = 'shop-login.html';
});

// Shop profile link - removed, now direct link

// Load data on page load
loadShopProfile();
loadAnalytics();
