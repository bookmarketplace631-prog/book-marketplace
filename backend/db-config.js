const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'bookmarketplace'
});

// Handle pool errors
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

// Initialize database tables
async function initDB() {
  try {
    // Students table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS students (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(20) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        address TEXT,
        grade VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Shops table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS shops (
        id SERIAL PRIMARY KEY,
        shop_name VARCHAR(255) NOT NULL,
        owner_name VARCHAR(255) NOT NULL,
        phone VARCHAR(20) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        address TEXT NOT NULL,
        city VARCHAR(100) NOT NULL,
        upi_id VARCHAR(255),
        logo_url TEXT,
        banner_url TEXT,
        verified BOOLEAN DEFAULT FALSE,
        notification TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Books table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS books (
        id SERIAL PRIMARY KEY,
        shop_id INTEGER NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
        book_name VARCHAR(255) NOT NULL,
        edition VARCHAR(100),
        subject VARCHAR(100),
        grade VARCHAR(50),
        price DECIMAL(10, 2) NOT NULL,
        condition VARCHAR(20) CHECK (condition IN ('new', 'used')) DEFAULT 'new',
        in_stock BOOLEAN DEFAULT TRUE,
        stock INTEGER DEFAULT 1,
        cover_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Orders table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        order_id VARCHAR(255) UNIQUE NOT NULL,
        student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        student_name VARCHAR(255) NOT NULL,
        shop_id INTEGER NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
        book_ids TEXT NOT NULL,
        quantities TEXT NOT NULL,
        prices TEXT NOT NULL,
        total_price DECIMAL(10, 2) NOT NULL,
        student_address TEXT NOT NULL,
        order_status VARCHAR(50) DEFAULT 'pending',
        payment_status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Cart table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS cart (
        id SERIAL PRIMARY KEY,
        student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        book_id INTEGER NOT NULL REFERENCES books(id) ON DELETE CASCADE,
        quantity INTEGER DEFAULT 1,
        added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Wishlist table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS wishlist (
        id SERIAL PRIMARY KEY,
        student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        book_id INTEGER NOT NULL REFERENCES books(id) ON DELETE CASCADE,
        added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Reviews table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id SERIAL PRIMARY KEY,
        target_type VARCHAR(50) NOT NULL,
        target_id INTEGER NOT NULL,
        reviewer_type VARCHAR(50) NOT NULL,
        reviewer_id INTEGER NOT NULL,
        rating INTEGER CHECK (rating >= 1 AND rating <= 5),
        comment TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Notifications table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_type VARCHAR(50) NOT NULL,
        user_id INTEGER NOT NULL,
        message TEXT NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('✓ Database tables initialized');
  } catch (err) {
    console.error('Error initializing database:', err);
  }
}

module.exports = { pool, initDB };
