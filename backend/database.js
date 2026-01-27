const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcrypt');

const dbPath = path.join(__dirname, 'mybook.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  // Shops table (add verified and notification)
    db.run(`
    CREATE TABLE IF NOT EXISTS shops (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      shop_name TEXT NOT NULL,
      owner_name TEXT NOT NULL,
      phone TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      address TEXT NOT NULL,
      city TEXT NOT NULL,
      upi_id TEXT,
      verified BOOLEAN DEFAULT 0,
      notification TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Books table
  db.run(`
    CREATE TABLE IF NOT EXISTS books (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      shop_id INTEGER NOT NULL,
      book_name TEXT NOT NULL,
      edition TEXT,
      grade TEXT,
      subject TEXT,
      category TEXT DEFAULT 'academic',
      price REAL NOT NULL,
      condition TEXT CHECK(condition IN ('new', 'used')) DEFAULT 'new',
      stock INTEGER DEFAULT 1,
      cover_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (shop_id) REFERENCES shops(id)
    )
  `);

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
      status TEXT CHECK(status IN ('pending', 'confirmed', 'delivered', 'rejected', 'cancelled')) DEFAULT 'pending',
      qr_url TEXT,
      transaction_id TEXT,
      student_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (book_id) REFERENCES books(id),
      FOREIGN KEY (shop_id) REFERENCES shops(id)
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

  // ...existing code...

  console.log('Database and tables created successfully.');
  
  // Insert sample admin
  db.run(`INSERT OR IGNORE INTO admins (username, password) VALUES ('admin', ?)`, [bcrypt.hashSync('admin123', 10)], (err) => {
    if (err) console.log('Error inserting admin:', err);
    else console.log('Sample admin inserted.');
  });
  
  // Insert sample shop (verified)
  db.run(`INSERT OR IGNORE INTO shops (shop_name, owner_name, phone, password, address, city, verified) VALUES ('Sample Shop', 'Owner Name', '1234567890', ?, 'Sample Address', 'Surat', 1)`, [bcrypt.hashSync('password', 10)], (err) => {
    if (err) console.log('Error inserting shop:', err);
    else console.log('Sample shop inserted.');
  });
  
  // No sample data inserts (fresh start)
});

module.exports = db;

