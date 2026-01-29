// Using API_BASE from config.js

if (!localStorage.getItem('student_id')) {
    window.location.href = 'student-login.html';
}

let currentOrderId;  // Declare here

async function fetchData(endpoint, options = {}) {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, options);
    return await response.json();
  } catch (error) {
    console.error('Fetch error:', error);
  }
}

function init() {
  const urlParams = new URLSearchParams(window.location.search);
  const bookId = urlParams.get('bookId');
  console.log('bookId:', bookId);
  if (!bookId) {
    alert('No book selected. Go back and select a book.');
    return;
  }

  let bookData;  // Declare here

  fetchData(`/books/${bookId}`).then(book => {
    if (book && !book.error) {
      bookData = book;  // Set here
      document.getElementById('book-summary').innerHTML = `
        <h3>${book.book_name}</h3>
        <p>Price: ₹${book.price}</p>
        <p>Shop: ${book.shop_name}</p>
      `;

      // Prefill name and phone from logged-in student (editable)
      const storedName = localStorage.getItem('student_name');
      const storedPhone = localStorage.getItem('student_phone');
      if (storedName) {
        const nameField = document.getElementById('name');
        if (nameField) nameField.value = storedName;
      }
      if (storedPhone) {
        const phoneField = document.getElementById('phone');
        if (phoneField) phoneField.value = storedPhone;
      }

      // Move the event listener here, after bookData is loaded
      document.getElementById('order-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('name').value;
        const phone = document.getElementById('phone').value;
        const address = document.getElementById('address').value;
        const payment = document.getElementById('payment').value;

        const orderData = {
          book_id: bookId,
          student_name: name,
          student_phone: phone,
          student_address: address,
          payment_method: payment,
          student_id: localStorage.getItem('student_id')
        };

        const result = await fetchData('/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(orderData)
        });

        if (result && result.order_id) {
          currentOrderId = result.id;
          if (result.qr_url) {
            // Show QR in modal
            document.getElementById('qr-display').innerHTML = `<img src="${result.qr_url}" style="width: 200px; height: 200px;">`;
            document.getElementById('amount').textContent = bookData.price;  // Now safe
            document.getElementById('qr-modal').style.display = 'flex';
            
            // Add event listener to continue button
            const continueBtn = document.getElementById('continue-btn');
            continueBtn.addEventListener('click', closeModal);
            
            // Enable continue only after confirmation and transaction ID
            document.getElementById('payment-confirm').addEventListener('change', checkContinue);
            document.getElementById('transaction-id').addEventListener('input', checkContinue);

            function checkContinue() {
              const confirmed = document.getElementById('payment-confirm').checked;
              const transactionId = document.getElementById('transaction-id').value.trim();
              document.getElementById('continue-btn').disabled = !(confirmed && transactionId);
            }
          } else {
            alert(`Order placed! Order ID: ${result.order_id}`);
            window.location.href = 'my-orders.html';
          }
        } else if (result && result.error) {
          alert('Order failed: ' + result.error);  // Show specific error, e.g., "Shop UPI ID not set"
        } else {
          alert('Order failed. Try again.');
        }
      });
    } else {
      alert('Book not found. Go back and select a valid book.');
    }
  });
}

async function closeModal() {
    const transactionId = document.getElementById('transaction-id').value.trim();
    console.log('Transaction ID entered:', transactionId);
    try {
        const response = await fetch(`${API_BASE}/orders/${currentOrderId}/transaction`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ transaction_id: transactionId })
        });
        if (response.ok) {
            console.log('Transaction ID updated successfully');
        } else {
            console.error('Failed to update transaction ID:', response.status, await response.text());
        }
    } catch (error) {
        console.error('Fetch error:', error);
    }
    document.getElementById('qr-modal').style.display = 'none';
    window.location.href = 'my-orders.html';
}

// Redirect if not logged in
if (!localStorage.getItem('student_id')) {
    window.location.href = 'student-login.html';
}
