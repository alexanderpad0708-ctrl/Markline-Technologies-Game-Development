# Persistent Online Forums - Detailed Tutorial

This tutorial will walk you through setting up persistent online forums that save data to a database instead of your browser's local storage.

## Table of Contents
1. [Understanding the System](#understanding-the-system)
2. [Prerequisites](#prerequisites)
3. [Installing PostgreSQL](#installing-postgresql)
4. [Installing Node.js](#installing-nodejs)
5. [Setting Up the Project](#setting-up-the-project)
6. [Configuring the Database](#configuring-the-database)
7. [Running the Server](#running-the-server)
8. [Testing the Forums](#testing-the-forums)
9. [API Endpoints Explained](#api-endpoints-explained)
10. [Common Issues & Solutions](#common-issues--solutions)
11. [How It All Works Together](#how-it-all-works-together)

---

## Understanding the System

### The Problem with LocalStorage
Before, your forums used **localStorage** - a browser feature that stores data locally on your computer:
- ❌ Data only exists on that computer
- ❌ Different devices see different posts
- ❌ Clearing browser cache deletes everything
- ❌ Not suitable for a real community

### The New System with Database
Now we're using a **PostgreSQL database** with a **Node.js API server**:
- ✅ Data stored on a server
- ✅ All users see the same posts
- ✅ Data persists forever
- ✅ Real online community

### Architecture Overview

```
┌─────────────────┐
│  Your Browser   │
│  (Forums HTML)  │
└────────┬────────┘
         │ HTTP Requests
         │ (JSON)
         ↓
┌─────────────────────────┐
│   Node.js Server        │
│   (Express API)         │
│   - Handle requests     │
│   - Validate data       │
└────────┬────────────────┘
         │ SQL Queries
         ↓
┌─────────────────────────┐
│   PostgreSQL Database   │
│   - forum_posts table   │
│   - appeals table       │
└─────────────────────────┘
```

**Flow Example:**
1. You type a forum post in your browser
2. Browser sends it to Node.js server via HTTP
3. Server validates it and saves to PostgreSQL
4. All other users see the post when they refresh

---

## Prerequisites

You need to have or install:
- **Windows computer** (you have this ✓)
- **PostgreSQL** (free database software)
- **Node.js** (JavaScript runtime)
- **npm** (package manager, comes with Node.js)
- **Text editor** (VS Code recommended)
- **Command line / Terminal** (PowerShell or CMD)

### System Requirements
- **Disk space:** ~500MB for all software
- **RAM:** 2GB minimum
- **Internet:** Required for initial downloads and API calls

---

## Installing PostgreSQL

PostgreSQL is the database where your forum data lives.

### Step 1: Download PostgreSQL

1. Go to https://www.postgresql.org/download/windows/
2. Click **"Download the installer"**
3. Choose the latest version (15 or 16)
4. Download the Windows installer (.exe file)

### Step 2: Run the Installer

1. Double-click the downloaded `.exe` file
2. Click "Next >"
3. Choose installation directory (default is fine)
4. Click "Next >"
5. Select components to install:
   - ✓ PostgreSQL Server
   - ✓ pgAdmin 4 (helpful management tool)
   - ✓ Stack Builder
   - ✓ Command Line Tools
6. Click "Next >"
7. Choose data directory (default is fine)
8. Click "Next >"

### Step 3: Set Administrator Password

1. Enter a password for the `postgres` user (remember this!)
   - Example: `MySecurePassword123`
2. Confirm the password
3. Click "Next >"
4. Keep port as **5432** (default)
5. Click "Next >"
6. Choose locale (English, United States)
7. Click "Next >"
8. Click "Install"

**Wait for installation** - this takes a few minutes.

### Step 4: Verify Installation

1. Open PowerShell (search: "PowerShell")
2. Type this command:
```powershell
psql --version
```

**Expected output:** `psql (PostgreSQL) 15.x` or similar

---

## Installing Node.js

Node.js runs your server. npm comes with it automatically.

### Step 1: Download Node.js

1. Go to https://nodejs.org/
2. Click the **LTS (Long Term Support)** button
3. Download for Windows (64-bit)

### Step 2: Run the Installer

1. Double-click the `.msi` installer
2. Click "Next >"
3. Accept the license agreement
4. Click "Next >"
5. Use default installation path
6. Click "Next >"
7. Choose to install npm (should be checked by default)
8. Click "Next >"
9. Click "Install"

**Wait for installation** - this takes a minute or two.

### Step 3: Verify Installation

Open a **new PowerShell** window and type:

```powershell
node --version
npm --version
```

**Expected output:**
```
v18.x.x (or higher)
8.x.x (or higher)
```

*Note: Close and reopen PowerShell to see the updates.*

---

## Setting Up the Project

### Step 1: Navigate to Your Project

Open PowerShell and go to your project folder:

```powershell
cd "C:\Users\Alexa\OneDrive\Desktop\MarklineSite"
```

**Verify you see the files:**
```powershell
ls
```

You should see: `Forums`, `Engine`, `db`, `server.js`, `package.json`, etc.

### Step 2: Install Dependencies

Your `package.json` lists what libraries Node.js needs. Install them:

```powershell
npm install
```

**What it does:** Downloads and installs Express, PostgreSQL driver, CORS, etc.

**Wait for it to complete** - you'll see:
```
added 50 packages in 2.3s
```

You'll now have a new `node_modules` folder with all the code.

### Step 3: Verify Installation

```powershell
npm list express pg
```

Should show:
```
├── express@4.18.2
└── pg@8.8.0
```

---

## Configuring the Database

### Step 1: Create the Database

Open PowerShell and run:

```powershell
psql -U postgres
```

It will ask for your postgres password (the one you set during installation).

You're now in the PostgreSQL prompt (you'll see `postgres=#`).

Create a new database for Markline:

```sql
CREATE DATABASE markline;
```

Press Enter. You should see: `CREATE DATABASE`

Exit the prompt:
```sql
\q
```

### Step 2: Create Tables from Migration

The `migration.sql` file contains instructions to create your tables.

Run it:

```powershell
psql -U postgres -d markline -f db/migration.sql
```

This will create:
- `forum_posts` table - stores all forum posts
- `appeals` table - stores user appeals

**Expected output:**
```
CREATE TABLE
CREATE INDEX
CREATE TABLE
CREATE INDEX
CREATE INDEX
```

### Step 3: Verify Tables Were Created

Connect to the database and check:

```powershell
psql -U postgres -d markline
```

View all tables:
```sql
\dt
```

You should see:
```
       List of relations
 Schema |     Name      | Type  |  Owner
--------+---------------+-------+----------
 public | appeals       | table | postgres
 public | forum_posts   | table | postgres
```

Exit:
```sql
\q
```

### Step 4: Configure Your .env File

Edit `.env` in your project with your database credentials:

Current file:
```
DB_USER=postgres
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=markline
PORT=3000
```

**Replace `your_password` with the postgres password you set earlier**

Example:
```
DB_USER=postgres
DB_PASSWORD=MySecurePassword123
DB_HOST=localhost
DB_PORT=5432
DB_NAME=markline
PORT=3000
```

---

## Running the Server

### Step 1: Start Your Server

In PowerShell (in your project directory):

```powershell
npm start
```

**Expected output:**
```
Server running on http://localhost:3000
```

✓ Your server is now running!

**Don't close this PowerShell window** - it keeps the server alive.

### Step 2: Test the Server is Working

Open a **new PowerShell** window and test:

```powershell
curl http://localhost:3000/api/health
```

**Expected response:**
```json
{"status":"Server is running"}
```

If you see this, everything is working! 🎉

---

## Testing the Forums

### Step 1: Open the Forums

1. Keep your server running in PowerShell
2. Open a web browser
3. Go to: `http://localhost:3000/Forums/forums.html`

**Note:** Make sure to use `localhost:3000` - this connects to your running server!

### Step 2: Create Your First Post

1. Type a post title: "Hello Community!"
2. Type some content: "This is my first persistent forum post!"
3. Click "Post!"

**What happens:**
- Post sent to your Node.js server
- Server saves it to PostgreSQL database
- Post appears immediately on page

### Step 3: Refresh the Page

Press **F5** or **Ctrl+R** to reload.

**Magic happens here!** Your post is still there! 🎉

This is persistence - the post is saved in the database, not just your browser.

### Step 4: Test in Another Browser

1. Open a different browser (Firefox, Edge, etc.)
2. Go to same URL: `http://localhost:3000/Forums/forums.html`
3. You see the SAME post you created!

This proves it's truly online - multiple people/devices see the same data.

### Step 5: Test Appeals

1. Click "Appeals" tab
2. Submit an appeal
3. Refresh the page
4. Your appeal is still there

Each user only sees their own appeals.

---

## API Endpoints Explained

Your Node.js server provides these endpoints (URLs) for the forums to use:

### Forum Posts Endpoints

#### GET /api/forum/posts
**Get all forum posts**

```
URL: http://localhost:3000/api/forum/posts
Method: GET
Response: Array of all posts
```

**Example Response:**
```json
[
  {
    "id": 1,
    "title": "Hello Community!",
    "content": "This is my first persistent forum post!",
    "author": "John",
    "created_at": "2024-02-09T15:30:00.000Z"
  },
  {
    "id": 2,
    "title": "Great Game!",
    "content": "I'm loving the new Engine!",
    "author": "Sarah",
    "created_at": "2024-02-09T16:45:00.000Z"
  }
]
```

#### POST /api/forum/posts
**Create a new forum post**

```
URL: http://localhost:3000/api/forum/posts
Method: POST
Body: {
  "title": "Post Title",
  "content": "Post content here",
  "author": "Your Name"
}
Response: The newly created post object
```

**The forums.html file does this automatically when you submit the form.**

#### DELETE /api/forum/posts/:id
**Delete a specific post** (for future moderation features)

```
URL: http://localhost:3000/api/forum/posts/1
Method: DELETE
Response: { "message": "Post deleted" }
```

### Appeals Endpoints

#### GET /api/appeals
**Get all appeals** (for admins)

```
URL: http://localhost:3000/api/appeals
Method: GET
Response: Array of all appeals
```

#### GET /api/appeals/user/:author
**Get specific user's appeals**

```
URL: http://localhost:3000/api/appeals/user/John
Method: GET
Response: Array of John's appeals only
```

#### POST /api/appeals
**Submit a new appeal**

```
URL: http://localhost:3000/api/appeals
Method: POST
Body: {
  "title": "Appeal Title",
  "content": "Appeal content",
  "author": "Your Name"
}
Response: The newly created appeal object with status "Pending"
```

---

## Common Issues & Solutions

### Issue 1: "Error: Failed to connect to the database"

**Cause:** PostgreSQL isn't running

**Solution:**
1. Open Services (search: "Services")
2. Find "postgresql-x64-15" or similar
3. Right-click → "Start"
4. Or restart your computer

### Issue 2: "npm ERR! command failed"

**Cause:** npm install didn't work properly

**Solution:**
```powershell
# Remove the node_modules folder
rmdir -r node_modules
# Clear npm cache
npm cache clean --force
# Try installing again
npm install
```

### Issue 3: "No command 'psql' found"

**Cause:** PostgreSQL wasn't added to PATH

**Solution:**
1. Restart your computer
2. Or add PostgreSQL to PATH manually:
   - Search: "Environment Variables"
   - Click "Edit the system environment variables"
   - Click "Environment Variables"
   - Under "System variables", find "Path"
   - Click "Edit"
   - Click "New"
   - Add: `C:\Program Files\PostgreSQL\15\bin`
   - Click OK and restart PowerShell

### Issue 4: "Error loading posts" message in forums

**Cause:** Server isn't running or database connection failed

**Solution:**
1. Check server is running: `npm start` in PowerShell
2. Check PostgreSQL is running (see Issue 1)
3. Check `.env` file has correct password
4. Check database exists: `psql -U postgres -l`

### Issue 5: "CORS error" in browser console

**Cause:** Browser blocking requests to server

**Solution:**
- Make sure you're accessing from `http://localhost:3000`
- Don't use `file://` or other local paths
- Server properly handles CORS (it should)

### Issue 6: Posts aren't saved to database

**Cause:** Database table wasn't created

**Solution:**
```powershell
# Re-run the migration
psql -U postgres -d markline -f db/migration.sql
```

---

## How It All Works Together

### Complete Flow: Creating a Forum Post

```
1. USER TYPES POST
   ↓
   User opens browsers to:
   http://localhost:3000/Forums/forums.html
   
2. USER FILLS FORM & CLICKS "POST!"
   ↓
   JavaScript in HTML runs:
   fetch('http://localhost:3000/api/forum/posts', {
     method: 'POST',
     body: JSON.stringify({
       title: 'Hello Community!',
       content: '...',
       author: 'John'
     })
   })

3. SERVER RECEIVES REQUEST
   ↓
   Node.js server gets the HTTP POST request
   
4. SERVER VALIDATES DATA
   ↓
   Checks: title exists? content exists? author exists?
   Escapes HTML to prevent hackers
   
5. SERVER SAVES TO DATABASE
   ↓
   Runs SQL: INSERT INTO forum_posts (title, content, author) ...
   PostgreSQL stores in database file on disk
   
6. SERVER SENDS RESPONSE
   ↓
   Returns the saved post with its ID and timestamp:
   {
     "id": 1,
     "title": "Hello Community!",
     "content": "...",
     "author": "John",
     "created_at": "2024-02-09T15:30:00.000Z"
   }

7. BROWSER REFRESHES POST LIST
   ↓
   JavaScript calls:
   fetch('http://localhost:3000/api/forum/posts')
   Gets all posts from database
   Displays them on page

8. USER SEES POST
   ↓
   Post appears on their screen
   Other users see it too if they refresh!
```

### File Purposes

**server.js** - The Node.js server
- Listens for HTTP requests
- Runs SQL queries to database
- Returns data as JSON

**package.json** - Project configuration
- Lists all dependencies (express, pg, etc.)
- Defines start script

**.env** - Configuration file (SECRET!)
- Database credentials
- Server port
- Should never be shared or committed to git

**db/migration.sql** - Database setup
- Commands to create tables
- Defines table structure (columns, types)
- Creates indexes for fast searches

**Forums/forums.html** - User interface
- HTML form for creating posts
- JavaScript to communicate with server
- Displays posts and appeals

---

## Stopping the Server

When you're done:

1. In the PowerShell window running the server
2. Press **Ctrl+C**
3. Type **Y** and press Enter to confirm

The server stops.

---

## Future Enhancements

Once the basic system works, you can add:

1. **User Authentication**
   - Login system to verify users
   - Link posts/appeals to user accounts

2. **Moderation**
   - Delete inappropriate posts
   - Change appeal status (Pending → Approved/Denied)

3. **Real-time Updates**
   - Use WebSockets so posts appear without refreshing
   - Instant notifications

4. **Categories/Tags**
   - Organize posts by topic
   - Search functionality

5. **Admin Dashboard**
   - View all appeals
   - Manage users and posts
   - Statistics

6. **Email Notifications**
   - Notify users when their appeal is reviewed
   - Notify mods of new posts

---

## Quick Reference

### Essential Commands

```powershell
# Start server
npm start

# Stop server
Ctrl+C

# Create database
psql -U postgres
CREATE DATABASE markline;

# Run migration
psql -U postgres -d markline -f db/migration.sql

# Connect to database
psql -U postgres -d markline

# View all posts in database
SELECT * FROM forum_posts;

# View all appeals
SELECT * FROM appeals;

# Delete all posts (careful!)
DELETE FROM forum_posts;
```

### Important Files

| File | Purpose |
|------|---------|
| `server.js` | Main Node.js server |
| `package.json` | Dependencies list |
| `.env` | Secret configuration |
| `db/migration.sql` | Database setup |
| `Forums/forums.html` | Forum user interface |

---

## Need Help?

**Check the server logs:** Look at the PowerShell window running the server - errors appear there.

**Database debugging:**
```powershell
# Connect to database
psql -U postgres -d markline

# Check if posts exist
SELECT COUNT(*) FROM forum_posts;

# See all posts
SELECT * FROM forum_posts;

# Check table structure
\d forum_posts
```

**Server debugging:**
- Open browser Developer Tools (F12)
- Go to Network tab
- Submit a forum post
- Watch the request/response

Good luck! You've got a proper online forum system now! 🎉
