// Using API_BASE from config.js

const studentId = localStorage.getItem('student_id');
if (!studentId) {
    alert('Please login as student to view cart');
    window.location.href = 'student-login.html';
} else {
    loadCart();
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

async function loadCart() {
    const cartItems = await fetch(`${API_BASE}/cart/${studentId}`).then(r => r.json());
    const cartDiv = document.getElementById('cart-items');
    if (cartItems.length === 0) {
        cartDiv.innerHTML = '<p>Your cart is empty.</p>';
        return;
    }
    cartDiv.innerHTML = cartItems.map(item => `
        <div class="cart-item">
            <h3>${item.book_name}</h3>
            <p>Shop: ${item.shop_name}</p>
            <p>Price: ₹${item.price}</p>
            <p>Condition: ${item.condition}</p>
            <label>Quantity: <input type="number" value="${item.quantity}" min="1" onchange="updateQuantity(${item.book_id}, this.value)"></label>
            <button onclick="removeFromCart(${item.book_id})">Remove</button>
        </div>
    `).join('');
}

function updateQuantity(bookId, quantity) {
    fetch(`${API_BASE}/cart/update`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: studentId, book_id: bookId, quantity })
    });
}

function removeFromCart(bookId) {
    fetch(`${API_BASE}/cart/remove`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: studentId, book_id: bookId })
    }).then(() => loadCart());
}

document.getElementById('clear-cart-btn').addEventListener('click', () => {
    fetch(`${API_BASE}/cart/clear/${studentId}`, { method: 'DELETE' }).then(() => loadCart());
});

document.getElementById('checkout-btn').addEventListener('click', async () => {
    const address = prompt('Enter delivery address:');
    if (!address) return;
    const paymentMethod = confirm('Pay with UPI? (OK for UPI, Cancel for COD)') ? 'upi' : 'cod';
    const response = await fetch(`${API_BASE}/orders/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: studentId, student_address: address, payment_method: paymentMethod })
    });
    if (response.ok) {
        alert('Order placed successfully!');
        loadCart(); // Should be empty now
    } else {
        alert('Failed to place order');
    }
});
