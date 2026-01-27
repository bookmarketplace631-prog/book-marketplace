const API_BASE = 'http://localhost:3000';

document.getElementById('register-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('name').value;
  const phone = document.getElementById('phone').value;
  const password = document.getElementById('password').value;
  const response = await fetch(`${API_BASE}/students/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, phone, password })
  });
  if (response.ok) {
    alert('Registered successfully');
    window.location.href = 'student-login.html';
  } else {
    alert('Registration failed');
  }
});