// Using API_BASE from config.js

function getStars(rating) {
  const fullStars = Math.floor(rating);
  const halfStar = rating % 1 >= 0.5 ? 1 : 0;
  const emptyStars = 5 - fullStars - halfStar;
  return '★'.repeat(fullStars) + (halfStar ? '☆' : '') + '☆'.repeat(emptyStars) + ` (${rating.toFixed(1)})`;
}

const urlParams = new URLSearchParams(window.location.search);
const shopId = urlParams.get('shopId');
const loggedInShopId = localStorage.getItem('shop_id');

if (!shopId) {
    alert('No shop selected.');
    window.location.href = 'homepage.html';
}

async function fetchData(endpoint, options = {}) {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, options);
    return await response.json();
  } catch (error) {
    console.error('Fetch error:', error);
  }
}

async function loadProfile() {
    const studentId = localStorage.getItem('student_id');
    const profile = await fetchData(`/shops/${shopId}/profile?student_id=${studentId || ''}`);
    const rating = await fetchData(`/shops/${shopId}/rating`);
    if (profile) {
        document.getElementById('shop-name').textContent = profile.shop_name;
        document.getElementById('shop-owner').textContent = profile.owner_name;
        if (profile.phone) document.getElementById('shop-phone').textContent = profile.phone;
        else document.getElementById('shop-phone').style.display = 'none';
        document.getElementById('shop-address').textContent = profile.address;
        document.getElementById('shop-city').textContent = profile.city;
        if (profile.logo_url) document.getElementById('logo').src = profile.logo_url;
        if (profile.banner_url) document.getElementById('banner').style.backgroundImage = `url(${profile.banner_url})`;
        document.getElementById('shop-rating').textContent = `Rating: ${getStars(rating.avg_rating)} (${rating.review_count} reviews)`;

        if (loggedInShopId == shopId) {
            const editBtn = document.getElementById('edit-btn');
            if (editBtn) {
                editBtn.style.display = 'block';
                editBtn.addEventListener('click', showEdit);
            }
        }
    }
}

async function showEdit() {
    const editSection = document.getElementById('edit-section');
    if (editSection) editSection.style.display = 'block';
    const profile = await fetchData(`/shops/${shopId}/profile`);
    if (profile) {
        if (document.getElementById('edit-shop-name')) document.getElementById('edit-shop-name').value = profile.shop_name;
        if (document.getElementById('edit-owner-name')) document.getElementById('edit-owner-name').value = profile.owner_name;
        if (document.getElementById('edit-phone')) document.getElementById('edit-phone').value = profile.phone;
        if (document.getElementById('edit-address')) document.getElementById('edit-address').value = profile.address;
        if (document.getElementById('edit-city')) document.getElementById('edit-city').value = profile.city;
    }
}

if (document.getElementById('profile-form')) {
    document.getElementById('profile-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        if (loggedInShopId != shopId) {
            alert('Unauthorized');
            return;
        }
        const formData = new FormData();
        formData.append('shop_name', document.getElementById('edit-shop-name').value);
        formData.append('owner_name', document.getElementById('edit-owner-name').value);
        formData.append('phone', document.getElementById('edit-phone').value);
        formData.append('address', document.getElementById('edit-address').value);
        formData.append('city', document.getElementById('edit-city').value);
        if (document.getElementById('logo-file').files[0]) formData.append('logo', document.getElementById('logo-file').files[0]);
        if (document.getElementById('banner-file').files[0]) formData.append('banner', document.getElementById('banner-file').files[0]);

        const response = await fetch(`${API_BASE}/shops/${shopId}/profile`, {
            method: 'PUT',
            body: formData
        });
        if (response.ok) {
            alert('Profile updated');
            loadProfile();
            document.getElementById('edit-section').style.display = 'none';
        } else {
            alert('Update failed');
        }
    });
}

// Load reviews
async function loadReviews() {
  const reviews = await fetchData(`/reviews?target_type=shop&target_id=${shopId}`);
  if (!reviews || reviews.error) {
    console.error('Error loading reviews:', reviews?.error);
    return;
  }
  const reviewsList = document.getElementById('reviews-list');
  reviewsList.innerHTML = reviews.map(r => `
    <div class="review">
      <p><strong>${getStars(r.rating)}</strong> by ${r.user_name}</p>
      <p>${r.comment || 'No comment'}</p>
      <small>${new Date(r.created_at).toLocaleDateString()}</small>
    </div>
  `).join('');
}

// Load books
async function loadBooks() {
  const books = await fetchData(`/books?shop_id=${shopId}`);
  if (!books || books.error) {
    console.error('Error loading books:', books?.error);
    return;
  }
  const booksList = document.getElementById('books-list');
  booksList.innerHTML = books.map(book => `
    <div class="book-item">
      ${book.cover_url ? `<img src="${book.cover_url}" style="width: 80px; height: 120px;">` : ''}
      <h4>${book.book_name}</h4>
      <p>Edition: ${book.edition || 'N/A'} | Subject: ${book.subject} | Price: ₹${book.price} | Condition: ${book.condition}</p>
      <button onclick="window.location.href='book-detail.html?bookId=${book.id}'">View Details</button>
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
    alert('Please login as a student to review');
    window.location.href = 'student-login.html';
    return;
  }
  const user_id = studentId;
  const user_type = 'student';
  const result = await fetchData('/reviews', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_type, user_id, target_type: 'shop', target_id: shopId, rating, comment })
  });
  if (result && !result.error) {
    loadReviews();
  } else {
    alert(result?.error || 'Error submitting review');
  }
});

loadProfile();
loadReviews();
loadBooks();
