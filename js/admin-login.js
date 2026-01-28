// Using API_BASE from config.js

async function fetchData(endpoint, options = {}) {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, options);
    return await response.json();
  } catch (error) {
    console.error('Fetch error:', error);
  }
}

document.getElementById('admin-login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    const result = await fetchData('/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });

   if (result && result.message === 'Login successful') {
    localStorage.setItem('admin_logged_in', 'true');
    window.location.href = 'admin-dashboard.html';
} else {
    document.getElementById('error').innerHTML = result?.error || 'Login failed';
}
});