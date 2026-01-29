const express = require('express');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');
const qrcode = require('qrcode');
const cors = require('cors');
const multer = require('multer');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const winston = require('winston');
require('dotenv').config();

const { pool, initDB } = require('./db-config');

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

// Middleware
app.use(helmet());
app.use(cors({ origin: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, '..')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

const upload = multer({ dest: 'uploads/' });

// Initialize database on startup
(async () => {
  try {
    await initDB();
    console.log('✓ initDB completed');
  } catch (err) {
    console.error('Failed to initialize database:', err && err.message ? err.message : err);
  }
})();

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ status: 'ok', database: 'connected', timestamp: result.rows[0].now });
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'Database connection failed', error: err.message });
  }
});

// Debug config endpoint
app.get('/debug/config', (req, res) => {
  res.json({
    DB_HOST: process.env.DB_HOST || null,
    DB_NAME: process.env.DB_NAME || null,
    DB_USER: process.env.DB_USER || null,
    DB_PORT: process.env.DB_PORT || null,
    NODE_ENV: process.env.NODE_ENV || null
  });
});

// Taxonomy data
const TAXONOMY = {
  '9': { streams: { Science: ['English', 'Math', 'Science', 'Social Studies'], Commerce: ['English', 'Math', 'Business Studies'] } },
  '10': { streams: { Science: ['English', 'Math', 'Science', 'Social Studies'], Commerce: ['English', 'Math', 'Business Studies'] } },
  '11': { streams: { Science: ['Physics', 'Chemistry', 'Biology', 'Math', 'English'], Commerce: ['Accounts', 'Economics', 'Business Studies', 'English'] } },
  '12': { streams: { Science: ['Physics', 'Chemistry', 'Biology', 'Math', 'English'], Commerce: ['Accounts', 'Economics', 'Business Studies', 'English'] } }
};
const DEFAULT_GRADES = ['9', '10', '11', '12'];
const DEFAULT_SUBJECTS = ['English', 'Math', 'Science', 'Social Studies'];

// Create uploads folder if not exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// ========== BOOK ROUTES ==========

// Get books with filters
app.get('/books', async (req, res) => {
  try {
    const { query, shop_id, grade, subject, category, city, condition, price_min, price_max, sort } = req.query;
    
    let sql = `SELECT books.*, shops.shop_name, shops.city, shops.phone, shops.address, shops.id as shop_id 
               FROM books JOIN shops ON books.shop_id = shops.id 
               WHERE books.stock >= 0 AND shops.verified = true`;
    const params = [];
    let paramCount = 1;

    if (query) {
      sql += ` AND (books.book_name ILIKE $${paramCount} OR books.subject ILIKE $${paramCount + 1} OR books.edition ILIKE $${paramCount + 2})`;
      params.push(`%${query}%`, `%${query}%`, `%${query}%`);
      paramCount += 3;
    }
    if (shop_id) {
      sql += ` AND books.shop_id = $${paramCount}`;
      params.push(shop_id);
      paramCount++;
    }
    if (grade) {
      sql += ` AND books.grade = $${paramCount}`;
      params.push(grade);
      paramCount++;
    }
    if (subject) {
      sql += ` AND books.subject = $${paramCount}`;
      params.push(subject);
      paramCount++;
    }
    if (city) {
      sql += ` AND shops.city = $${paramCount}`;
      params.push(city);
      paramCount++;
    }
    if (condition) {
      sql += ` AND books.condition = $${paramCount}`;
      params.push(condition);
      paramCount++;
    }
    if (price_min) {
      sql += ` AND books.price >= $${paramCount}`;
      params.push(price_min);
      paramCount++;
    }
    if (price_max) {
      sql += ` AND books.price <= $${paramCount}`;
      params.push(price_max);
      paramCount++;
    }

    if (sort === 'price_asc') sql += ' ORDER BY books.price ASC';
    else if (sort === 'price_desc') sql += ' ORDER BY books.price DESC';
    else if (sort === 'rating') sql += ' ORDER BY books.id DESC';

    const result = await pool.query(sql, params);
    const rows = result.rows;

    // Add ratings
    const promises = rows.map(async (row) => {
      const bookRatingResult = await pool.query(
        'SELECT COALESCE(AVG(rating), 0) as avg_rating, COUNT(*) as review_count FROM reviews WHERE target_type = \'book\' AND target_id = $1',
        [row.id]
      );
      const shopRatingResult = await pool.query(
        'SELECT COALESCE(AVG(rating), 0) as avg_rating, COUNT(*) as review_count FROM reviews WHERE target_type = \'shop\' AND target_id = $1',
        [row.shop_id]
      );
      
      return {
        ...row,
        book_rating: parseFloat(bookRatingResult.rows[0].avg_rating),
        book_reviews: bookRatingResult.rows[0].review_count,
        shop_rating: parseFloat(shopRatingResult.rows[0].avg_rating),
        shop_reviews: shopRatingResult.rows[0].review_count
      };
    });

    const results = await Promise.all(promises);
    
    if (sort === 'rating') {
      results.sort((a, b) => b.book_rating - a.book_rating);
    }

    res.json(results);
  } catch (err) {
    console.error('Error fetching books:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get grades
app.get('/grades', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT DISTINCT grade FROM books WHERE grade IS NOT NULL AND grade != \'\' ORDER BY grade'
    );
    const dbGrades = result.rows.map(r => r.grade).filter(Boolean);
    const taxonomyGrades = Object.keys(TAXONOMY);
    const merged = Array.from(new Set([...taxonomyGrades, ...dbGrades]));
    res.json(merged.length > 0 ? merged : DEFAULT_GRADES);
  } catch (err) {
    console.error('Error fetching grades:', err && err.message ? err.message : err);
    // Fallback: return default grades so frontend keeps working while DB is fixed
    return res.json(DEFAULT_GRADES);
  }
});

// Get subjects by grade
app.get('/subjects', async (req, res) => {
  try {
    const { grade } = req.query;
    if (!grade) return res.status(400).json({ error: 'Grade required' });

    const t = TAXONOMY[grade];
    if (t) {
      if (t.streams) {
        const subj = Array.from(new Set(Object.values(t.streams).flat()));
        return res.json(subj);
      }
    }

    const result = await pool.query(
      'SELECT DISTINCT subject FROM books WHERE grade = $1 AND subject IS NOT NULL AND subject != \'\' ORDER BY subject',
      [grade]
    );
    const subjects = result.rows.map(r => r.subject).filter(Boolean);
    res.json(subjects.length > 0 ? subjects : DEFAULT_SUBJECTS);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single book
app.get('/books/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { student_id } = req.query;

    const result = await pool.query(
      `SELECT books.*, shops.shop_name, shops.city, shops.phone, shops.address, shops.id as shop_id 
       FROM books JOIN shops ON books.shop_id = shops.id WHERE books.id = $1`,
      [id]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: 'Book not found' });

    let row = result.rows[0];
    let phone = row.phone;

    if (student_id) {
      const orderResult = await pool.query(
        'SELECT id FROM orders WHERE student_id = $1 AND shop_id = $2 AND status != \'cancelled\'',
        [student_id, row.shop_id]
      );
      if (orderResult.rows.length === 0) phone = null;
    } else {
      phone = null;
    }

    const bookRatingResult = await pool.query(
      'SELECT COALESCE(AVG(rating), 0) as avg_rating, COUNT(*) as review_count FROM reviews WHERE target_type = \'book\' AND target_id = $1',
      [id]
    );

    const shopRatingResult = await pool.query(
      'SELECT COALESCE(AVG(rating), 0) as avg_rating, COUNT(*) as review_count FROM reviews WHERE target_type = \'shop\' AND target_id = $1',
      [row.shop_id]
    );

    res.json({
      ...row,
      phone,
      book_rating: parseFloat(bookRatingResult.rows[0].avg_rating),
      book_reviews: bookRatingResult.rows[0].review_count,
      shop_rating: parseFloat(shopRatingResult.rows[0].avg_rating),
      shop_reviews: shopRatingResult.rows[0].review_count
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add book
app.post('/books', upload.single('cover'), async (req, res) => {
  try {
    const { shop_id, book_name, edition, subject, grade, price, condition, stock } = req.body;
    const cover_url = req.file ? `/uploads/${req.file.filename}` : null;

    const result = await pool.query(
      'INSERT INTO books (shop_id, book_name, edition, subject, grade, price, condition, stock, cover_url) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id',
      [shop_id, book_name, edition, subject, grade, price, condition, stock || 1, cover_url]
    );

    res.json({ id: result.rows[0].id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update book
app.put('/books/:id', upload.single('cover'), async (req, res) => {
  try {
    const { id } = req.params;
    const { book_name, edition, subject, grade, price, condition, stock } = req.body;

    let cover_url = req.body.cover_url;
    if (req.file) cover_url = `/uploads/${req.file.filename}`;

    await pool.query(
      'UPDATE books SET book_name = $1, edition = $2, subject = $3, grade = $4, price = $5, condition = $6, stock = $7, cover_url = $8 WHERE id = $9',
      [book_name, edition, subject, grade, price, condition, stock, cover_url, id]
    );

    res.json({ message: 'Updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete book
app.delete('/books/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM books WHERE id = $1', [id]);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ========== ORDER ROUTES ==========

// Create order
app.post('/orders', async (req, res) => {
  try {
    const { book_id, student_name: reqStudentName, student_phone: reqStudentPhone, student_address, payment_method, student_id } = req.body;

    if (!book_id || !student_address || ((!(reqStudentName && reqStudentPhone)) && !student_id)) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    let student_name = reqStudentName;
    let student_phone = reqStudentPhone;

    const bookResult = await pool.query(
      'SELECT books.shop_id, books.price, shops.upi_id, shops.shop_name FROM books JOIN shops ON books.shop_id = shops.id WHERE books.id = $1',
      [book_id]
    );

    if (bookResult.rows.length === 0) return res.status(500).json({ error: 'Book or shop not found' });

    const data = bookResult.rows[0];
    const orderId = 'ORD-' + Date.now();
    let qr_url = null;

    if (payment_method === 'upi' && data.upi_id) {
      const upiUrl = `upi://pay?pa=${data.upi_id}&pn=${encodeURIComponent(data.shop_name)}&am=${data.price}&cu=INR&tn=${orderId}`;
      qr_url = await qrcode.toDataURL(upiUrl);
    }

    if ((!student_name || !student_phone) && student_id) {
      const studentResult = await pool.query('SELECT name, phone FROM students WHERE id = $1', [student_id]);
      if (studentResult.rows.length === 0) return res.status(400).json({ error: 'Student not found' });
      student_name = studentResult.rows[0].name;
      student_phone = studentResult.rows[0].phone;
    }

    const orderResult = await pool.query(
      'INSERT INTO orders (order_id, student_name, student_phone, student_address, book_id, shop_id, payment_method, qr_url, student_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id',
      [orderId, student_name, student_phone, student_address, book_id, data.shop_id, payment_method, qr_url, student_id]
    );

    // Add notification to shop
    await pool.query(
      'INSERT INTO notifications (user_type, user_id, message) VALUES ($1, $2, $3)',
      ['shop', data.shop_id, `New order received: ${orderId}`]
    );

    // Decrease stock
    await pool.query('UPDATE books SET stock = stock - 1 WHERE id = $1', [book_id]);

    res.json({ order_id: orderId, qr_url, id: orderResult.rows[0].id });
  } catch (err) {
    console.error('Error creating order:', err);
    res.status(500).json({ error: err.message });
  }
});

// Checkout from cart
app.post('/orders/checkout', async (req, res) => {
  try {
    const { student_id, student_address, payment_method } = req.body;
    if (!student_id || !student_address) return res.status(400).json({ error: 'Student ID and address required' });

    const cartResult = await pool.query(
      `SELECT c.*, b.price, b.shop_id, s.upi_id, s.shop_name FROM cart c 
       JOIN books b ON c.book_id = b.id 
       JOIN shops s ON b.shop_id = s.id 
       WHERE c.student_id = $1`,
      [student_id]
    );

    if (cartResult.rows.length === 0) return res.status(400).json({ error: 'Cart is empty' });

    const studentResult = await pool.query('SELECT name, phone FROM students WHERE id = $1', [student_id]);
    if (studentResult.rows.length === 0) return res.status(500).json({ error: 'Student not found' });

    const student = studentResult.rows[0];
    const orders = [];
    const totalItems = cartResult.rows.length;
    let completed = 0;

    for (const item of cartResult.rows) {
      const orderId = 'ORD-' + Date.now() + '-' + item.book_id;
      let qr_url = null;

      if (payment_method === 'upi' && item.upi_id) {
        const upiUrl = `upi://pay?pa=${item.upi_id}&pn=${encodeURIComponent(item.shop_name)}&am=${item.price * item.quantity}&cu=INR&tn=${orderId}`;
        qr_url = await qrcode.toDataURL(upiUrl);
      }

      await pool.query(
        'INSERT INTO orders (order_id, student_name, student_phone, student_address, book_id, shop_id, payment_method, qr_url, student_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
        [orderId, student.name, student.phone, student_address, item.book_id, item.shop_id, payment_method, qr_url, student_id]
      );

      // Decrease stock
      await pool.query('UPDATE books SET stock = stock - 1 WHERE id = $1', [item.book_id]);

      orders.push({ order_id: orderId, qr_url });
      completed++;
    }

    // Clear cart
    await pool.query('DELETE FROM cart WHERE student_id = $1', [student_id]);

    res.json({ orders });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get orders by phone
app.get('/orders', async (req, res) => {
  try {
    const { phone } = req.query;
    if (!phone) return res.status(400).json({ error: 'Phone required' });

    const result = await pool.query(
      'SELECT orders.*, books.book_name FROM orders JOIN books ON orders.book_id = books.id WHERE orders.student_phone = $1',
      [phone]
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get orders by student
app.get('/orders/student/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;

    const result = await pool.query(
      'SELECT orders.*, books.book_name FROM orders JOIN books ON orders.book_id = books.id WHERE orders.student_id = $1',
      [studentId]
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get orders for a shop
app.get('/orders/shop/:shopId', async (req, res) => {
  try {
    const { shopId } = req.params;
    const { status } = req.query;

    let sql = 'SELECT orders.*, books.book_name FROM orders JOIN books ON orders.book_id = books.id WHERE orders.shop_id = $1';
    const params = [shopId];

    if (status) {
      sql += ' AND orders.status = $2';
      params.push(status);
    } else {
      sql += ' AND orders.status != \'delivered\'';
    }

    const result = await pool.query(sql, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update order status
app.put('/orders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (status === 'delivered') {
      await pool.query('UPDATE orders SET status = $1, payment_status = \'paid\' WHERE id = $2', [status, id]);
    } else {
      await pool.query('UPDATE orders SET status = $1 WHERE id = $2', [status, id]);
    }

    const orderResult = await pool.query('SELECT student_id, book_id FROM orders WHERE id = $1', [id]);
    const order = orderResult.rows[0];

    if (order && order.student_id) {
      await pool.query(
        'INSERT INTO notifications (user_type, user_id, message) VALUES ($1, $2, $3)',
        ['student', order.student_id, `Your order status has been updated to ${status}.`]
      );
    }

    res.json({ message: 'Order updated', book_id: order.book_id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Cancel order
app.put('/orders/:id/cancel', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'UPDATE orders SET status = \'cancelled\' WHERE id = $1 AND status = \'pending\' RETURNING id',
      [id]
    );

    if (result.rows.length > 0) {
      const orderResult = await pool.query('SELECT shop_id FROM orders WHERE id = $1', [id]);
      const order = orderResult.rows[0];

      if (order) {
        await pool.query(
          'INSERT INTO notifications (user_type, user_id, message) VALUES ($1, $2, $3)',
          ['shop', order.shop_id, `Order ${id} has been cancelled.`]
        );
      }

      res.json({ message: 'Order cancelled' });
    } else {
      res.status(400).json({ error: 'Order cannot be cancelled' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update transaction ID
app.put('/orders/:id/transaction', async (req, res) => {
  try {
    const { id } = req.params;
    const { transaction_id } = req.body;

    await pool.query('UPDATE orders SET transaction_id = $1 WHERE id = $2', [transaction_id, id]);
    res.json({ message: 'Transaction ID updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Mark payment as paid
app.put('/orders/:id/pay', async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query('UPDATE orders SET payment_status = \'paid\' WHERE id = $1', [id]);
    res.json({ message: 'Payment marked as paid' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update order status (for shop)
app.put('/orders/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const orderResult = await pool.query('SELECT * FROM orders WHERE id = $1', [id]);
    if (orderResult.rows.length === 0) return res.status(404).json({ error: 'Order not found' });

    const order = orderResult.rows[0];

    await pool.query('UPDATE orders SET status = $1 WHERE id = $2', [status, id]);

    let message = '';
    if (status === 'confirmed') {
      message = 'Your order has been confirmed by the shop.';
      if (order.student_id) {
        await pool.query(
          'INSERT INTO notifications (user_type, user_id, message) VALUES ($1, $2, $3)',
          ['student', order.student_id, message]
        );
      }
    } else if (status === 'rejected') {
      await pool.query('UPDATE books SET stock = stock + 1 WHERE id = $1', [order.book_id]);
      message = 'Your order has been rejected by the shop.';
      if (order.student_id) {
        await pool.query(
          'INSERT INTO notifications (user_type, user_id, message) VALUES ($1, $2, $3)',
          ['student', order.student_id, message]
        );
      }
    } else if (status === 'delivered') {
      message = 'Your order has been delivered.';
      if (order.student_id) {
        await pool.query(
          'INSERT INTO notifications (user_type, user_id, message) VALUES ($1, $2, $3)',
          ['student', order.student_id, message]
        );
      }
    }

    res.json({ message: 'Status updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ========== SHOP ROUTES ==========

// Shop register
app.post('/shops/register', async (req, res) => {
  try {
    const { shop_name, owner_name, phone, password, address, city } = req.body;
    const hashedPassword = bcrypt.hashSync(password, 10);

    const result = await pool.query(
      'INSERT INTO shops (shop_name, owner_name, phone, password, address, city) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
      [shop_name, owner_name, phone, hashedPassword, address, city]
    );

    res.json({ shop_id: result.rows[0].id });
  } catch (err) {
    console.error('❌ /shops/register error:', err.message);
    console.error('Error code:', err.code, '| Error detail:', err.detail || 'N/A');
    res.status(500).json({ error: err.message, code: err.code });
  }
});

// Shop login
app.post('/shops/login', async (req, res) => {
  try {
    const { phone, password } = req.body;

    const result = await pool.query('SELECT * FROM shops WHERE phone = $1', [phone]);

    if (result.rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });

    const shop = result.rows[0];

    if (!bcrypt.compareSync(password, shop.password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!shop.verified) {
      return res.status(401).json({ error: 'Account not approved yet.' });
    }

    res.json({ shop_id: shop.id, shop_name: shop.shop_name });
  } catch (err) {
    console.error('❌ /shops/login error:', err.message);
    console.error('Error code:', err.code, '| Error detail:', err.detail || 'N/A');
    res.status(500).json({ error: err.message, code: err.code });
  }
});

// Get shop profile
app.get('/shops/:id/profile', async (req, res) => {
  try {
    const { id } = req.params;
    const { student_id } = req.query;

    const result = await pool.query(
      'SELECT shop_name, owner_name, phone, address, city, logo_url, banner_url, upi_id FROM shops WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: 'Shop not found' });

    let row = result.rows[0];

    if (student_id) {
      const orderResult = await pool.query(
        'SELECT id FROM orders WHERE student_id = $1 AND shop_id = $2 AND status != \'cancelled\'',
        [student_id, id]
      );
      
      if (orderResult.rows.length === 0) {
        const { phone, ...profile } = row;
        return res.json(profile);
      }
    } else {
      const { phone, ...profile } = row;
      return res.json(profile);
    }

    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update shop profile
app.put('/shops/:id/profile', upload.fields([{ name: 'logo' }, { name: 'banner' }]), async (req, res) => {
  try {
    const { id } = req.params;
    const { shop_name, owner_name, phone, address, city } = req.body;

    const currentResult = await pool.query('SELECT logo_url, banner_url FROM shops WHERE id = $1', [id]);
    if (currentResult.rows.length === 0) return res.status(404).json({ error: 'Shop not found' });

    const current = currentResult.rows[0];
    let logo_url = current.logo_url;
    let banner_url = current.banner_url;

    if (req.files && req.files.logo) logo_url = `/uploads/${req.files.logo[0].filename}`;
    if (req.files && req.files.banner) banner_url = `/uploads/${req.files.banner[0].filename}`;

    await pool.query(
      'UPDATE shops SET shop_name = $1, owner_name = $2, phone = $3, address = $4, city = $5, logo_url = $6, banner_url = $7 WHERE id = $8',
      [shop_name, owner_name, phone, address, city, logo_url, banner_url, id]
    );

    res.json({ message: 'Profile updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update shop UPI ID
app.put('/shops/:id/upi', async (req, res) => {
  try {
    const { id } = req.params;
    const { upi_id } = req.body;

    await pool.query('UPDATE shops SET upi_id = $1 WHERE id = $2', [upi_id, id]);
    res.json({ message: 'UPI ID updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get shop analytics
app.get('/shops/:id/analytics', async (req, res) => {
  try {
    const { id } = req.params;

    const ordersResult = await pool.query('SELECT COUNT(*) as count FROM orders WHERE shop_id = $1', [id]);
    const revenueResult = await pool.query(
      'SELECT COALESCE(SUM(books.price), 0) as total FROM orders JOIN books ON orders.book_id = books.id WHERE orders.shop_id = $1 AND orders.status = \'delivered\' AND orders.payment_status = \'paid\'',
      [id]
    );

    const today = new Date().toISOString().split('T')[0];
    const todayResult = await pool.query(
      'SELECT COALESCE(SUM(books.price), 0) as total FROM orders JOIN books ON orders.book_id = books.id WHERE orders.shop_id = $1 AND orders.status = \'delivered\' AND orders.payment_status = \'paid\' AND DATE(orders.created_at) = $2::date',
      [id, today]
    );

    const ratingResult = await pool.query(
      'SELECT COALESCE(AVG(rating), 0) as avg_rating FROM reviews WHERE target_type = \'shop\' AND target_id = $1',
      [id]
    );

    res.json({
      totalOrders: ordersResult.rows[0].count,
      totalRevenue: parseFloat(revenueResult.rows[0].total),
      todayRevenue: parseFloat(todayResult.rows[0].total),
      avgRating: parseFloat(ratingResult.rows[0].avg_rating)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get shop rating
app.get('/shops/:id/rating', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'SELECT COALESCE(AVG(rating), 0) as avg_rating, COUNT(*) as review_count FROM reviews WHERE target_type = \'shop\' AND target_id = $1',
      [id]
    );

    res.json({
      avg_rating: parseFloat(result.rows[0].avg_rating),
      review_count: result.rows[0].review_count
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ========== STUDENT ROUTES ==========

// Student register
app.post('/students/register', async (req, res) => {
  try {
    const { name, phone, password } = req.body;
    const hashedPassword = bcrypt.hashSync(password, 10);

    const result = await pool.query(
      'INSERT INTO students (name, phone, password) VALUES ($1, $2, $3) RETURNING id',
      [name, phone, hashedPassword]
    );

    res.json({ student_id: result.rows[0].id });
  } catch (err) {
    console.error('❌ /students/register error:', err.message);
    console.error('Error code:', err.code, '| Error detail:', err.detail || 'N/A');
    res.status(500).json({ error: err.message, code: err.code });
  }
});

// Student login
app.post('/students/login', async (req, res) => {
  try {
    const { phone, password } = req.body;

    const result = await pool.query('SELECT * FROM students WHERE phone = $1', [phone]);

    if (result.rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });

    const student = result.rows[0];

    if (!bcrypt.compareSync(password, student.password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    res.json({ student_id: student.id, student_name: student.name, student_phone: student.phone });
  } catch (err) {
    console.error('❌ /students/login error:', err.message);
    console.error('Error code:', err.code, '| Error detail:', err.detail || 'N/A');
    res.status(500).json({ error: err.message, code: err.code });
  }
});

// Get student profile
app.get('/students/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query('SELECT name, phone, address FROM students WHERE id = $1', [id]);

    if (result.rows.length === 0) return res.status(404).json({ error: 'Student not found' });

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update student profile
app.put('/students/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, address } = req.body;

    await pool.query(
      'UPDATE students SET name = $1, phone = $2, address = $3 WHERE id = $4',
      [name, phone, address, id]
    );

    res.json({ message: 'Profile updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ========== CART ROUTES ==========

// Add to cart
app.post('/cart/add', async (req, res) => {
  try {
    const { student_id, book_id, quantity = 1 } = req.body;

    await pool.query(
      'INSERT INTO cart (student_id, book_id, quantity) VALUES ($1, $2, $3) ON CONFLICT (student_id, book_id) DO UPDATE SET quantity = $3',
      [student_id, book_id, quantity]
    );

    res.json({ message: 'Added to cart' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get cart
app.get('/cart/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;

    const result = await pool.query(
      `SELECT c.*, b.book_name, b.price, b.condition, s.shop_name
       FROM cart c
       JOIN books b ON c.book_id = b.id
       JOIN shops s ON b.shop_id = s.id
       WHERE c.student_id = $1`,
      [studentId]
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update cart
app.put('/cart/update', async (req, res) => {
  try {
    const { student_id, book_id, quantity } = req.body;

    if (quantity < 1) return res.status(400).json({ error: 'Invalid quantity' });

    await pool.query(
      'UPDATE cart SET quantity = $1 WHERE student_id = $2 AND book_id = $3',
      [quantity, student_id, book_id]
    );

    res.json({ message: 'Cart updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Remove from cart
app.delete('/cart/remove', async (req, res) => {
  try {
    const { student_id, book_id } = req.body;

    await pool.query('DELETE FROM cart WHERE student_id = $1 AND book_id = $2', [student_id, book_id]);

    res.json({ message: 'Removed from cart' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Clear cart
app.delete('/cart/clear/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;

    await pool.query('DELETE FROM cart WHERE student_id = $1', [studentId]);

    res.json({ message: 'Cart cleared' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ========== WISHLIST ROUTES ==========

// Add to wishlist
app.post('/wishlists', async (req, res) => {
  try {
    const { student_id, book_id } = req.body;

    const result = await pool.query(
      'INSERT INTO wishlist (student_id, book_id) VALUES ($1, $2) ON CONFLICT (student_id, book_id) DO NOTHING RETURNING id',
      [student_id, book_id]
    );

    res.json({ id: result.rows[0]?.id || null });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Remove from wishlist
app.delete('/wishlists', async (req, res) => {
  try {
    const { student_id, book_id } = req.body;

    await pool.query('DELETE FROM wishlist WHERE student_id = $1 AND book_id = $2', [student_id, book_id]);

    res.json({ message: 'Removed from wishlist' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get wishlists
app.get('/wishlists/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;

    const result = await pool.query(
      'SELECT books.* FROM wishlist JOIN books ON wishlist.book_id = books.id WHERE wishlist.student_id = $1',
      [studentId]
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ========== REVIEWS ROUTES ==========

// Add review
app.post('/reviews', async (req, res) => {
  try {
    const { target_type, target_id, reviewer_type, reviewer_id, rating, comment } = req.body;

    if (!target_type || !target_id || !reviewer_type || !reviewer_id || !rating) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const existingResult = await pool.query(
      'SELECT id FROM reviews WHERE target_type = $1 AND target_id = $2 AND reviewer_type = $3 AND reviewer_id = $4',
      [target_type, target_id, reviewer_type, reviewer_id]
    );

    if (existingResult.rows.length > 0) {
      return res.status(400).json({ error: 'You have already rated this' });
    }

    const result = await pool.query(
      'INSERT INTO reviews (target_type, target_id, reviewer_type, reviewer_id, rating, comment) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
      [target_type, target_id, reviewer_type, reviewer_id, rating, comment]
    );

    res.json({ id: result.rows[0].id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get reviews
app.get('/reviews/:target_type/:target_id', async (req, res) => {
  try {
    const { target_type, target_id } = req.params;

    const result = await pool.query(
      `SELECT reviews.*, students.name as student_name, shops.shop_name as shop_name 
       FROM reviews 
       LEFT JOIN students ON reviews.reviewer_id = students.id AND reviews.reviewer_type = 'student'
       LEFT JOIN shops ON reviews.reviewer_id = shops.id AND reviews.reviewer_type = 'shop'
       WHERE reviews.target_type = $1 AND reviews.target_id = $2 
       ORDER BY reviews.created_at DESC`,
      [target_type, target_id]
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ========== ADMIN ROUTES ==========

// Admin login
app.post('/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    const result = await pool.query('SELECT * FROM admins WHERE username = $1', [username]);

    if (result.rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });

    const admin = result.rows[0];

    if (!bcrypt.compareSync(password, admin.password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    res.json({ message: 'Login successful' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all shops for admin
app.get('/admin/shops', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT shops.id, shop_name, owner_name, phone, city, verified, notification, shops.created_at,
             COALESCE(AVG(reviews.rating), 0) as avg_rating, COUNT(reviews.id) as review_count
      FROM shops
      LEFT JOIN reviews ON reviews.target_type = 'shop' AND reviews.target_id = shops.id
      GROUP BY shops.id
    `);

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get admin analytics
app.get('/admin/analytics', async (req, res) => {
  try {
    const shopsResult = await pool.query('SELECT COUNT(*) as count FROM shops');
    const verifiedResult = await pool.query('SELECT COUNT(*) as count FROM shops WHERE verified = true');
    const booksResult = await pool.query('SELECT COUNT(*) as count FROM books');
    const ordersResult = await pool.query('SELECT COUNT(*) as count FROM orders');
    const revenueResult = await pool.query(
      'SELECT COALESCE(SUM(books.price), 0) as total FROM orders JOIN books ON orders.book_id = books.id WHERE orders.status = \'delivered\' AND orders.payment_status = \'paid\''
    );
    const ratingResult = await pool.query('SELECT COALESCE(AVG(rating), 0) as avg_rating FROM reviews WHERE target_type = \'shop\'');

    res.json({
      totalShops: shopsResult.rows[0].count,
      verifiedShops: verifiedResult.rows[0].count,
      totalBooks: booksResult.rows[0].count,
      totalOrders: ordersResult.rows[0].count,
      totalRevenue: parseFloat(revenueResult.rows[0].total),
      avgRating: parseFloat(ratingResult.rows[0].avg_rating)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Verify/reject shop
app.put('/admin/shops/:id/verify', async (req, res) => {
  try {
    const { id } = req.params;
    const { verified, notification } = req.body;

    await pool.query('UPDATE shops SET verified = $1, notification = $2 WHERE id = $3', [verified, notification, id]);

    if (verified) {
      await pool.query(
        'INSERT INTO notifications (user_type, user_id, message) VALUES ($1, $2, $3)',
        ['shop', id, 'Your shop has been approved by admin.']
      );
    }

    res.json({ message: 'Shop updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get students for admin
app.get('/admin/students', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name as student_name, phone, grade FROM students');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete student
app.delete('/admin/students/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM students WHERE id = $1', [id]);
    res.json({ message: 'Student deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all orders for admin
app.get('/admin/orders', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT orders.*, books.book_name, students.name as student_name FROM orders JOIN books ON orders.book_id = books.id JOIN students ON orders.student_id = students.id'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update order payment status
app.put('/admin/orders/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { payment_status } = req.body;

    await pool.query('UPDATE orders SET payment_status = $1 WHERE id = $2', [payment_status, id]);
    res.json({ message: 'Order updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get unique cities
app.get('/admin/cities', async (req, res) => {
  try {
    const result = await pool.query('SELECT DISTINCT city FROM shops ORDER BY city');
    res.json(result.rows.map(r => r.city));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ========== NOTIFICATIONS ROUTES ==========

// Get notifications
app.get('/notifications/:user_type/:user_id', async (req, res) => {
  try {
    const { user_type, user_id } = req.params;

    const result = await pool.query(
      'SELECT * FROM notifications WHERE user_type = $1 AND user_id = $2 ORDER BY created_at DESC',
      [user_type, user_id]
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add notification
app.post('/notifications', async (req, res) => {
  try {
    const { user_type, user_id, message } = req.body;

    if (!user_type || !user_id || !message) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!['student', 'shop'].includes(user_type)) {
      return res.status(400).json({ error: 'Invalid user_type' });
    }

    const result = await pool.query(
      'INSERT INTO notifications (user_type, user_id, message) VALUES ($1, $2, $3) RETURNING id',
      [user_type, user_id, message]
    );

    res.json({ id: result.rows[0].id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Mark notification as read
app.put('/notifications/:id/read', async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query('UPDATE notifications SET is_read = true WHERE id = $1', [id]);
    res.json({ message: 'Notification marked as read' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// TEMPORARY: Delete all data endpoint (remove after use)
app.delete('/admin/clear-database', async (req, res) => {
  try {
    await pool.query('TRUNCATE TABLE cart CASCADE');
    await pool.query('TRUNCATE TABLE wishlist CASCADE');
    await pool.query('TRUNCATE TABLE reviews CASCADE');
    await pool.query('TRUNCATE TABLE notifications CASCADE');
    await pool.query('TRUNCATE TABLE orders CASCADE');
    await pool.query('TRUNCATE TABLE books CASCADE');
    await pool.query('TRUNCATE TABLE students CASCADE');
    await pool.query('TRUNCATE TABLE shops CASCADE');
    await pool.query('TRUNCATE TABLE admins CASCADE');
    res.json({ message: '✅ All data cleared successfully!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// ========== START SERVER ==========

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
