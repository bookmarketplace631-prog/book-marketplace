console.log('search.js loaded');
console.log('fetchData defined:', typeof fetchData);

// Using API_BASE from config.js

// Moved from homepage.js
async function fetchData(endpoint) {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`);
    return await response.json();
  } catch (error) {
    console.error('Fetch error:', error);
  }
}

// Check login status and update UI
const studentId = localStorage.getItem('student_id');
const studentName = localStorage.getItem('student_name');
if (studentId) {
    // Hide student login and register links
    const loginLink = document.querySelector('a[href="student-login.html"]');
    const registerLink = document.querySelector('a[href="student-register.html"]');
    if (loginLink) loginLink.style.display = 'none';
    if (registerLink) registerLink.style.display = 'none';
    // Show user info
    const userInfo = document.getElementById('user-info');
    if (userInfo && studentName) {
        userInfo.innerHTML = `Logged in as: ${studentName}`;
    }
    // Add profile, wishlist, and logout links to nav
    const nav = document.querySelector('nav:last-of-type'); // The second nav
    if (nav) {
        const profileLink = document.createElement('a');
        profileLink.href = 'student-profile.html';
        profileLink.textContent = 'My Profile';
        nav.appendChild(profileLink);

        const wishlistLink = document.createElement('a');
        wishlistLink.href = 'wishlist.html';
        wishlistLink.textContent = 'My Wishlist';
        nav.appendChild(wishlistLink);

        const logoutLink = document.createElement('a');
        logoutLink.href = '#';
        logoutLink.textContent = 'Logout';
        logoutLink.style.color = 'red'; // Optional styling
        logoutLink.addEventListener('click', () => {
            localStorage.removeItem('student_id');
            localStorage.removeItem('student_name');
            localStorage.removeItem('student_phone');
            location.reload();
        });
        nav.appendChild(logoutLink);
    }
}

document.getElementById('search-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const city = document.getElementById('city-select').value;
  if (!city) {
    alert('Please select a city.');
    return;
  }
  const grade = document.getElementById('grade-select').value;
  const subject = document.getElementById('subject-select').value;
  const category = document.getElementById('category-select').value;
  const query = document.getElementById('search-input').value;
  const condition = document.getElementById('condition-select').value;
  const priceMin = document.getElementById('price-min').value;
  const priceMax = document.getElementById('price-max').value;
  const sort = document.getElementById('sort-select').value;

  const params = new URLSearchParams({ city });
  if (grade) params.append('grade', grade);
  if (subject) params.append('subject', subject);
  if (category) params.append('category', category);
  if (query) params.append('query', query);
  if (condition) params.append('condition', condition);
  if (priceMin) params.append('price_min', priceMin);
  if (priceMax) params.append('price_max', priceMax);
  if (sort) params.append('sort', sort);

  const books = await fetchData(`/books?${params}`);
  console.log('Search results:', books);
  displayResults(books);
});

function displayResults(books) {
  const resultsSection = document.getElementById('results-section');
  const resultsList = document.getElementById('results-list');
  resultsList.innerHTML = '';

  if (books && books.length > 0) {
    books.forEach(book => {
      const bookDiv = document.createElement('div');
      bookDiv.className = 'book-card';
      bookDiv.innerHTML = `
        ${book.cover_url ? `<img src="${book.cover_url}" alt="${book.book_name}">` : '<div class="no-cover">No Cover</div>'}
        <h4>${book.book_name}</h4>
        <p>${book.subject} - ₹${book.price} - ${book.condition} - Stock: ${book.stock}${book.stock == 0 ? ' (Out of Stock)' : ''} - Rating: ${book.book_rating ? book.book_rating.toFixed(1) : 'N/A'}</p>
        <a href="book-detail.html?id=${book.id}">View Details</a>
      `;
      resultsList.appendChild(bookDiv);
    });
    resultsSection.style.display = 'block';
  } else {
    resultsList.innerHTML = '<p>No books found.</p>';
    resultsSection.style.display = 'block';
  }
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
async function loadGrades() {
  const grades = await fetchData('/grades');
  const gradeSelect = document.getElementById('grade-select');
  if (Array.isArray(grades) && grades.length > 0) {
    gradeSelect.innerHTML = '<option value="">Choose a grade...</option>' + grades.map(g => `<option value="${g}">${g}</option>`).join('');
  } else {
    console.warn('No grades returned from /grades, keeping existing grade options');
  }
}

loadGrades();

// On grade change, load subjects
document.getElementById('grade-select').addEventListener('change', async () => {
  const grade = document.getElementById('grade-select').value;
  const subjectSelect = document.getElementById('subject-select');
  if (grade) {
    const subjects = await fetchData(`/subjects?grade=${encodeURIComponent(grade)}`);
    subjectSelect.innerHTML = '<option value="">Choose a subject...</option>' + subjects.map(s => `<option value="${s}">${s}</option>`).join('');
  } else {
    subjectSelect.innerHTML = '<option value="">Choose a subject...</option>';
  }
});

// List of cities in India
const cities = [
  "Mumbai",
  "Delhi",
  "Bengaluru",
  "Hyderabad",
  "Ahmedabad",
  "Chennai",
  "Kolkata",
  "Surat",
  "Pune",
  "Jaipur",
  "Lucknow",
  "Kanpur",
  "Nagpur",
  "Indore",
  "Thane",
  "Bhopal",
  "Visakhapatnam",
  "Pimpri-Chinchwad",
  "Patna",
  "Vadodara",
  "Ghaziabad",
  "Ludhiana",
  "Agra",
  "Nashik",
  "Faridabad",
  "Meerut",
  "Rajkot",
  "Kalyan-Dombivli",
  "Vasai-Virar",
  "Varanasi",
  "Srinagar",
  "Aurangabad",
  "Dhanbad",
  "Amritsar",
  "Navi Mumbai",
  "Prayagraj",
  "Howrah",
  "Ranchi",
  "Jabalpur",
  "Gwalior",
  "Vijayawada",
  "Jodhpur",
  "Madurai",
  "Raipur",
  "Kota",
  "Guwahati",
  "Chandigarh",
  "Solapur",
  "Hubli–Dharwad",
  "Tiruchirappalli",
  "Tiruppur",
  "Moradabad",
  "Mysore",
  "Bareilly",
  "Gurgaon",
  "Aligarh",
  "Jalandhar",
  "Bhubaneswar",
  "Salem",
  "Mira-Bhayandar",
  "Warangal",
  "Thiruvananthapuram",
  "Guntur",
  "Bhiwandi",
  "Saharanpur",
  "Gorakhpur",
  "Bikaner",
  "Amravati",
  "Noida",
  "Jamshedpur",
  "Bhilai",
  "Cuttack",
  "Firozabad",
  "Kochi",
  "Nellore",
  "Bhavnagar",
  "Dehradun",
  "Durgapur",
  "Asansol",
  "Nanded",
  "Kolhapur",
  "Ajmer",
  "Gulbarga",
  "Jamnagar",
  "Ujjain",
  "Loni",
  "Siliguri",
  "Jhansi",
  "Ulhasnagar",
  "Jammu",
  "Sangli-Miraj & Kupwad",
  "Mangalore",
  "Erode",
  "Belgaum",
  "Ambattur",
  "Tirunelveli",
  "Malegaon",
  "Gaya",
  "Jalgaon",
  "Udaipur",
  "Maheshtala",
  "Davanagere",
  "Kozhikode",
  "Kurnool",
  "Rajpur Sonarpur",
  "Rajahmundry",
  "Bokaro",
  "South Dumdum",
  "Bellary",
  "Patiala",
  "Gopalpur",
  "Agartala",
  "Bhagalpur",
  "Muzaffarnagar",
  "Bhatpara",
  "Panihati",
  "Latur",
  "Dhule",
  "Tirupati",
  "Rohtak",
  "Korba",
  "Bhilwara",
  "Berhampur",
  "Muzaffarpur",
  "Ahmednagar",
  "Mathura",
  "Kollam",
  "Avadi",
  "Kadapa",
  "Kamarhati",
  "Bilaspur",
  "Shahjahanpur",
  "Bijapur",
  "Rampur",
  "Shivamogga",
  "Chandrapur",
  "Junagadh",
  "Thrissur",
  "Alwar",
  "Bardhaman",
  "Kulti",
  "Kakinada",
  "Nizamabad",
  "Parbhani",
  "Tumkur",
  "Khammam",
  "Ozhukarai",
  "Bihar Sharif",
  "Panipat",
  "Darbhanga",
  "Bally",
  "Aizawl",
  "Dewas",
  "Ichalkaranji",
  "Karimnagar",
  "Bathinda",
  "Jalna",
  "Eluru",
  "Barasat",
  "Purnia",
  "Satna",
  "Mau",
  "Sonipat",
  "Farrukhabad",
  "Sagar",
  "Rourkela",
  "Durg",
  "Imphal",
  "Ratlam",
  "Hapur",
  "Arrah",
  "Anantapur",
  "Etawah",
  "Ambarnath",
  "North Dumdum",
  "Bharatpur",
  "Begusarai",
  "New Delhi",
  "Gandhidham",
  "Baranagar",
  "Tiruvottiyur",
  "Puducherry",
  "Sikar",
  "Thoothukudi",
  "Rewa",
  "Mirzapur",
  "Raichur",
  "Pali",
  "Ramagundam",
  "Haridwar",
  "Vijayanagaram",
  "Katihar",
  "Nagarcoil",
  "Sri Ganganagar",
  "Karawal Nagar",
  "Mango",
  "Thanjavur",
  "Bulandshahr",
  "Uluberia",
  "Murwara",
  "Sambhal",
  "Singrauli",
  "Nadiad",
  "Secunderabad",
  "Naihati",
  "Yamunanagar",
  "Bidhan Nagar",
  "Pallavaram",
  "Bidar",
  "Munger",
  "Panchkula",
  "Burhanpur",
  "Raurkela Industrial Township",
  "Kharagpur",
  "Dindigul",
  "Gandhinagar",
  "Hospet",
  "Nangloi Jat",
  "Malda",
  "Ongole",
  "Deoghar",
  "Chapra",
  "Haldia",
  "Khandwa",
  "Nandyal",
  "Chittoor",
  "Morena",
  "Amroha",
  "Anand",
  "Bhind",
  "Bhalswa Jahangir Pur",
  "Madhyamgram",
  "Bhiwani",
  "Berhampore",
  "Ambala",
  "Morvi",
  "Fatehpur",
  "Raebareli",
  "Khora",
  "Bhusawal",
  "Orai",
  "Bahraich",
  "Vellore",
  "Mahesana",
  "Raiganj",
  "Sirsa",
  "Danapur",
  "Serampore",
  "Sultan Pur Majra",
  "Guna",
  "Jaunpur",
  "Panvel",
  "Shivpuri",
  "Surendranagar Dudhrej",
  "Unnao",
  "Hugli-Chuchura",
  "Alappuzha",
  "Kottayam",
  "Machilipatnam",
  "Shimla",
  "Adoni",
  "Tenali",
  "Proddatur",
  "Saharsa",
  "Hindupur",
  "Sasaram",
  "Hajipur",
  "Bhimavaram",
  "Dehri",
  "Madanapalle",
  "Siwan",
  "Bettiah",
  "Gondia",
  "Guntakal",
  "Srikakulam",
  "Motihari",
  "Dharmavaram",
  "Gudivada",
  "Narasaraopet",
  "Bagaha",
  "Miryalaguda",
  "Tadipatri",
  "Kishanganj",
  "Karaikudi",
  "Suryapet",
  "Jamalpur",
  "Kavali",
  "Tadepalligudem",
  "Amaravati",
  "Buxar",
  "Jehanabad"
];

// City search functionality
const citySearch = document.getElementById("city-search");
const cityDropdown = document.getElementById("city-dropdown");
const cityHidden = document.getElementById("city-select");

function showDropdown() {
    cityDropdown.style.display = "block";
}

function hideDropdown() {
    cityDropdown.style.display = "none";
}

function filterCities(query) {
    return cities.filter(city => city.toLowerCase().includes(query.toLowerCase()));
}

function renderDropdown(filteredCities) {
    cityDropdown.innerHTML = "";
    filteredCities.forEach(city => {
        const div = document.createElement("div");
        div.textContent = city;
        div.className = "city-option";
        div.addEventListener("click", () => {
            citySearch.value = city;
            cityHidden.value = city;
            hideDropdown();
        });
        cityDropdown.appendChild(div);
    });
}

citySearch.addEventListener("input", (e) => {
    const query = e.target.value;
    if (query.length > 0) {
        const filtered = filterCities(query);
        renderDropdown(filtered);
        showDropdown();
    } else {
        hideDropdown();
    }
});

citySearch.addEventListener("focus", () => {
    if (citySearch.value.length === 0) {
        renderDropdown(cities.slice(0, 10)); // show first 10
        showDropdown();
    }
});

document.addEventListener("click", (e) => {
    if (!citySearch.contains(e.target) && !cityDropdown.contains(e.target)) {
        hideDropdown();
    }
});