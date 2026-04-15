const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname)); // Serve static files

// Database connection
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'markline'
});

// FORUM POSTS ENDPOINTS

// Get all forum posts
app.get('/api/forum/posts', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, title, content, author, created_at FROM forum_posts ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching posts:', err);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

// Create forum post
app.post('/api/forum/posts', async (req, res) => {
  const { title, content, author } = req.body;
  
  if (!title || !content || !author) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  try {
    const result = await pool.query(
      'INSERT INTO forum_posts (title, content, author) VALUES ($1, $2, $3) RETURNING id, title, content, author, created_at',
      [title, content, author]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating post:', err);
    res.status(500).json({ error: 'Failed to create post' });
  }
});

// Delete forum post
app.delete('/api/forum/posts/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    await pool.query('DELETE FROM forum_posts WHERE id = $1', [id]);
    res.json({ message: 'Post deleted' });
  } catch (err) {
    console.error('Error deleting post:', err);
    res.status(500).json({ error: 'Failed to delete post' });
  }
});

// APPEALS ENDPOINTS

// Get all appeals
app.get('/api/appeals', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, title, content, author, status, created_at FROM appeals ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching appeals:', err);
    res.status(500).json({ error: 'Failed to fetch appeals' });
  }
});

// Create appeal
app.post('/api/appeals', async (req, res) => {
  const { title, content, author } = req.body;
  
  if (!title || !content || !author) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  try {
    const result = await pool.query(
      'INSERT INTO appeals (title, content, author, status) VALUES ($1, $2, $3, $4) RETURNING id, title, content, author, status, created_at',
      [title, content, author, 'Pending']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating appeal:', err);
    res.status(500).json({ error: 'Failed to create appeal' });
  }
});

// Get user's appeals
app.get('/api/appeals/user/:author', async (req, res) => {
  const { author } = req.params;
  
  try {
    const result = await pool.query(
      'SELECT id, title, content, author, status, created_at FROM appeals WHERE author = $1 ORDER BY created_at DESC',
      [author]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching user appeals:', err);
    res.status(500).json({ error: 'Failed to fetch appeals' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running' });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = app;
