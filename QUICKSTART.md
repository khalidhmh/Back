# 🚀 Quick Start Guide

Get the Housing System API running in **5 minutes**!

---

## Prerequisites

Before starting, ensure you have:
- **Node.js** >= 16.0.0 ([Download](https://nodejs.org/))
- **PostgreSQL** >= 12.0 ([Download](https://www.postgresql.org/))
- **Git** (optional, for cloning)

**Verify installation:**
```bash
node --version      # Should be v16+
npm --version       # Should be 8+
psql --version      # Should be 12+
```

---

## Step 1: Get the Code (2 minutes)

### Option A: Clone from Git
```bash
git clone https://github.com/yourusername/housing-system.git
cd housing-system/Back
```

### Option B: Use Existing Directory
```bash
cd /home/khalidhmh/Documents/H.S/Back
```

---

## Step 2: Install Dependencies (1 minute)

```bash
npm install
```

This installs all required packages:
- Express.js, PostgreSQL client, JWT, bcrypt, Helmet, CORS, etc.

**What to expect:**
```
added 120 packages in 30s
```

---

## Step 3: Setup Database (1 minute)

### Start PostgreSQL

**Linux:**
```bash
sudo service postgresql start
```

**Mac:**
```bash
brew services start postgresql
```

**Windows:**
```
Open PostgreSQL app or Services
```

### Create Database

```bash
# Method 1: Using createdb
createdb -U postgres housing_db

# Method 2: Using psql
psql -U postgres -c "CREATE DATABASE housing_db;"
```

---

## Step 4: Configure Environment (30 seconds)

```bash
# Copy example file
cp .env.example .env

# Edit with your database password
nano .env
# Or: code .env (in VS Code)
```

**Change this line:**
```
DB_PASSWORD=Khalid@123  # Use YOUR password here
```

Save and exit (Ctrl+X → Y → Enter in nano)

---

## Step 5: Initialize Database (30 seconds)

```bash
npm run setup
```

**Expected output:**
```
📋 Starting database setup...

1️⃣  Creating students table...
   ✅ Students table created successfully

2️⃣  Creating users table...
   ✅ Users table created successfully

3️⃣  Hashing test password...
   ✅ Password hashed with bcrypt

4️⃣  Inserting test student data...
   ✅ Test student inserted

5️⃣  Inserting test admin data...
   ✅ Test admin inserted

╔═════════════════════════════════════╗
║  ✅ Database Setup Completed!       ║
╚═════════════════════════════════════╝

📊 Summary:
✓ Created students table
✓ Created users table
✓ Added test student (National ID: 30412010101234)
✓ Added test admin (Username: admin)
```

---

## Step 6: Start Server (Instant!)

```bash
npm start
```

**Expected output:**
```
╔═══════════════════════════════════════╗
║  🚀 Housing System API Started         ║
╚═══════════════════════════════════════╝

  Environment: development
  Server Port: 3000
  Base URL: http://localhost:3000

  📚 Routes:
  • POST /api/auth/login - User login
  • GET  /health - Health check

  🔒 Security Features:
  ✓ Helmet (15+ security headers)
  ✓ CORS enabled
  ✓ Rate Limiting (100 req/15 min)
  ✓ Request Logging
  ✓ Parameterized Queries (SQL injection prevention)

═══════════════════════════════════════
```

✅ **Server is running!**

---

## Step 7: Test the API

### Health Check (verify server is running)

```bash
curl http://localhost:3000/health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-01-25T10:30:00.000Z"
}
```

### Login as Student

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "userType": "student",
    "id": "30412010101234",
    "password": "123456"
  }'
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "أحمد حسن محمد",
    "role": "student"
  },
  "message": "تم تسجيل الدخول بنجاح"
}
```

✅ **API is working!**

---

## Troubleshooting

### "Port 3000 already in use"
```bash
# Kill the process
lsof -i :3000
kill -9 <PID>

# Or use different port
PORT=3001 npm start
```

### "Cannot connect to database"
```bash
# Check PostgreSQL is running
sudo service postgresql status

# Or start it
sudo service postgresql start

# Test connection
psql -U postgres -d housing_db -c "SELECT 1;"
```

### "FATAL: password authentication failed"
```bash
# Check .env file
cat .env

# Verify PostgreSQL password
psql -U postgres -c "ALTER USER postgres WITH PASSWORD 'your_password';"
```

### "Database housing_db does not exist"
```bash
# Create it
createdb -U postgres housing_db

# Or from psql
psql -U postgres -c "CREATE DATABASE housing_db;"
```

---

## What's Next?

### 1. Explore the Codebase
```bash
# View project structure
tree -I 'node_modules'

# Or list files
find . -type f -name "*.js" | grep -E "(controllers|routes|middleware)"
```

### 2. Read the Documentation
- **API Guide:** [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)
- **Security:** [SECURITY.md](./SECURITY.md)
- **Full README:** [README.md](./README.md)

### 3. Test with Postman (Optional)

1. Download [Postman](https://www.postman.com/)
2. Import the API:
   - Method: POST
   - URL: `http://localhost:3000/api/auth/login`
   - Body (raw JSON):
     ```json
     {
       "userType": "student",
       "id": "30412010101234",
       "password": "123456"
     }
     ```
3. Click Send
4. Receive your JWT token

### 4. Development Mode (Auto-reload)

Stop the server (Ctrl+C) and run:
```bash
npm run dev
```

Now the server will automatically restart when you make code changes!

---

## Useful Commands Reference

```bash
# Start server (production)
npm start

# Start server with auto-reload (development)
npm run dev

# Setup database
npm run setup

# Check if server is running
curl http://localhost:3000/health

# View recent logs
tail -f logs/app.log

# Stop server
Ctrl+C
```

---

## Test Credentials

**Student Login:**
```
National ID: 30412010101234
Password: 123456
```

**Admin Login:**
```
Username: admin
Password: admin123
```

---

## Project Structure Overview

```
Back/
├── server.js              ← Main server file
├── db.js                  ← Database connection
├── setupDB.js             ← Database setup
├── controllers/           ← Business logic
│   └── authController.js  ← Login logic
├── routes/                ← API routes
│   └── auth.js            ← Auth endpoints
├── middleware/            ← Authentication
│   └── auth.js            ← JWT verification
├── .env                   ← Configuration (SECRET!)
└── package.json           ← Dependencies
```

---

## Common Tasks

### Change Server Port
Edit `.env`:
```
PORT=3001
```

### Change Database Name
Edit `.env`:
```
DB_NAME=my_housing_db
```

Recreate database:
```bash
dropdb -U postgres housing_db
createdb -U postgres my_housing_db
npm run setup
```

### Reset Database
```bash
# Delete all data
npm run setup

# Or manually
dropdb -U postgres housing_db
createdb -U postgres housing_db
npm run setup
```

### Add New Admin User
Edit `setupDB.js` and add:
```javascript
await pool.query(`
  INSERT INTO users (username, password_hash, full_name, role)
  VALUES ($1, $2, $3, $4)
  ON CONFLICT (username) DO NOTHING;
`, ["newadmin", hashedPassword, "Admin Name", "admin"]);
```

Then run `npm run setup`

---

## Next Steps for Development

1. ✅ **API Working** - You have a running authentication system
2. 📚 **Learn the Code** - Read [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)
3. 🔒 **Understand Security** - Review [SECURITY.md](./SECURITY.md)
4. 🎨 **Build Frontend** - Create React/Vue app that uses this API
5. 📊 **Add Features** - Create more endpoints (students CRUD, housing, etc.)
6. 🧪 **Write Tests** - Add unit and integration tests
7. 🚀 **Deploy** - Push to production (Heroku, AWS, etc.)

---

## Help & Support

### Check Documentation
- 📚 Full API guide: [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)
- 🔒 Security guide: [SECURITY.md](./SECURITY.md)
- 📖 README: [README.md](./README.md)

### Debug Issues
1. Check error messages in terminal
2. Verify `.env` configuration
3. Ensure PostgreSQL is running
4. Check database tables exist: `npm run setup`
5. Look at logs in console

### Get Help
- Read documentation files
- Check troubleshooting section above
- Review error messages carefully
- Test with curl or Postman

---

## You're All Set! 🎉

Your API is now:
- ✅ Running on http://localhost:3000
- ✅ Connected to PostgreSQL
- ✅ Ready for testing
- ✅ Secure with JWT & bcrypt
- ✅ Protected with rate limiting

**Happy coding!** 🚀

---

**Time elapsed:** ~5 minutes ⏱️  
**Status:** ✅ Ready to use
