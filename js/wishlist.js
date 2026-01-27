const API_BASE = 'http://localhost:3000';

const studentId = localStorage.getItem('student_id');
const studentName = localStorage.getItem('student_name');

if (!studentId) {
    window.location.href = 'student-login.html';
} else {
    document.getElementById('user-info').innerHTML = `Logged in as: ${studentName}`;
}

async function fetchData(endpoint, options = {}) {
    const response = await fetch(`${API_BASE}${endpoint}`, options);
    return await response.json();
}

// Load wishlist
async function loadWishlist() {
    const books = await fetchData(`/wishlists/${studentId}`);
    const list = document.getElementById('wishlist-list');
    list.innerHTML = books.map(book => `
        <div class="book-item">
            <h3>${book.book_name}</h3>
            <p>Price: ₹${book.price}</p>
            <button onclick="viewBook(${book.id})">View Details</button>
            <button onclick="removeFromWishlist(${book.id})">Remove</button>
        </div>
    `).join('');
}

function viewBook(id) {
    window.location.href = `book-detail.html?id=${id}`;
}

async function removeFromWishlist(bookId) {
    await fetch(`${API_BASE}/wishlists`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: studentId, book_id: bookId })
    });
    loadWishlist();
}

loadWishlist();

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