# Markline Forums Setup Guide

## Overview
The forums and appeals are now connected to a PostgreSQL database, so they persist when you reload the page. All data is stored on the server.

## Prerequisites
- Node.js 14+ installed
- PostgreSQL 12+ installed and running
- npm (comes with Node.js)

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Create Database
1. Open PostgreSQL and create a database:
```sql
CREATE DATABASE markline;
```

### 3. Setup Environment Variables
1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Edit `.env` with your PostgreSQL credentials:
```
DB_USER=postgres
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=markline
PORT=3000
```

### 4. Run Database Migration
Connect to PostgreSQL and run the migration:
```bash
psql -U postgres -d markline -f db/migration.sql
```

This creates the `forum_posts` and `appeals` tables.

### 5. Start the Server
```bash
npm start
```

The server will run on `http://localhost:3000`

For development with auto-reload:
```bash
npm run dev
```

### 6. Access Forums
Open `Forums/forums.html` in your browser. The forums will now:
- Save posts and appeals to the database
- Persist across page reloads
- Show all community posts
- Store appeals history per user

## API Endpoints

### Forum Posts
- `GET /api/forum/posts` - Get all posts
- `POST /api/forum/posts` - Create new post
- `DELETE /api/forum/posts/:id` - Delete post

### Appeals
- `GET /api/appeals` - Get all appeals
- `GET /api/appeals/user/:author` - Get user's appeals
- `POST /api/appeals` - Create new appeal

## Troubleshooting

**"Error loading posts" message?**
- Check server is running: `npm start`
- Check PostgreSQL is running
- Check `.env` database credentials are correct

**Database connection error?**
- Verify PostgreSQL is running
- Check database exists: `psql -U postgres -l`
- Check credentials in `.env`

**CORS errors?**
- Make sure you're accessing from `http://localhost:3000` or the forums page includes the API URL

## Next Steps
- Set up authentication to link appeals to user accounts
- Add moderation panel for reviewing appeals
- Add email notifications for new posts
- Add post categories/tags
