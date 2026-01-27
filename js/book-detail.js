const API_BASE = 'http://localhost:3000';

if (!localStorage.getItem('student_id')) {
    window.location.href = 'student-login.html';
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

function getStars(rating) {
  const fullStars = Math.floor(rating);
  const halfStar = rating % 1 >= 0.5 ? 1 : 0;
  const emptyStars = 5 - fullStars - halfStar;
  return '★'.repeat(fullStars) + (halfStar ? '☆' : '') + '☆'.repeat(emptyStars) + ` (${rating.toFixed(1)})`;
}

async function fetchData(endpoint, options = {}) {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, options);
    return await response.json();
  } catch (error) {
    console.error('Fetch error:', error);
  }
}

const urlParams = new URLSearchParams(window.location.search);
const bookId = parseInt(urlParams.get('id'));

if (bookId && !isNaN(bookId)) {
    const studentId = localStorage.getItem('student_id');
    fetchData(`/books/${bookId}?student_id=${studentId || ''}`).then((book) => {
        if (book) {
            document.getElementById('book-info').innerHTML = `
                <h3>${book.book_name}</h3>
                <p>Edition: ${book.edition || 'N/A'}</p>
                <p>Subject: ${book.subject}</p>
                <p>Price: ₹${book.price}</p>
                <p>Condition: ${book.condition}</p>
                <p>Book Rating: ${getStars(book.book_rating)} (${book.book_reviews} reviews)</p>
                <p>Shop: ${book.shop_name} (${book.city}) - ${getStars(book.shop_rating)} (${book.shop_reviews} reviews)</p>
                ${book.phone ? `<p>Phone: ${book.phone}</p>` : ''}
                <p>Address: ${book.address}</p>
            `;
            const shopId = book.shop_id;
            document.getElementById('visit-shop-profile').addEventListener('click', () => {
                window.location.href = `shop-profile-student.html?shopId=${shopId}`;
            });
            document.getElementById('order-btn').addEventListener('click', () => {
                const studentId = localStorage.getItem('student_id');
                if (!studentId) {
                    alert('Please login as student to order');
                    window.location.href = 'student-login.html';
                    return;
                }
                window.location.href = `order-form.html?bookId=${bookId}`;
            });

            // Wishlist button
            const studentId = localStorage.getItem('student_id');
            if (studentId) {
                const wishlistBtn = document.createElement('button');
                wishlistBtn.id = 'wishlist-btn';
                wishlistBtn.textContent = 'Add to Wishlist';
                document.getElementById('book-info').appendChild(wishlistBtn);

                // Check if already in wishlist
                fetchData(`/wishlists/${studentId}`).then(wishlist => {
                    const inWishlist = wishlist.some(b => b.id == bookId);
                    wishlistBtn.textContent = inWishlist ? 'Remove from Wishlist' : 'Add to Wishlist';
                });

                wishlistBtn.addEventListener('click', async () => {
                    const inWishlist = wishlistBtn.textContent.includes('Remove');
                    const method = inWishlist ? 'DELETE' : 'POST';
                    const response = await fetch(`${API_BASE}/wishlists`, {
                        method,
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ student_id: studentId, book_id: bookId })
                    });
                    if (response.ok) {
                        wishlistBtn.textContent = inWishlist ? 'Add to Wishlist' : 'Remove from Wishlist';
                        alert(inWishlist ? 'Removed from wishlist' : 'Added to wishlist');
                    }
                });

                // Cart button
                const cartBtn = document.createElement('button');
                cartBtn.id = 'cart-btn';
                cartBtn.textContent = 'Add to Cart';
                document.getElementById('book-info').appendChild(cartBtn);

                cartBtn.addEventListener('click', async () => {
                    const response = await fetch(`${API_BASE}/cart/add`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ student_id: studentId, book_id: bookId })
                    });
                    if (response.ok) {
                        alert('Added to cart');
                    } else {
                        alert('Failed to add to cart');
                    }
                });
            }

            // Load recommendations
            loadRecommendations(book.grade, book.subject, bookId);
        } else {
            document.getElementById('book-info').innerHTML = '<p>Book not found.</p>';
        }
    });
}

// Load reviews
async function loadReviews() {
  const reviews = await fetchData(`/reviews/book/${bookId}`);
  if (!reviews || reviews.error) {
    console.error('Error loading reviews:', reviews?.error);
    return;
  }
  const reviewsList = document.getElementById('reviews-list');
  reviewsList.innerHTML = reviews.map(r => `
    <div class="review">
      <p><strong>${getStars(r.rating)}</strong> by ${r.student_name || r.shop_name}</p>
      <p>${r.comment || 'No comment'}</p>
      <small>${new Date(r.created_at).toLocaleDateString()}</small>
    </div>
  `).join('');
}

// Add review
document.getElementById('review-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const rating = document.getElementById('rating').value;
  const comment = document.getElementById('comment').value;
  const studentId = localStorage.getItem('student_id');
  if (!studentId) {
    alert('Please login as student to review');
    window.location.href = 'student-login.html';
    return;
  }
  const result = await fetchData('/reviews', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reviewer_type: 'student', reviewer_id: studentId, target_type: 'book', target_id: bookId, rating, comment })
  });
  if (result && !result.error) {
    loadReviews();
    document.getElementById('review-form').reset();
  } else {
    alert(result?.error || 'Error submitting review');
  }
});

if (bookId && !isNaN(bookId)) {
    loadReviews();
}

// Load recommendations
async function loadRecommendations(grade, subject, excludeId) {
  const params = new URLSearchParams({ grade, subject });
  const books = await fetchData(`/books?${params}`);
  const recommendations = books.filter(b => b.id != excludeId).slice(0, 5); // Top 5 similar
  const recList = document.getElementById('recommendations-list');
  recList.innerHTML = recommendations.map(b => `
    <div class="book-item">
      <h4>${b.book_name}</h4>
      <p>₹${b.price} - ${b.condition}</p>
      <a href="book-detail.html?id=${b.id}">View</a>
    </div>
  `).join('');
}