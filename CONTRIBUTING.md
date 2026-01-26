# 🤝 Contributing Guide

Guidelines for contributing to the University Housing System API.

---

## Getting Started

### 1. Clone the Repository
```bash
git clone <repository-url>
cd housing-system-backend
```

### 2. Create Feature Branch
```bash
git checkout -b feature/your-feature-name
# OR
git checkout -b fix/your-fix-name
```

**Branch Naming Convention:**
- `feature/feature-name` - New features
- `fix/bug-name` - Bug fixes
- `docs/document-name` - Documentation
- `refactor/code-section` - Code improvements

### 3. Install Dependencies
```bash
npm install
```

### 4. Setup Development Environment
```bash
cp .env.example .env
# Edit .env with your local settings
npm run setup
```

### 5. Start Development Server
```bash
npm run dev
# Auto-reloads on file changes
```

---

## Code Style Guide

### JavaScript Conventions

#### Naming
```javascript
// ✅ CORRECT - camelCase for variables/functions
const userEmail = 'user@example.com';
function getUserById(userId) {}

// ✅ CORRECT - PascalCase for classes
class StudentModel {}
class AuthController {}

// ✅ CORRECT - UPPER_SNAKE_CASE for constants
const MAX_LOGIN_ATTEMPTS = 5;
const JWT_EXPIRATION = '1d';

// ❌ WRONG - Don't mix cases
const UserEmail = 'user@example.com';
const get_user_by_id = () => {};
```

#### Comments

**Good Comments - Explain "Why":**
```javascript
// ✅ CORRECT - Explains intent
// We hash passwords with bcrypt because:
// 1. Even if DB is stolen, passwords are secure
// 2. Each password has unique salt
// 3. Slow algorithm prevents brute force (100ms per try)
const hashedPassword = await bcrypt.hash(password, 10);

// ✅ CORRECT - Explains non-obvious code
// JWT expiration must be string (not seconds)
// because jsonwebtoken lib uses npm package 'ms'
jwt.sign(payload, secret, { expiresIn: '1d' });

// ❌ WRONG - Just restates the code
// Hash the password with bcrypt
const hashedPassword = await bcrypt.hash(password, 10);
```

**JSDoc Format:**
```javascript
/**
 * Authenticate user with credentials
 * 
 * @param {string} userType - 'student' or 'admin'
 * @param {string} id - National ID (student) or username (admin)
 * @param {string} password - User password
 * @returns {Promise<Object>} JWT token and user info
 * @throws {Error} If authentication fails
 */
async function authenticateUser(userType, id, password) {
  // Implementation
}
```

#### Code Structure

```javascript
// ✅ CORRECT - Clear sections with dividers
exports.login = async (req, res) => {
  try {
    // ========================================
    // STEP 1: VALIDATE INPUT
    // ========================================
    if (!req.body.id) {
      return res.status(400).json({ message: "ID required" });
    }

    // ========================================
    // STEP 2: QUERY DATABASE
    // ========================================
    const result = await db.query(
      'SELECT * FROM students WHERE national_id = $1',
      [req.body.id]
    );

    // ========================================
    // STEP 3: VERIFY PASSWORD
    // ========================================
    const isMatch = await bcrypt.compare(
      req.body.password,
      result.rows[0].password_hash
    );

  } catch (err) {
    // ========================================
    // ERROR HANDLING
    // ========================================
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
```

---

## Adding New Features

### Example: Add Student Profile Endpoint

#### Step 1: Create Controller
**File: `controllers/studentController.js`**
```javascript
const db = require('../db');

/**
 * Get student profile by ID
 */
exports.getProfile = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate input
    if (!id) {
      return res.status(400).json({ message: "Student ID required" });
    }

    // Query database
    const result = await db.query(
      'SELECT id, full_name, national_id FROM students WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Student not found" });
    }

    res.json({ success: true, student: result.rows[0] });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
```

#### Step 2: Add Route
**File: `routes/students.js`**
```javascript
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const studentController = require('../controllers/studentController');

// GET student profile (protected)
router.get(
  '/:id',
  authenticateToken,
  studentController.getProfile
);

module.exports = router;
```

#### Step 3: Mount Route in server.js
```javascript
// In server.js, add:
app.use('/api/students', require('./routes/students'));
```

#### Step 4: Test the Endpoint
```bash
curl -X GET http://localhost:3000/api/students/1 \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json"
```

---

## Database Changes

### Adding New Table

#### Step 1: Update setupDB.js
```javascript
// In setupDB.js, add:
await pool.query(`
  CREATE TABLE IF NOT EXISTS housing_units (
    id SERIAL PRIMARY KEY,
    unit_number VARCHAR(50) UNIQUE NOT NULL,
    capacity INT NOT NULL,
    available BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`);
```

#### Step 2: Run Setup
```bash
npm run setup
```

#### Step 3: Update Database Documentation
Document the new table in `README.md` or create `DATABASE.md`.

### Modifying Existing Table

⚠️ **Never modify setupDB.js for existing tables!**

Instead, create a migration file:
**File: `migrations/001_add_email_to_students.js`**
```javascript
const db = require('../db');

async function migrate() {
  try {
    await db.query(`
      ALTER TABLE students
      ADD COLUMN email VARCHAR(255) UNIQUE;
    `);
    console.log('✅ Migration completed');
  } catch (err) {
    console.error('❌ Migration failed:', err);
    throw err;
  }
}

module.exports = migrate;
```

Run migration:
```bash
node migrations/001_add_email_to_students.js
```

---

## Testing Your Changes

### Manual Testing with cURL

```bash
# Test your new endpoint
curl -X GET http://localhost:3000/api/students/1 \
  -H "Authorization: Bearer <your_token>"

# Expected response
{
  "success": true,
  "student": {
    "id": 1,
    "full_name": "أحمد حسن",
    "national_id": "30412010101234"
  }
}
```

### Testing with Postman

1. Open Postman
2. Create new request
3. Set method and URL
4. Add Authorization header with token
5. Send request
6. Verify response

### Error Testing

```bash
# Test missing required field
curl -X GET http://localhost:3000/api/students/ \
  -H "Authorization: Bearer <token>"
# Should return 400 Bad Request

# Test unauthorized (no token)
curl -X GET http://localhost:3000/api/students/1
# Should return 401 Unauthorized

# Test invalid token
curl -X GET http://localhost:3000/api/students/1 \
  -H "Authorization: Bearer invalid_token"
# Should return 401 Invalid token
```

---

## Commit Messages

### Format
```
<type>: <subject>

<body>

<footer>
```

### Types
- **feat:** New feature
- **fix:** Bug fix
- **docs:** Documentation only
- **style:** Code style changes (no logic change)
- **refactor:** Code refactoring
- **test:** Test additions or changes
- **chore:** Maintenance (dependencies, config)

### Examples

✅ **GOOD:**
```
feat: add student profile endpoint

- Added GET /api/students/:id route
- Created studentController.js
- Requires authentication token
- Returns student name and ID

Closes #123
```

❌ **BAD:**
```
updated code
```

---

## Pull Request Process

### 1. Create Feature Branch
```bash
git checkout -b feature/student-profile
```

### 2. Make Changes
- Write code
- Add tests
- Update documentation

### 3. Commit Changes
```bash
git add .
git commit -m "feat: add student profile endpoint"
```

### 4. Push to Remote
```bash
git push origin feature/student-profile
```

### 5. Create Pull Request
- Go to GitHub
- Click "Compare & Pull Request"
- Fill in title and description
- Request reviewer
- Wait for approval

### 6. Address Feedback
- Make requested changes
- Commit and push
- PR auto-updates

### 7. Merge
- Reviewer approves
- Merge to main branch
- Delete feature branch

---

## Security Checklist for Pull Requests

Before submitting PR, ensure:

- [ ] **No secrets in code**
  - No hardcoded passwords
  - No API keys in files
  - No JWT_SECRET in code

- [ ] **Parameterized queries**
  - All DB queries use $1, $2 placeholders
  - User input never in SQL string

- [ ] **Input validation**
  - Required fields checked
  - Data types validated
  - Special characters sanitized

- [ ] **Error handling**
  - Try-catch blocks used
  - Generic error messages to client
  - Detailed logging server-side

- [ ] **Authentication**
  - Protected endpoints checked
  - JWT verification required
  - Role-based access verified

- [ ] **Commented code**
  - Explain the "why"
  - JSDoc for functions
  - No console.log with secrets

---

## Common Patterns

### Querying Database

```javascript
// ✅ CORRECT - Parameterized
const result = await db.query(
  'SELECT * FROM students WHERE id = $1',
  [studentId]
);

// ✅ CORRECT - Multiple parameters
const result = await db.query(
  'INSERT INTO students (national_id, password_hash) VALUES ($1, $2)',
  [nationalId, hashedPassword]
);
```

### Error Handling

```javascript
// ✅ CORRECT - Comprehensive error handling
try {
  const result = await db.query(sql, params);
  return res.json(result.rows);
} catch (err) {
  console.error('Database error:', err); // Server-side logging
  return res.status(500).json({ message: "Server error" }); // Generic to client
}
```

### Async Operations

```javascript
// ✅ CORRECT - Use async/await
exports.login = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM students WHERE id = $1', [id]);
    const isMatch = await bcrypt.compare(password, result.rows[0].password_hash);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Error" });
  }
};
```

---

## Debugging Tips

### Enable Verbose Logging
```javascript
// In server.js, change morgan format:
app.use(morgan('combined')); // More detailed than 'dev'
```

### Log SQL Queries
```javascript
// In db.js, log queries:
const query = (text, params) => {
  console.log('SQL:', text, 'PARAMS:', params);
  return pool.query(text, params);
};
```

### Check Environment Variables
```bash
# View all env vars
env | grep DB_

# Verify specific var
echo $JWT_SECRET
```

### Test Database Connection
```bash
# Connect directly to database
psql -U postgres -d housing_db -c "SELECT 1;"

# List tables
psql -U postgres -d housing_db -c "\dt"
```

---

## Documentation

### Update README.md When:
- Adding new features
- Changing API endpoints
- Updating configuration
- Installing new dependencies

### Update API_DOCUMENTATION.md When:
- Adding API endpoint
- Changing request/response format
- Updating authentication method

### Update SECURITY.md When:
- Adding security feature
- Discovering vulnerability
- Changing security process

---

## Questions?

- Read existing documentation
- Check similar code patterns
- Ask in pull request comments
- Reach out to maintainers

---

**Thank you for contributing!** 🙏

Your contributions help make this project better for everyone.

---

**Last Updated:** January 25, 2026  
**Version:** 1.0.0
