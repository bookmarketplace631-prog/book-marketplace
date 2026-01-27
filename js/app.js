const API_BASE = 'http://localhost:3000';

let studentId = localStorage.getItem('student_id');
let studentName = localStorage.getItem('student_name');
let studentPhone = localStorage.getItem('student_phone');

// Check if student logged in
if (studentId) {
    document.getElementById('user-info').innerHTML = `Logged in as: ${studentName}`;
    document.getElementById('login-btn').style.display = 'none';
    document.getElementById('logout-btn').style.display = 'block';
    // Hide student login and register links
    const loginLink = document.querySelector('a[href="student-login.html"]');
    const registerLink = document.querySelector('a[href="student-register.html"]');
    if (loginLink) loginLink.style.display = 'none';
    if (registerLink) registerLink.style.display = 'none';
} else {
    document.getElementById('login-btn').style.display = 'block';
    document.getElementById('logout-btn').style.display = 'none';
    // Show student login and register links
    const loginLink = document.querySelector('a[href="student-login.html"]');
    const registerLink = document.querySelector('a[href="student-register.html"]');
    if (loginLink) loginLink.style.display = 'inline';
    if (registerLink) registerLink.style.display = 'inline';
}

// Logout
document.getElementById('logout-btn').addEventListener('click', () => {
    localStorage.removeItem('student_id');
    localStorage.removeItem('student_name');
    localStorage.removeItem('student_phone');
    location.reload();
});

// Login modal
document.getElementById('login-btn').addEventListener('click', () => {
    document.getElementById('login-modal').style.display = 'block';
});

document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const phone = document.getElementById('login-phone').value;
    const password = document.getElementById('login-password').value;
    const res = await fetch(`${API_BASE}/students/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password })
    });
    if (res.ok) {
        const data = await res.json();
        localStorage.setItem('student_id', data.student_id);
        localStorage.setItem('student_name', data.student_name || data.name);
        if (data.student_phone) localStorage.setItem('student_phone', data.student_phone);
        location.reload();
    } else {
        alert('Login failed');
    }
});

// Register modal
document.getElementById('register-btn').addEventListener('click', () => {
    document.getElementById('register-modal').style.display = 'block';
});

document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('register-name').value;
    const phone = document.getElementById('register-phone').value;
    const password = document.getElementById('register-password').value;
    const res = await fetch(`${API_BASE}/students/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, password })
    });
    if (res.ok) {
        alert('Registered successfully');
        document.getElementById('register-modal').style.display = 'none';
    } else {
        alert('Registration failed');
    }
});

// Close modals
document.querySelectorAll('.close').forEach(close => {
    close.addEventListener('click', () => {
        document.getElementById('login-modal').style.display = 'none';
        document.getElementById('register-modal').style.display = 'none';
    });
});

// Load books
async function loadBooks(search = '', shopId = '') {
    const url = `${API_BASE}/books?search=${encodeURIComponent(search)}&shop_id=${shopId}`;
    const books = await fetch(url).then(r => r.json());
    const resultsList = document.getElementById('results-list');
    resultsList.innerHTML = books.map(book => `
        <div class="book-item">
            <h3>${book.book_name}</h3>
            <p>Edition: ${book.edition || 'N/A'}</p>
            <p>Subject: ${book.subject}</p>
            <p>Price: ₹${book.price}</p>
            <p>Condition: ${book.condition}</p>
            <p>Shop: ${book.shop_name} (${book.city}) - ${book.shop_rating.toFixed(1)} stars (${book.shop_reviews} reviews)</p>
            <p>Book Rating: ${book.book_rating.toFixed(1)} stars (${book.book_reviews} reviews)</p>
            <button onclick="viewBook(${book.id})">View Details</button>
        </div>
    `).join('');
}

function viewBook(id) {
    window.location.href = `book-detail.html?id=${id}`;
}

// Search
document.getElementById('search-btn').addEventListener('click', () => {
    const search = document.getElementById('search-input').value;
    loadBooks(search);
});

// Load initial books
loadBooks();