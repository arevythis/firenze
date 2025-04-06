const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const pool = require('./db');
const path = require('path');

const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from root directory
app.use(express.static(path.join(__dirname)));

// Logging middleware to debug requests
app.use((req, res, next) => {
  console.log(`Received ${req.method} request for ${req.url}`);
  next();
});

// Test database connection route
app.get('/test-db', async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    res.status(200).json({ message: 'Database connection successful', time: result.rows[0] });
  } catch (err) {
    console.error('Error connecting to the database:', err);
    res.status(500).json({ error: 'Database connection error' });
  }
});

// Sign-up route
app.post('/signup', async (req, res) => {
  const { name, address, email, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const client = await pool.connect();
    const result = await client.query(
      'INSERT INTO users (name, address, email, password) VALUES ($1, $2, $3, $4) RETURNING id',
      [name, address, email, hashedPassword]
    );
    client.release();
    res.status(201).json({ userId: result.rows[0].id, message: 'User registered successfully' });
  } catch (err) {
    console.error('Error registering user:', err);
    res.status(500).json({ error: 'Error registering user' });
  }
});

// Login route
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT * FROM users WHERE email = $1', [email]);
    client.release();
    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'User not found' });
    }
    const user = result.rows[0];
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ error: 'Invalid password' });
    }
    res.status(200).json({ userId: user.id, message: 'Login successful' });
  } catch (err) {
    console.error('Error logging in:', err);
    res.status(500).json({ error: 'Error logging in' });
  }
});

// Serve index.html for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});