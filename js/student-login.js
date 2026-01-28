// Using API_BASE from config.js

document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const phone = document.getElementById('phone').value;
  const password = document.getElementById('password').value;
  const response = await fetch(`${API_BASE}/students/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, password })
  });
  if (response.ok) {
    const data = await response.json();
    localStorage.removeItem('shop_id');
    localStorage.setItem('student_id', data.student_id);
    localStorage.setItem('student_name', data.student_name || data.name);
    if (data.student_phone) localStorage.setItem('student_phone', data.student_phone);
    window.location.href = 'homepage.html';
  } else {
    alert('Login failed');
  }
});
