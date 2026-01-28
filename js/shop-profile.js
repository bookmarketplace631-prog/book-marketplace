// Using API_BASE from config.js

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
    const profile = await fetchData(`/shops/${shopId}/profile`);
    const rating = await fetchData(`/shops/${shopId}/rating`);
    if (profile) {
        document.getElementById('shop-name').textContent = profile.shop_name;
        document.getElementById('shop-owner').textContent = profile.owner_name;
        document.getElementById('shop-phone').textContent = profile.phone;
        document.getElementById('shop-address').textContent = profile.address;
        document.getElementById('shop-city').textContent = profile.city;
        if (profile.logo_url) document.getElementById('logo').src = profile.logo_url;
        if (profile.banner_url) document.getElementById('banner').style.backgroundImage = `url(${profile.banner_url})`;
        document.getElementById('shop-rating').textContent = `Rating: ${rating.avg_rating.toFixed(1)} (${rating.review_count} reviews)`;

        if (loggedInShopId == shopId) {
            document.getElementById('edit-btn').style.display = 'block';
            document.getElementById('edit-btn').addEventListener('click', showEdit);
        } else {
            document.getElementById('edit-section').remove();
            document.getElementById('edit-btn').remove();
        }
    }
}

async function showEdit() {
    document.getElementById('edit-section').style.display = 'block';
    const profile = await fetchData(`/shops/${shopId}/profile`);
    document.getElementById('edit-shop-name').value = profile.shop_name;
    document.getElementById('edit-owner-name').value = profile.owner_name;
    document.getElementById('edit-phone').value = profile.phone;
    document.getElementById('edit-address').value = profile.address;
    document.getElementById('edit-city').value = profile.city;
}

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

loadProfile();

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
      <p><strong>${r.rating} Stars</strong> by ${r.user_name}</p>
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
  let user_id, user_type;
  if (loggedInShopId) {
    user_id = loggedInShopId;
    user_type = 'shop';
  } else {
    const studentId = localStorage.getItem('student_id');
    if (!studentId) {
      alert('Please login to review');
      window.location.href = 'student-login.html';
      return;
    }
    user_id = studentId;
    user_type = 'student';
  }
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

loadReviews();
