// Using API_BASE from config.js
const shopId = localStorage.getItem('shop_id');

if (!shopId) {
    window.location.href = 'shop-login.html';
}

// At the top, add:
let books = [];

// In loadBooks, change to:
async function loadBooks() {
  books = await fetchData(`/books/shop/${shopId}`);
  const list = document.getElementById('books-list');
  list.innerHTML = '';
  books.forEach(book => {
    const div = document.createElement('div');
    div.innerHTML = `
      <h3>${book.book_name}</h3>
      ${book.cover_url ? `<img src="${book.cover_url}" style="width: 100px; height: 150px;">` : ''}
      <p>Edition: ${book.edition || 'N/A'} | Subject: ${book.subject} | Grade: ${book.grade} | Price: ₹${book.price} | Condition: ${book.condition} | Stock: ${book.stock} | Category: ${book.category}</p>
      <button class="edit-btn" data-id="${book.id}">Edit</button>
      <button class="delete-btn" data-id="${book.id}">Delete</button>
    `;
    list.appendChild(div);
  });

  // Add event listeners
  list.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', (e) => editBook(e.target.dataset.id));
  });
  list.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', (e) => deleteBook(e.target.dataset.id));
  });
}

// Update editBook to:
function editBook(id) {
  const book = books.find(b => b.id == id);
  document.getElementById('book-id').value = book.id;
  document.getElementById('book-name').value = book.book_name;
  document.getElementById('edition').value = book.edition;
  document.getElementById('grade').value = book.grade;
  loadSubjectsForGrade(book.grade, book.subject);
  document.getElementById('price').value = book.price;
  document.getElementById('condition').value = book.condition;
  document.getElementById('stock').value = book.stock;
  document.getElementById('current-cover').value = book.cover_url;
  document.getElementById('submit-btn').textContent = 'Update Book';
  document.getElementById('cancel-btn').style.display = 'inline';
}

// At the end, add:
// Load grades
fetchData('/grades').then(grades => {
  const gradeSelect = document.getElementById('grade');
  if (Array.isArray(grades) && grades.length > 0) {
    gradeSelect.innerHTML = '<option value="">Choose a grade...</option>' + grades.map(g => `<option value="${g}">${g}</option>`).join('');
  } else {
    console.warn('No grades returned from /grades, keeping existing grade options');
  }
});

// On grade change, load subjects
document.getElementById('grade').addEventListener('change', () => {
  const grade = document.getElementById('grade').value;
  loadSubjectsForGrade(grade);
});

function loadSubjectsForGrade(grade, selected = '') {
  if (grade) {
    fetchData(`/subjects?grade=${encodeURIComponent(grade)}`).then(subjects => {
      const subjectSelect = document.getElementById('subject');
      subjectSelect.innerHTML = '<option value="">Choose a subject...</option>' + subjects.map(s => `<option value="${s}" ${s === selected ? 'selected' : ''}>${s}</option>`).join('');
    });
  } else {
    document.getElementById('subject').innerHTML = '<option value="">Choose a subject...</option>';
  }
}

if (!shopId) window.location.href = 'shop-login.html';

async function fetchData(endpoint, options = {}) {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, options);
    return await response.json();
  } catch (error) {
    console.error('Fetch error:', error);
  }
}

// Load books
async function loadBooks() {
    const books = await fetchData(`/books/shop/${shopId}`);
    const list = document.getElementById('books-list');
    list.innerHTML = '';
    
    if (!books || !Array.isArray(books)) {
        list.innerHTML = '<p>No books found</p>';
        return;
    }

    if (books.length === 0) {
        list.innerHTML = '<p>No books yet. Add one to get started!</p>';
        return;
    }

    books.forEach(book => {
        const div = document.createElement('div');
        div.innerHTML = `
            <h3>${book.book_name}</h3>
            ${book.cover_url ? `<img src="${book.cover_url}" style="width: 100px; height: 150px;">` : ''}
            <p>Edition: ${book.edition || 'N/A'} | Subject: ${book.subject} | Grade: ${book.grade} | Price: ₹${book.price} | Condition: ${book.condition} | Stock: ${book.stock}</p>
            <button class="edit-btn" data-id="${book.id}">Edit</button>
            <button class="delete-btn" data-id="${book.id}">Delete</button>
        `;
        list.appendChild(div);
    });

    // Add event listeners
    list.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => editBook(e.target.dataset.id));
    });
    list.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => deleteBook(e.target.dataset.id));
    });
}

// Add/Edit book
document.getElementById('book-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('book-id').value;
    const formData = new FormData();
    formData.append('shop_id', shopId);
    formData.append('book_name', document.getElementById('book-name').value);
    formData.append('edition', document.getElementById('edition').value);
    formData.append('subject', document.getElementById('subject').value);
    formData.append('grade', document.getElementById('grade').value);
    formData.append('category', document.getElementById('category').value);
    formData.append('price', document.getElementById('price').value);
    formData.append('condition', document.getElementById('condition').value);
    formData.append('stock', document.getElementById('stock').value);
    if (document.getElementById('cover').files[0]) {
        formData.append('cover', document.getElementById('cover').files[0]);
    } else {
        formData.append('cover_url', document.getElementById('current-cover').value);
    }

    let result;
    if (id) {
        // Update
        result = await fetch(`${API_BASE}/books/${id}`, { method: 'PUT', body: formData });
        result = await result.json();
    } else {
        // Add
        result = await fetch(`${API_BASE}/books`, { method: 'POST', body: formData });
        result = await result.json();
    }
    if (result && result.error) alert('Error: ' + result.error);
    resetForm();
    loadBooks();
});

// Edit book
function editBook(id) {
    fetchData(`/books/${id}`).then(book => {
        document.getElementById('book-id').value = book.id;
        document.getElementById('book-name').value = book.book_name;
        document.getElementById('edition').value = book.edition;
        document.getElementById('subject').value = book.subject;
        document.getElementById('grade').value = book.grade;
        document.getElementById('category').value = book.category || 'academic';
        document.getElementById('price').value = book.price;
        document.getElementById('condition').value = book.condition;
        document.getElementById('stock').value = book.stock || 1;
        document.getElementById('current-cover').value = book.cover_url || '';
    });
}

// Delete book
async function deleteBook(id) {
    if (confirm('Delete this book?')) {
        await fetchData(`/books/${id}`, { method: 'DELETE' });
        loadBooks();
    }
}

// Reset form
function resetForm() {
    document.getElementById('book-form').reset();
    document.getElementById('book-id').value = '';
    document.getElementById('current-cover').value = '';
    document.getElementById('submit-btn').textContent = 'Add Book';
    document.getElementById('cancel-btn').style.display = 'none';
}

document.getElementById('cancel-btn').addEventListener('click', resetForm);

loadBooks();

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
