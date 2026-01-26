# 🔧 Scripts

This folder contains utility scripts for project setup and maintenance.

## 📋 Available Scripts

### `setupDB.js`

**Purpose**: Initialize PostgreSQL database with complete schema and test data

**Usage**:
```bash
npm run setup
# or directly:
node scripts/setupDB.js
```

**What it does**:
1. Creates 11 related tables with proper schema
2. Sets up foreign key constraints
3. Clears old test data (if database exists)
4. Seeds realistic test data
5. Hashes passwords with bcrypt
6. Provides detailed console output

**Configuration**:
- Uses `.env` file from root directory for database credentials
- Requires PostgreSQL to be running
- Environment variables needed:
  - `DB_USER` - PostgreSQL username
  - `DB_PASSWORD` - PostgreSQL password
  - `DB_HOST` - Database host (usually localhost)
  - `DB_PORT` - Database port (usually 5432)
  - `DB_NAME` - Database name

**Example Output**:
```
✅ Creating tables...
✅ Clearing old test data...
✅ Hashing passwords...
✅ Seeding test data...
✅ Database Setup Completed!

Tables created: 11
Test records seeded: 18
Test student: 30412010101234 / password: 123456
Admin user: admin / password: admin123
```

**Dependencies**:
- `pg` - PostgreSQL client
- `bcrypt` - Password hashing
- `dotenv` - Environment variable management

**Troubleshooting**:
- If you get `ECONNREFUSED`: PostgreSQL is not running
  - Start PostgreSQL: `sudo systemctl start postgresql`
  - Or verify connection settings in `.env`

- If you get `database does not exist`:
  - Create the database: `createdb housing_system`
  - Then run the setup script again

- If you get permission errors:
  - Check `DB_USER` and `DB_PASSWORD` in `.env`
  - Verify PostgreSQL user has CREATE TABLE permissions

## 📚 Documentation

For complete setup details, see:
- [`docs/database/DATABASE_SCHEMA.md`](../docs/database/DATABASE_SCHEMA.md) - Database schema
- [`docs/database/DELIVERY_SUMMARY.md`](../docs/database/DELIVERY_SUMMARY.md) - Setup overview

---

**Last Updated**: January 25, 2026  
**Status**: ✅ Production Ready
