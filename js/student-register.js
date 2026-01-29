// Using API_BASE from config.js

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
    const data = await response.json();
    console.log('✅ Registration successful, student_id:', data.student_id);
    alert('Registered successfully');
    window.location.href = 'student-login.html';
  } else {
    const errorData = await response.json();
    console.error('❌ Registration failed:', errorData);
    alert('Registration failed: ' + (errorData.error || 'Unknown error'));  }
});