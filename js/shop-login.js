const API_BASE = 'http://localhost:3000';

async function fetchData(endpoint, options = {}) {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, options);
    return await response.json();
  } catch (error) {
    console.error('Fetch error:', error);
  }
}

// Toggle between login and register
document.getElementById('show-register').addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('login-section').style.display = 'none';
    document.getElementById('register-section').style.display = 'block';
});

document.getElementById('show-login').addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('register-section').style.display = 'none';
    document.getElementById('login-section').style.display = 'block';
});

// Login form
document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const phone = document.getElementById('login-phone').value;
    const password = document.getElementById('login-password').value;

    const result = await fetchData('/shops/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password })
    });

    if (result && result.shop_id) {
        localStorage.removeItem('student_id');
        localStorage.setItem('shop_id', result.shop_id);
        localStorage.setItem('shop_name', result.shop_name);
        window.location.href = 'shop-dashboard.html';
    } else {
        document.getElementById('error').innerHTML = result?.error || 'Login failed';
        if (result?.notification) {
            alert(result.notification);  // Show notification
        }
    }
});

// Register form
document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const shop_name = document.getElementById('shop-name').value;
    const owner_name = document.getElementById('owner-name').value;
    const phone = document.getElementById('register-phone').value;
    const password = document.getElementById('register-password').value;
    const address = document.getElementById('address').value;
    const city = document.getElementById('city').value;

    const result = await fetchData('/shops/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shop_name, owner_name, phone, password, address, city })
    });

    if (result && result.shop_id) {
        alert('Registration successful. Please wait for admin approval to login.');
    } else {
        document.getElementById('error').innerHTML = result?.error || 'Registration failed';
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
const cityHidden = document.getElementById("city");

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