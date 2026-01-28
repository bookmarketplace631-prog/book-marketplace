const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcrypt');
const qrcode = require('qrcode');
const cors = require('cors');
const multer = require('multer');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const winston = require('winston');
require('dotenv').config();

// Logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({ format: winston.format.simple() }));
}

const app = express();
const PORT = process.env.PORT || 3000;

// Database
const dbPath = process.env.DB_PATH || path.join(__dirname, 'mybook.db');
const db = new sqlite3.Database(dbPath);

// Middleware
app.use(helmet());
app.use(cors({ origin: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, '..')));  // Serve static files from parent directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));  // Serve uploaded files

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

const upload = multer({ dest: 'uploads/' });

// Initialize database tables
function initDB() {
  // Add columns if not exist (for existing DB)
  db.run(`ALTER TABLE shops ADD COLUMN logo_url TEXT`, (err) => { if (err && !err.message.includes('duplicate column')) console.log(err); });
  db.run(`ALTER TABLE shops ADD COLUMN banner_url TEXT`, (err) => { if (err && !err.message.includes('duplicate column')) console.log(err); });

  // Students table
  db.run(`
    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Add columns if not exist
  db.run(`ALTER TABLE students ADD COLUMN address TEXT`, (err) => { if (err && !err.message.includes('duplicate column')) console.log('Alter students address:', err); });
  db.run(`ALTER TABLE students ADD COLUMN grade TEXT`, (err) => { if (err && !err.message.includes('duplicate column')) console.log('Alter students grade:', err); });

  // Books table
  db.run(`
    CREATE TABLE IF NOT EXISTS books (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      shop_id INTEGER NOT NULL,
      book_name TEXT NOT NULL,
      edition TEXT,
      subject TEXT,
      grade TEXT,
      price REAL NOT NULL,
      condition TEXT CHECK(condition IN ('new', 'used')) DEFAULT 'new',
      in_stock BOOLEAN DEFAULT 1,
      stock INTEGER DEFAULT 1,
      cover_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (shop_id) REFERENCES shops(id)
    )
  `);

  // Add columns if not exist
  db.run(`ALTER TABLE books ADD COLUMN stock INTEGER DEFAULT 1`, (err) => { if (err && !err.message.includes('duplicate column')) console.log('Alter stock:', err); });
  db.run(`ALTER TABLE books ADD COLUMN cover_url TEXT`, (err) => { if (err && !err.message.includes('duplicate column')) console.log('Alter cover:', err); });
  db.run(`ALTER TABLE books ADD COLUMN grade TEXT`, (err) => { if (err && !err.message.includes('duplicate column')) console.log('Alter grade:', err); });

  // Orders table (add payment_status)
  db.run(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id TEXT UNIQUE NOT NULL,
      student_name TEXT NOT NULL,
      student_phone TEXT NOT NULL,
      student_address TEXT NOT NULL,
      book_id INTEGER NOT NULL,
      shop_id INTEGER NOT NULL,
      payment_method TEXT CHECK(payment_method IN ('cod', 'upi')) DEFAULT 'cod',
      payment_status TEXT CHECK(payment_status IN ('pending', 'paid')) DEFAULT 'pending',
      status TEXT CHECK(status IN ('pending', 'confirmed', 'delivered', 'rejected')) DEFAULT 'pending',
      qr_url TEXT,
      transaction_id TEXT,
      student_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (book_id) REFERENCES books(id),
      FOREIGN KEY (shop_id) REFERENCES shops(id)
    )
  `);

  // Admins table
  db.run(`
    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Wishlist table
  db.run(`
    CREATE TABLE IF NOT EXISTS wishlists (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      book_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES students(id),
      FOREIGN KEY (book_id) REFERENCES books(id),
      UNIQUE(student_id, book_id)
    )
  `);

  // Reviews table
  db.run(`
    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      target_type TEXT CHECK(target_type IN ('book', 'shop')) NOT NULL,
      target_id INTEGER NOT NULL,
      reviewer_type TEXT CHECK(reviewer_type IN ('student', 'shop')) NOT NULL,
      reviewer_id INTEGER NOT NULL,
      rating INTEGER CHECK(rating >= 1 AND rating <= 5) NOT NULL,
      comment TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Notifications table
  db.run(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_type TEXT CHECK(user_type IN ('student', 'shop')) NOT NULL,
      user_id INTEGER NOT NULL,
      message TEXT NOT NULL,
      is_read BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Cart table
  db.run(`
    CREATE TABLE IF NOT EXISTS cart (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      book_id INTEGER NOT NULL,
      quantity INTEGER DEFAULT 1,
      added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES students(id),
      FOREIGN KEY (book_id) REFERENCES books(id),
      UNIQUE(student_id, book_id)
    cd C:\Users\Dell\Desktop\vishv
    @'
    #!/usr/bin/env bash
    set -e
    cd backend
    npm install
    node server.js
    '@ > start.sh
    git add start.sh package.json
    git commit -m "ci: add start.sh and root package.json for Railway deploy"
    git push    )
  `);

  console.log('Database and tables created successfully.');

  // Insert sample admin
  db.run(`INSERT INTO admins (username, password) VALUES (?, ?)`, ['admin', bcrypt.hashSync('admin123', 10)]);
  console.log('Sample admin inserted.');

  // Insert sample shop (verified)
  db.run(`INSERT INTO shops (shop_name, owner_name, phone, password, address, city, verified) VALUES (?, ?, ?, ?, ?, ?, ?)`, ['Sample Shop', 'Owner Name', '1234567890', bcrypt.hashSync('password', 10), 'Sample Address', 'Surat', 1]);
  console.log('Sample shop inserted.');

  // Insert sample student
  db.run(`INSERT INTO students (name, phone, password) VALUES (?, ?, ?)`, ['Sample Student', '9876543210', bcrypt.hashSync('password', 10)]);
  console.log('Sample student inserted.');
}



// Routes

// Get books
app.get('/books', (req, res) => {
  const { query, shop_id, grade, subject, category, city, condition, price_min, price_max, sort } = req.query;
let sql = 'SELECT books.*, shops.shop_name, shops.city, shops.phone, shops.address, shops.id as shop_id FROM books JOIN shops ON books.shop_id = shops.id WHERE books.stock >= 0 AND shops.verified = 1';
const params = []; 

if (query) {
  sql += ' AND (books.book_name LIKE ? OR books.subject LIKE ? OR books.edition LIKE ?)';
  params.push(`%${query}%`, `%${query}%`, `%${query}%`);
}

if (shop_id) {
  sql += ' AND books.shop_id = ?';
  params.push(shop_id);
}

if (grade) {
  sql += ' AND books.grade = ?';
  params.push(grade);
}

if (subject) {
  sql += ' AND books.subject = ?';
  params.push(subject);
}

if (category) {
  sql += ' AND books.category = ?';
  params.push(category);
}

if (city) {
  sql += ' AND shops.city = ?';
  params.push(city);
}

if (condition) {
  sql += ' AND books.condition = ?';
  params.push(condition);
}

if (price_min) {
  sql += ' AND books.price >= ?';
  params.push(price_min);
}

if (price_max) {
  sql += ' AND books.price <= ?';
  params.push(price_max);
}

if (sort) {
  if (sort === 'price_asc') {
    sql += ' ORDER BY books.price ASC';
  } else if (sort === 'price_desc') {
    sql += ' ORDER BY books.price DESC';
  } else if (sort === 'rating') {
    // For rating, we need to join with reviews or calculate avg
    // Since we already calculate avg_rating, perhaps sort by that, but it's complex.
    // For now, sort by price asc as default, or add later.
    sql += ' ORDER BY books.price ASC'; // Placeholder
  }
}

  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    // Add ratings
    const promises = rows.map(row => {
      return new Promise((resolve) => {
        db.get('SELECT COALESCE(AVG(rating), 0) as avg_rating, COUNT(*) as review_count FROM reviews WHERE target_type = \'book\' AND target_id = ?', [row.id], (err, bookRating) => {
          db.get('SELECT COALESCE(AVG(rating), 0) as avg_rating, COUNT(*) as review_count FROM reviews WHERE target_type = \'shop\' AND target_id = ?', [row.shop_id], (err, shopRating) => {
            resolve({ ...row, book_rating: bookRating.avg_rating, book_reviews: bookRating.review_count, shop_rating: shopRating.avg_rating, shop_reviews: shopRating.review_count });
          });
        });
      });
    });
    Promise.all(promises).then(results => {
      if (sort === 'rating') {
        results.sort((a, b) => b.book_rating - a.book_rating);
      }
      res.json(results);
    });
  });
});

// Get grades
app.get('/grades', (req, res) => {
  // If taxonomy is available, prefer it (ensures consistent grade list). Merge DB-derived grades to include any custom entries.
  db.all('SELECT DISTINCT grade FROM books WHERE grade IS NOT NULL AND grade != "" ORDER BY grade', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    const dbGrades = rows.map(r => r.grade).filter(Boolean);
    const taxonomyGrades = Object.keys(TAXONOMY);
    // Merge and preserve order: taxonomy first, then DB-only grades
    const merged = Array.from(new Set([...taxonomyGrades, ...dbGrades]));
    if (!merged || merged.length === 0) return res.json(DEFAULT_GRADES);
    res.json(merged);
  });
});

// Get subjects by grade
app.get('/subjects', (req, res) => {
  const { grade } = req.query;
  if (!grade) return res.status(400).json({ error: 'Grade required' });
  // Check taxonomy first
  const t = TAXONOMY[grade];
  if (t) {
    // If taxonomy entry has streams, return flattened unique subjects across streams
    if (typeof t === 'object' && (t.streams || t.grades)) {
      if (t.streams) {
        // flatten subjects across streams
        const subj = Array.from(new Set(Object.values(t.streams).flat()));
        return res.json(subj);
      }
      if (t.grades) {
        // flatten across grade keys
        const subj = Array.from(new Set(Object.values(t.grades).flat()));
        return res.json(subj);
      }
    }
    if (Array.isArray(t)) return res.json(t);
  }

  // Fallback: fetch distinct subjects from DB for this grade
  db.all('SELECT DISTINCT subject FROM books WHERE grade = ? AND subject IS NOT NULL AND subject != "" ORDER BY subject', [grade], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    const subjects = rows.map(r => r.subject).filter(Boolean);
    if (!subjects || subjects.length === 0) {
      return res.json(DEFAULT_SUBJECTS);
    }
    res.json(subjects);
  });
});

// Get single book
app.get('/books/:id', (req, res) => {
  const { id } = req.params;
  const { student_id } = req.query;
  db.get('SELECT books.*, shops.shop_name, shops.city, shops.phone, shops.address, shops.id as shop_id FROM books JOIN shops ON books.shop_id = shops.id WHERE books.id = ?', [id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Book not found' });
    // Check if student has ordered from this shop
    let phone = row.phone;
    if (student_id) {
      db.get('SELECT id FROM orders WHERE student_id = ? AND shop_id = ? AND status != "cancelled"', [student_id, row.shop_id], (err, order) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!order) phone = null; // Hide phone
        addRatings();
      });
    } else {
      phone = null; // Hide if no student_id
      addRatings();
    }
    function addRatings() {
      db.get('SELECT COALESCE(AVG(rating), 0) as avg_rating, COUNT(*) as review_count FROM reviews WHERE target_type = \'book\' AND target_id = ?', [id], (err, bookRating) => {
        db.get('SELECT COALESCE(AVG(rating), 0) as avg_rating, COUNT(*) as review_count FROM reviews WHERE target_type = \'shop\' AND target_id = ?', [row.shop_id], (err, shopRating) => {
          res.json({ ...row, phone, book_rating: bookRating.avg_rating, book_reviews: bookRating.review_count, shop_rating: shopRating.avg_rating, shop_reviews: shopRating.review_count });
        });
      });
    }
  });
});

// Add book
app.post('/books', upload.single('cover'), (req, res) => {
  const { shop_id, book_name, edition, subject, grade, price, condition, stock } = req.body;
  const cover_url = req.file ? `/uploads/${req.file.filename}` : null;
  db.run('INSERT INTO books (shop_id, book_name, edition, subject, grade, price, condition, stock, cover_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [shop_id, book_name, edition, subject, grade, price, condition, stock || 1, cover_url], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID });
  });
});

// Update book
app.put('/books/:id', upload.single('cover'), (req, res) => {
  const { id } = req.params;
  const { book_name, edition, subject, grade, price, condition, stock } = req.body;
  const cover_url = req.file ? `/uploads/${req.file.filename}` : req.body.cover_url;
  db.run('UPDATE books SET book_name = ?, edition = ?, subject = ?, grade = ?, price = ?, condition = ?, stock = ?, cover_url = ? WHERE id = ?',
    [book_name, edition, subject, grade, price, condition, stock, cover_url, id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Updated' });
  });
});

// Delete book
app.delete('/books/:id', (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM books WHERE id = ?', [id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Deleted' });
  });
});

// Create order
app.post('/orders', (req, res) => {
  const { book_id, student_name: reqStudentName, student_phone: reqStudentPhone, student_address, payment_method, student_id } = req.body;
  let student_name = reqStudentName;
  let student_phone = reqStudentPhone;
  if (!book_id || !student_address || ((!(student_name && student_phone)) && !student_id)) {
    return res.status(400).json({ error: 'Missing required fields. Provide book_id, student_address and either student_name+student_phone or student_id.' });
  }

  // Get shop_id, price, upi_id, shop_name from book and shop
  db.get('SELECT books.shop_id, books.price, shops.upi_id, shops.shop_name FROM books JOIN shops ON books.shop_id = shops.id WHERE books.id = ?', [book_id], (err, data) => {
    if (err || !data) return res.status(500).json({ error: 'Book or shop not found' });

    const orderId = 'ORD-' + Date.now();  // Simple unique ID
    let qr_url = null;
    if (payment_method === 'upi') {
      if (!data.upi_id) return res.status(400).json({ error: 'Shop UPI ID not set' });
      // Generate UPI URL
      const upiUrl = `upi://pay?pa=${data.upi_id}&pn=${encodeURIComponent(data.shop_name)}&am=${data.price}&cu=INR&tn=${orderId}`;
      // Generate QR from UPI URL
      qrcode.toDataURL(upiUrl, (err, url) => {
        if (err) {
          console.error('QR error:', err);
          return res.status(500).json({ error: 'QR generation failed' });
        }
        qr_url = url;
        insertOrder();
      });
    } else {
      insertOrder();
    }

    function insertOrder() {
      // If name/phone missing but student_id provided, fetch from students
      function doInsert() {
        db.run('INSERT INTO orders (order_id, student_name, student_phone, student_address, book_id, shop_id, payment_method, qr_url, student_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [orderId, student_name, student_phone, student_address, book_id, data.shop_id, payment_method, qr_url, student_id], function(err) {
          if (err) return res.status(500).json({ error: err.message });
          // Add notification to shop
          const shopMessage = `New order received: ${orderId} for ${data.book_name}.`;
          db.run('INSERT INTO notifications (user_type, user_id, message) VALUES (?, ?, ?)', ['shop', data.shop_id, shopMessage]);
          // Decrease stock
          db.run('UPDATE books SET stock = stock - 1 WHERE id = ?', [book_id]);
          res.json({ order_id: orderId, qr_url: qr_url, id: this.lastID });
        });
      }

      if ((!student_name || !student_phone) && student_id) {
        db.get('SELECT name, phone FROM students WHERE id = ?', [student_id], (err, student) => {
          if (err) return res.status(500).json({ error: err.message });
          if (!student) return res.status(400).json({ error: 'Student not found for provided student_id' });
          student_name = student.name;
          student_phone = student.phone;
          doInsert();
        });
      } else {
        doInsert();
      }
    }
  });
});

// Checkout from cart
app.post('/orders/checkout', (req, res) => {
  const { student_id, student_address, payment_method } = req.body;
  if (!student_id || !student_address) return res.status(400).json({ error: 'Student ID and address required' });

  // Get cart items
  db.all('SELECT c.*, b.price, b.shop_id, s.upi_id, s.shop_name FROM cart c JOIN books b ON c.book_id = b.id JOIN shops s ON b.shop_id = s.id WHERE c.student_id = ?', [student_id], (err, cartItems) => {
    if (err) return res.status(500).json({ error: err.message });
    if (cartItems.length === 0) return res.status(400).json({ error: 'Cart is empty' });

    // Get student details
    db.get('SELECT name, phone FROM students WHERE id = ?', [student_id], (err, student) => {
      if (err || !student) return res.status(500).json({ error: 'Student not found' });

      const orders = [];
      let completed = 0;
      const totalItems = cartItems.length;

      cartItems.forEach(item => {
        const orderId = 'ORD-' + Date.now() + '-' + item.book_id;  // Unique per book
        let qr_url = null;
        if (payment_method === 'upi') {
          if (!item.upi_id) return res.status(400).json({ error: 'Shop UPI ID not set for some items' });
          const upiUrl = `upi://pay?pa=${item.upi_id}&pn=${encodeURIComponent(item.shop_name)}&am=${item.price * item.quantity}&cu=INR&tn=${orderId}`;
          qrcode.toDataURL(upiUrl, (err, url) => {
            if (err) console.error('QR error:', err);
            qr_url = url;
            insertOrderItem();
          });
        } else {
          insertOrderItem();
        }

        function insertOrderItem() {
          db.run('INSERT INTO orders (order_id, student_name, student_phone, student_address, book_id, shop_id, payment_method, qr_url, student_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [orderId, student.name, student.phone, student_address, item.book_id, item.shop_id, payment_method, qr_url, student_id], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            // Decrease stock
            db.run('UPDATE books SET stock = stock - 1 WHERE id = ?', [item.book_id]);
            orders.push({ order_id: orderId, qr_url });
            completed++;
            if (completed === totalItems) {
              // Clear cart
              db.run('DELETE FROM cart WHERE student_id = ?', [student_id]);
              res.json({ orders });
            }
          });
        }
      });
    });
  });
});

// Get orders by phone
app.get('/orders', (req, res) => {
  const { phone } = req.query;
  if (!phone) return res.status(400).json({ error: 'Phone required' });

  db.all('SELECT orders.*, books.book_name FROM orders JOIN books ON orders.book_id = books.id WHERE orders.student_phone = ?', [phone], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Get orders by student
app.get('/orders/student/:studentId', (req, res) => {
  const studentId = req.params.studentId;
  db.all('SELECT orders.*, books.book_name FROM orders JOIN books ON orders.book_id = books.id WHERE orders.student_id = ?', [studentId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Shop login
app.post('/shops/login', (req, res) => {
  const { phone, password } = req.body;
  console.log('Login attempt:', { phone, password });  // Add this
  db.get('SELECT * FROM shops WHERE phone = ?', [phone], (err, shop) => {
    if (err) {
      console.log('DB error:', err);  // Add this
      return res.status(500).json({ error: err.message });
    }
    if (!shop) {
      console.log('Shop not found for phone:', phone);  // Add this
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    if (!bcrypt.compareSync(password, shop.password)) {
      console.log('Password mismatch');  // Add this
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    if (shop.verified == 0) {
      return res.status(401).json({ error: 'Account not approved yet. Please wait for admin approval.' });
    }
    console.log('Login successful for shop ID:', shop.id);  // Add this
    res.json({ shop_id: shop.id, shop_name: shop.shop_name });
  });
});

// Student register
app.post('/students/register', (req, res) => {
  const { name, phone, password } = req.body;
  if (!name || !phone || !password) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  const hashedPassword = bcrypt.hashSync(password, 10);
  db.run('INSERT INTO students (name, phone, password) VALUES (?, ?, ?)',
    [name, phone, hashedPassword], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ student_id: this.lastID });
  });
});

// Student login
app.post('/students/login', (req, res) => {
  const { phone, password } = req.body;
  db.get('SELECT * FROM students WHERE phone = ?', [phone], (err, student) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!student || !bcrypt.compareSync(password, student.password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    res.json({ student_id: student.id, student_name: student.name, student_phone: student.phone });
  });
});

// Get books for shop
app.get('/books/shop/:shopId', (req, res) => {
  const { shopId } = req.params;
  db.all('SELECT * FROM books WHERE shop_id = ?', [shopId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Add book
app.post('/books', (req, res) => {
  const { shop_id, book_name, edition, subject, price, condition } = req.body;
  if (!shop_id || !book_name || !price) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  db.run('INSERT INTO books (shop_id, book_name, edition, subject, price, condition) VALUES (?, ?, ?, ?, ?, ?)',
    [shop_id, book_name, edition, subject, price, condition], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID });
  });
});

// Update book stock
app.put('/books/:id/stock', (req, res) => {
  const { id } = req.params;
  const { in_stock } = req.body;
  db.run('UPDATE books SET in_stock = ? WHERE id = ?', [in_stock, id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Stock updated' });
  });
});

// Delete book
app.delete('/books/:id', (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM books WHERE id = ?', [id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Book deleted' });
  });
});

// Get orders for a shop
app.get('/orders/shop/:shopId', (req, res) => {
  const { shopId } = req.params;
  const { status } = req.query;
 let sql = 'SELECT orders.*, books.book_name FROM orders JOIN books ON orders.book_id = books.id WHERE orders.shop_id = ?';
const params = [shopId];
if (status) {
  sql += ' AND orders.status = ?';
  params.push(status);
} else {
  // Exclude delivered for incoming orders
  sql += ' AND orders.status != \'delivered\'';
}

  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Update order status
app.put('/orders/:id', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  let updateSql = 'UPDATE orders SET status = ? WHERE id = ?';
let params = [status, id];
if (status === 'delivered') {
  updateSql = 'UPDATE orders SET status = ?, payment_status = \'paid\' WHERE id = ?';
}
db.run(updateSql, params, function(err) {
  if (err) return res.status(500).json({ error: err.message });
  // Add notification to student
  db.get('SELECT student_id, book_id FROM orders WHERE id = ?', [id], (err, order) => {
    if (!err && order && order.student_id) {
      const message = `Your order status has been updated to ${status}.`;
      db.run('INSERT INTO notifications (user_type, user_id, message) VALUES (?, ?, ?)', ['student', order.student_id, message]);
    }
    res.json({ message: 'Order updated', book_id: order.book_id });
  });
});
});

// Cancel order
app.put('/orders/:id/cancel', (req, res) => {
  const { id } = req.params;
  db.run('UPDATE orders SET status = \'cancelled\' WHERE id = ? AND status = \'pending\'', [id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes > 0) {
      // Add notification to shop
      db.get('SELECT shop_id FROM orders WHERE id = ?', [id], (err, order) => {
        if (!err && order) {
          const message = `Order ${id} has been cancelled by the student.`;
          db.run('INSERT INTO notifications (user_type, user_id, message) VALUES (?, ?, ?)', ['shop', order.shop_id, message]);
        }
      });
      res.json({ message: 'Order cancelled' });
    } else {
      res.status(400).json({ error: 'Order cannot be cancelled' });
    }
  });
});

// Update order transaction ID
app.put('/orders/:id/transaction', (req, res) => {
  const { id } = req.params;
  const { transaction_id } = req.body;
  db.run('UPDATE orders SET transaction_id = ? WHERE id = ?', [transaction_id, id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Transaction ID updated' });
  });
});

// Mark payment as paid
app.put('/orders/:id/pay', (req, res) => {
  const { id } = req.params;
  db.run('UPDATE orders SET payment_status = \'paid\' WHERE id = ?', [id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Payment marked as paid' });
  });
});

// Update shop UPI ID
app.put('/shops/:id/upi', (req, res) => {
  const { id } = req.params;
  const { upi_id } = req.body;
  db.run('UPDATE shops SET upi_id = ? WHERE id = ?', [upi_id, id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'UPI ID updated' });
  });
});

// Admin login
app.post('/admin/login', (req, res) => {
  const { username, password } = req.body;
  db.get('SELECT * FROM admins WHERE username = ?', [username], (err, admin) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!admin) return res.status(401).json({ error: 'Invalid credentials' });
    if (!bcrypt.compareSync(password, admin.password)) return res.status(401).json({ error: 'Invalid credentials' });
    res.json({ message: 'Login successful' });
  });
});

// Get all shops for admin
app.get('/admin/shops', (req, res) => {
  const sql = `
    SELECT shops.id, shop_name, owner_name, phone, city, verified, notification, shops.created_at,
           COALESCE(AVG(reviews.rating), 0) as avg_rating, COUNT(reviews.id) as review_count
    FROM shops
    LEFT JOIN reviews ON reviews.target_type = 'shop' AND reviews.target_id = shops.id
    GROUP BY shops.id
  `;
  db.all(sql, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Get admin analytics
app.get('/admin/analytics', (req, res) => {
  // Total shops
  db.get('SELECT COUNT(*) as total_shops FROM shops', (err, shopsRow) => {
    if (err) return res.status(500).json({ error: err.message });
    // Verified shops
    db.get('SELECT COUNT(*) as verified_shops FROM shops WHERE verified = 1', (err, verifiedRow) => {
      if (err) return res.status(500).json({ error: err.message });
      // Total books
      db.get('SELECT COUNT(*) as total_books FROM books', (err, booksRow) => {
        if (err) return res.status(500).json({ error: err.message });
        // Total orders
        db.get('SELECT COUNT(*) as total_orders FROM orders', (err, ordersRow) => {
          if (err) return res.status(500).json({ error: err.message });
          // Total revenue
          db.get('SELECT SUM(books.price) as total_revenue FROM orders JOIN books ON orders.book_id = books.id WHERE orders.status=\'delivered\' AND orders.payment_status = \'paid\'', (err, revenueRow) => {
            if (err) return res.status(500).json({ error: err.message });
            // Average rating across all shops
            db.get('SELECT COALESCE(AVG(rating), 0) as avg_rating FROM reviews WHERE target_type = \'shop\'', (err, ratingRow) => {
              if (err) return res.status(500).json({ error: err.message });
              // Top selling books
              db.all('SELECT books.book_name, COUNT(orders.id) as sales FROM orders JOIN books ON orders.book_id = books.id WHERE orders.status = \'delivered\' GROUP BY books.id ORDER BY sales DESC LIMIT 5', (err, topBooks) => {
                if (err) return res.status(500).json({ error: err.message });
                // Monthly revenue (last 6 months)
                db.all(`SELECT strftime('%Y-%m', orders.created_at) as month, SUM(books.price) as revenue FROM orders JOIN books ON orders.book_id = books.id WHERE orders.status = 'delivered' AND orders.payment_status = 'paid' AND orders.created_at >= date('now', '-6 months') GROUP BY month ORDER BY month`, (err, monthlyRevenue) => {
                  if (err) return res.status(500).json({ error: err.message });
                  res.json({
                    totalShops: shopsRow['COUNT(*)'],
                    verifiedShops: verifiedRow['COUNT(*)'],
                    totalBooks: booksRow['COUNT(*)'],
                    totalOrders: ordersRow['COUNT(*)'],
                    totalRevenue: revenueRow.total_revenue || 0,
                    avgRating: ratingRow.avg_rating,
                    topBooks: topBooks,
                    monthlyRevenue: monthlyRevenue
                  });
                });
              });
            });
          });
        });
      });
    });
  });
});

// Approve/reject shop
app.put('/admin/shops/:id/verify', (req, res) => {
  const { id } = req.params;
  const { verified, notification } = req.body;
  db.run('UPDATE shops SET verified = ?, notification = ? WHERE id = ?', [verified, notification, id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    // Send notification to shop if approved
    if (verified == 1) {
      const message = 'Your shop has been approved by admin. You can now login and start listing books.';
      db.run('INSERT INTO notifications (user_type, user_id, message) VALUES (?, ?, ?)', ['shop', id, message]);
    }
    res.json({ message: 'Shop updated' });
  });
});

app.get('/admin/students', (req, res) => {
  db.all('SELECT id, name as student_name, phone, grade FROM students', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.delete('/admin/students/:id', (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM students WHERE id = ?', [id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Student deleted' });
  });
});

app.get('/admin/orders', (req, res) => {
  db.all('SELECT orders.*, books.book_name, students.name as student_name FROM orders JOIN books ON orders.book_id = books.id JOIN students ON orders.student_id = students.id', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.put('/admin/orders/:id/status', (req, res) => {
  const { id } = req.params;
  const { payment_status } = req.body;
  db.run('UPDATE orders SET payment_status = ? WHERE id = ?', [payment_status, id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Order updated' });
  });
});

// Shop update order status
app.put('/orders/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  db.get('SELECT * FROM orders WHERE id = ?', [id], (err, order) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    db.run('UPDATE orders SET status = ? WHERE id = ?', [status, id], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      // Send notification
      let message = '';
      if (status === 'confirmed') {
        message = 'Your order has been confirmed by the shop.';
        if (order.student_id) {
          db.run('INSERT INTO notifications (user_type, user_id, message) VALUES (?, ?, ?)', ['student', order.student_id, message]);
        }
      } else if (status === 'rejected') {
        // Increment stock
        db.run('UPDATE books SET stock = stock + 1 WHERE id = ?', [order.book_id]);
        message = 'Your order has been rejected by the shop.';
        if (order.student_id) {
          db.run('INSERT INTO notifications (user_type, user_id, message) VALUES (?, ?, ?)', ['student', order.student_id, message]);
        }
      } else if (status === 'delivered') {
        message = 'Your order has been delivered. Please confirm receipt.';
        if (order.student_id) {
          db.run('INSERT INTO notifications (user_type, user_id, message) VALUES (?, ?, ?)', ['student', order.student_id, message]);
        }
      }
      res.json({ message: 'Status updated' });
    });
  });
});

// Bulk approve shops
app.post('/admin/shops/bulk-approve', (req, res) => {
  db.run('UPDATE shops SET verified = 1, notification = \'Your shop has been approved!\' WHERE verified = 0', function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: `${this.changes} shops approved` });
  });
});

// Export orders to CSV
app.get('/admin/export/orders', (req, res) => {
  db.all('SELECT orders.*, books.book_name, students.name as student_name, shops.shop_name FROM orders JOIN books ON orders.book_id = books.id JOIN students ON orders.student_id = students.id JOIN shops ON orders.shop_id = shops.id', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    let csv = 'Order ID,Student Name,Book Name,Shop Name,Amount,Status,Payment Status,Date\n';
    rows.forEach(row => {
      csv += `${row.order_id},${row.student_name},${row.book_name},${row.shop_name},${row.amount || ''},${row.status},${row.payment_status},${row.created_at}\n`;
    });
    res.header('Content-Type', 'text/csv');
    res.attachment('orders.csv');
    res.send(csv);
  });
});

// Export shops to CSV
app.get('/admin/export/shops', (req, res) => {
  db.all('SELECT id, shop_name, owner_name, phone, city, verified, created_at FROM shops', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    let csv = 'ID,Shop Name,Owner Name,Phone,City,Verified,Created At\n';
    rows.forEach(row => {
      csv += `${row.id},${row.shop_name},${row.owner_name},${row.phone},${row.city},${row.verified},${row.created_at}\n`;
    });
    res.header('Content-Type', 'text/csv');
    res.attachment('shops.csv');
    res.send(csv);
  });
});

// Shop register
app.post('/shops/register', (req, res) => {
  const { shop_name, owner_name, phone, password, address, city } = req.body;
  console.log('Register attempt:', { shop_name, phone });  // Check console
  const hashedPassword = bcrypt.hashSync(password, 10);
  db.run('INSERT INTO shops (shop_name, owner_name, phone, password, address, city) VALUES (?, ?, ?, ?, ?, ?)',
    [shop_name, owner_name, phone, hashedPassword, address, city], function(err) {
    if (err) {
      console.log('Registration DB error:', err);  // Check console for details
      return res.status(500).json({ error: err.message });
    }
    console.log('Shop registered with ID:', this.lastID);
    res.json({ shop_id: this.lastID });
  });
});

// Student register
app.post('/students/register', (req, res) => {
  const { name, phone, password } = req.body;
  const hashedPassword = bcrypt.hashSync(password, 10);
  db.run('INSERT INTO students (name, phone, password) VALUES (?, ?, ?)',
    [name, phone, hashedPassword], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ student_id: this.lastID });
  });
});

// Student login
app.post('/students/login', (req, res) => {
  const { phone, password } = req.body;
  db.get('SELECT * FROM students WHERE phone = ?', [phone], (err, student) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!student || !bcrypt.compareSync(password, student.password)) return res.status(401).json({ error: 'Invalid credentials' });
    res.json({ student_id: student.id, student_name: student.name, student_phone: student.phone });
  });
});

// Get student by id
app.get('/students/:id', (req, res) => {
  const { id } = req.params;
  db.get('SELECT name, phone, address FROM students WHERE id = ?', [id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Student not found' });
    res.json(row);
  });
});

// Update student profile
app.put('/students/:id', (req, res) => {
  const { id } = req.params;
  const { name, phone, address } = req.body;
  db.run('UPDATE students SET name = ?, phone = ?, address = ? WHERE id = ?',
    [name, phone, address, id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Profile updated' });
  });
});

// Get unique cities
app.get('/admin/cities', (req, res) => {
  db.all('SELECT DISTINCT city FROM shops ORDER BY city', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows.map(r => r.city));
  });
});

// Get shop analytics
app.get('/admin/shops/:id/analytics', (req, res) => {
  const { id } = req.params;
  // Total books
  db.get('SELECT COUNT(*) as total_books FROM books WHERE shop_id = ?', [id], (err, booksRow) => {
    if (err) return res.status(500).json({ error: err.message });
    // Total orders
    db.get('SELECT COUNT(*) as total_orders FROM orders WHERE shop_id = ?', [id], (err, ordersRow) => {
      if (err) return res.status(500).json({ error: err.message });
      // Total revenue (sum of prices for paid orders)
      db.get('SELECT SUM(books.price) as total_revenue FROM orders JOIN books ON orders.book_id = books.id WHERE orders.shop_id = ? AND orders.status=\'delivered\' AND orders.payment_status = \'paid\'', [id], (err, revenueRow) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({
          total_books: booksRow.total_books,
          total_orders: ordersRow.total_orders,
          total_revenue: revenueRow.total_revenue || 0
        });
      });
    });
  });
});

// Shop analytics for own dashboard
app.get('/shops/:id/analytics', (req, res) => {
  const { id } = req.params;
  // Total orders
  db.get('SELECT COUNT(*) as totalOrders FROM orders WHERE shop_id = ?', [id], (err, ordersRow) => {
    if (err) return res.status(500).json({ error: err.message });
    // Total revenue
    db.get('SELECT SUM(books.price) as totalRevenue FROM orders JOIN books ON orders.book_id = books.id WHERE orders.shop_id = ? AND orders.status=\'delivered\' AND orders.payment_status = \'paid\'', [id], (err, revenueRow) => {
      if (err) return res.status(500).json({ error: err.message });
      // Today's revenue
      db.get('SELECT SUM(books.price) as todayRevenue FROM orders JOIN books ON orders.book_id = books.id WHERE orders.shop_id = ? AND orders.status=\'delivered\' AND orders.payment_status = \'paid\' AND date(orders.created_at) = date(\'now\')', [id], (err, todayRow) => {
        if (err) return res.status(500).json({ error: err.message });
        // Monthly revenue
        db.all(`SELECT strftime('%Y-%m', orders.created_at) as month, SUM(books.price) as revenue FROM orders JOIN books ON orders.book_id = books.id WHERE orders.shop_id = ? AND orders.status='delivered' AND orders.payment_status = 'paid' AND orders.created_at >= date('now', '-6 months') GROUP BY month ORDER BY month`, [id], (err, monthlyRows) => {
          if (err) return res.status(500).json({ error: err.message });
          // Average rating
          db.get('SELECT COALESCE(AVG(rating), 0) as avgRating FROM reviews WHERE target_type = \'shop\' AND target_id = ?', [id], (err, ratingRow) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({
              totalOrders: ordersRow['COUNT(*)'],
              totalRevenue: revenueRow.totalRevenue || 0,
              todayRevenue: todayRow.todayRevenue || 0,
              monthlyRevenue: monthlyRows,
              avgRating: ratingRow.avgRating
            });
          });
        });
      });
    });
  });
});

// Get book analytics
app.get('/books/:id/analytics', (req, res) => {
  const { id } = req.params;
  // Average rating
  db.get('SELECT COALESCE(AVG(rating), 0) as avg_rating, COUNT(*) as review_count FROM reviews WHERE target_type = \'book\' AND target_id = ?', [id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ avg_rating: row.avg_rating, review_count: row.review_count });
  });
});

// Get average rating for shop
app.get('/shops/:id/rating', (req, res) => {
  const { id } = req.params;
  db.get('SELECT AVG(rating) as avg_rating, COUNT(*) as review_count FROM reviews WHERE target_type = \'shop\' AND target_id = ?', [id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ avg_rating: row.avg_rating || 0, review_count: row.review_count || 0 });
  });
});

// Get shop analytics for shop dashboard
app.get('/shops/:id/analytics', (req, res) => {
  const { id } = req.params;
  // Total orders
  db.get('SELECT COUNT(*) as total_orders FROM orders WHERE shop_id = ?', [id], (err, ordersRow) => {
    if (err) return res.status(500).json({ error: err.message });
    // Total revenue
    db.get('SELECT SUM(books.price) as total_revenue FROM orders JOIN books ON orders.book_id = books.id WHERE orders.shop_id = ? AND orders.status=\'delivered\' AND orders.payment_status = \'paid\'', [id], (err, revenueRow) => {
      if (err) return res.status(500).json({ error: err.message });
      // Today revenue
      const today = new Date().toISOString().split('T')[0];
      db.get('SELECT SUM(books.price) as today_revenue FROM orders JOIN books ON orders.book_id = books.id WHERE orders.shop_id = ? AND orders.status=\'delivered\' AND orders.payment_status = \'paid\' AND DATE(orders.created_at) = ?', [id, today], (err, todayRow) => {
        if (err) return res.status(500).json({ error: err.message });
        // Monthly revenue (current month)
        const now = new Date();
        const month = now.getFullYear() + '-' + (now.getMonth() + 1).toString().padStart(2, '0');
        db.get('SELECT SUM(books.price) as monthly_revenue FROM orders JOIN books ON orders.book_id = books.id WHERE orders.shop_id = ? AND orders.status=\'delivered\' AND orders.payment_status = \'paid\' AND strftime(\'%Y-%m\', orders.created_at) = ?', [id, month], (err, monthlyRow) => {
          if (err) return res.status(500).json({ error: err.message });
          // Today commission
          db.get('SELECT SUM(books.price * 0.05) as today_commission FROM orders JOIN books ON orders.book_id = books.id WHERE orders.shop_id = ? AND orders.status=\'delivered\' AND orders.payment_status = \'paid\' AND DATE(orders.created_at) = ?', [id, today], (err, todayCommissionRow) => {
            if (err) return res.status(500).json({ error: err.message });
            // Monthly commission
            db.get('SELECT SUM(books.price * 0.05) as monthly_commission FROM orders JOIN books ON orders.book_id = books.id WHERE orders.shop_id = ? AND orders.status=\'delivered\' AND orders.payment_status = \'paid\' AND strftime(\'%Y-%m\', orders.created_at) = ?', [id, month], (err, monthlyCommissionRow) => {
              if (err) return res.status(500).json({ error: err.message });
              // Average rating
              db.get('SELECT COALESCE(AVG(rating), 0) as avg_rating FROM reviews WHERE target_type = \'shop\' AND target_id = ?', [id], (err, ratingRow) => {
                if (err) return res.status(500).json({ error: err.message });
                res.json({
                  totalOrders: ordersRow['COUNT(*)'],
                  totalRevenue: revenueRow.total_revenue || 0,
                  todayRevenue: todayRow.today_revenue || 0,
                  monthlyRevenue: monthlyRow.monthly_revenue || 0,
                  avgRating: ratingRow.avg_rating,
                  todayCommission: todayCommissionRow.today_commission || 0,
                  monthlyCommission: monthlyCommissionRow.monthly_commission || 0
                });
              });
            });
          });
        });
      });
    });
  });
});

// Wishlist routes
app.post('/wishlists', (req, res) => {
  const { student_id, book_id } = req.body;
  db.run('INSERT OR IGNORE INTO wishlists (student_id, book_id) VALUES (?, ?)', [student_id, book_id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID });
  });
});

app.delete('/wishlists', (req, res) => {
  const { student_id, book_id } = req.body;
  db.run('DELETE FROM wishlists WHERE student_id = ? AND book_id = ?', [student_id, book_id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Removed from wishlist' });
  });
});

app.get('/wishlists/:studentId', (req, res) => {
  const { studentId } = req.params;
  db.all('SELECT books.* FROM wishlists JOIN books ON wishlists.book_id = books.id WHERE wishlists.student_id = ?', [studentId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.get('/reviews', (req, res) => {
  const { target_type, target_id } = req.query;
  const targetId = parseInt(target_id);
  if (!target_type || isNaN(targetId)) return res.status(400).json({ error: 'target_type and valid target_id required' });
  const sql = `
    SELECT reviews.*, 
           CASE WHEN reviews.user_type = 'student' THEN students.name ELSE shops.shop_name END as user_name
    FROM reviews 
    LEFT JOIN students ON reviews.user_type = 'student' AND reviews.user_id = students.id
    LEFT JOIN shops ON reviews.user_type = 'shop' AND reviews.user_id = shops.id
    WHERE reviews.target_type = ? AND reviews.target_id = ?
    ORDER BY reviews.created_at DESC
  `;
  db.all(sql, [target_type, targetId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Shop profile routes
app.get('/shops/:id/profile', (req, res) => {
  const { id } = req.params;
  const { student_id } = req.query;
  db.get('SELECT shop_name, owner_name, phone, address, city, logo_url, banner_url, upi_id FROM shops WHERE id = ?', [id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Shop not found' });
    // Check if student has ordered from this shop
    if (student_id) {
      db.get('SELECT id FROM orders WHERE student_id = ? AND shop_id = ? AND status != "cancelled"', [student_id, id], (err, order) => {
        if (err) return res.status(500).json({ error: err.message });
        if (order) {
          res.json(row); // Show phone
        } else {
          const { phone, ...profile } = row;
          res.json(profile); // Hide phone
        }
      });
    } else {
      const { phone, ...profile } = row;
      res.json(profile); // Hide phone if no student_id
    }
  });
});

app.put('/shops/:id/profile', upload.fields([{ name: 'logo' }, { name: 'banner' }]), (req, res) => {
  const { id } = req.params;
  const { shop_name, owner_name, phone, address, city } = req.body;
  // First get current profile
  db.get('SELECT logo_url, banner_url FROM shops WHERE id = ?', [id], (err, current) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!current) return res.status(404).json({ error: 'Shop not found' });
    let logo_url = current.logo_url;
    let banner_url = current.banner_url;
    if (req.files.logo) logo_url = `/uploads/${req.files.logo[0].filename}`;
    if (req.files.banner) banner_url = `/uploads/${req.files.banner[0].filename}`;
    db.run('UPDATE shops SET shop_name = ?, owner_name = ?, phone = ?, address = ?, city = ?, logo_url = ?, banner_url = ? WHERE id = ?',
      [shop_name, owner_name, phone, address, city, logo_url, banner_url, id], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Profile updated' });
    });
  });
});

// Add this to create uploads folder if not exists
const fs = require('fs');
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Cart routes
app.post('/cart/add', (req, res) => {
  const { student_id, book_id, quantity = 1 } = req.body;
  if (!student_id || !book_id) return res.status(400).json({ error: 'Student ID and Book ID required' });
  db.run('INSERT OR REPLACE INTO cart (student_id, book_id, quantity) VALUES (?, ?, ?)', [student_id, book_id, quantity], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Added to cart' });
  });
});

app.get('/cart/:studentId', (req, res) => {
  const { studentId } = req.params;
  db.all(`
    SELECT c.*, b.book_name, b.price, b.condition, s.shop_name
    FROM cart c
    JOIN books b ON c.book_id = b.id
    JOIN shops s ON b.shop_id = s.id
    WHERE c.student_id = ?
  `, [studentId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.put('/cart/update', (req, res) => {
  const { student_id, book_id, quantity } = req.body;
  if (!student_id || !book_id || quantity < 1) return res.status(400).json({ error: 'Invalid data' });
  db.run('UPDATE cart SET quantity = ? WHERE student_id = ? AND book_id = ?', [quantity, student_id, book_id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Cart updated' });
  });
});

app.delete('/cart/remove', (req, res) => {
  const { student_id, book_id } = req.body;
  db.run('DELETE FROM cart WHERE student_id = ? AND book_id = ?', [student_id, book_id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Removed from cart' });
  });
});

app.delete('/cart/clear/:studentId', (req, res) => {
  const { studentId } = req.params;
  db.run('DELETE FROM cart WHERE student_id = ?', [studentId], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Cart cleared' });
  });
});

// Reviews routes
app.post('/reviews', (req, res) => {
  const { target_type, target_id, reviewer_type, reviewer_id, rating, comment } = req.body;
  if (!target_type || !target_id || !reviewer_type || !reviewer_id || !rating) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  // Check if review already exists
  db.get('SELECT id FROM reviews WHERE target_type = ? AND target_id = ? AND reviewer_type = ? AND reviewer_id = ?', [target_type, target_id, reviewer_type, reviewer_id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (row) return res.status(400).json({ error: 'You have already rated this' });
    db.run('INSERT INTO reviews (target_type, target_id, reviewer_type, reviewer_id, rating, comment) VALUES (?, ?, ?, ?, ?, ?)', [target_type, target_id, reviewer_type, reviewer_id, rating, comment], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID });
    });
  });
});

app.get('/reviews/:target_type/:target_id', (req, res) => {
  const { target_type, target_id } = req.params;
  db.all('SELECT reviews.*, students.name as student_name, shops.shop_name as shop_name FROM reviews LEFT JOIN students ON reviews.reviewer_id = students.id AND reviews.reviewer_type = \'student\' LEFT JOIN shops ON reviews.reviewer_id = shops.id AND reviews.reviewer_type = \'shop\' WHERE target_type = ? AND target_id = ? ORDER BY created_at DESC', [target_type, target_id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// Notifications routes
app.get('/notifications/:user_type/:user_id', (req, res) => {
  const { user_type, user_id } = req.params;
  db.all('SELECT * FROM notifications WHERE user_type = ? AND user_id = ? ORDER BY created_at DESC', [user_type, user_id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/notifications', (req, res) => {
  const { user_type, user_id, message } = req.body;
  if (!user_type || !user_id || !message) {
    return res.status(400).json({ error: 'Missing required fields: user_type, user_id, message' });
  }
  if (!['student', 'shop'].includes(user_type)) {
    return res.status(400).json({ error: 'Invalid user_type. Must be "student" or "shop"' });
  }
  db.run('INSERT INTO notifications (user_type, user_id, message) VALUES (?, ?, ?)', [user_type, user_id, message], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID });
  });
});

app.put('/notifications/:id/read', (req, res) => {
  const { id } = req.params;
  db.run('UPDATE notifications SET is_read = 1 WHERE id = ?', [id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Notification marked as read' });
  });
});