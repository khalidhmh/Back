# 🚀 API QUICK REFERENCE CARD
**University Housing System - Mobile App API**

---

## 📋 ENDPOINTS CHEAT SHEET (12 Total)

### **STUDENT** (3 endpoints)
```
GET    /api/student/profile          → Fetch profile + room
GET    /api/student/attendance       → Fetch attendance (filter: ?month, ?date)
GET    /api/student/clearance        → Fetch clearance status
```

### **SERVICES** (6 endpoints)
```
GET    /api/services/complaints      → Fetch complaints (filter: ?status, ?type)
POST   /api/services/complaints      → Submit complaint
GET    /api/services/maintenance     → Fetch maintenance (filter: ?status, ?category)
POST   /api/services/maintenance     → Submit maintenance request
GET    /api/services/permissions     → Fetch permissions (filter: ?status, ?type)
POST   /api/services/permissions     → Request permission
```

### **ACTIVITIES** (3 endpoints)
```
GET    /api/activities               → Fetch activities (filter: ?limit)
POST   /api/activities/subscribe     → Subscribe to activity
GET    /api/announcements            → Fetch announcements (filter: ?limit, ?category)
```

---

## 🔐 AUTHENTICATION

**Every request requires:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Get token:**
```bash
POST /api/auth/login
{
  "national_id": "30412010101234",
  "password": "123456"
}
```

---

## 📝 REQUEST/RESPONSE EXAMPLES

### Example 1: Get Profile
```bash
GET /api/student/profile
Authorization: Bearer eyJhbGc...

# Response 200 OK
{
  "success": true,
  "student": {
    "id": 1,
    "national_id": "30412010101234",
    "full_name": "محمد أحمد علي",
    "room": {
      "id": 1,
      "room_number": "101",
      "building": "Building A"
    }
  }
}
```

### Example 2: Submit Complaint
```bash
POST /api/services/complaints
Authorization: Bearer eyJhbGc...
Content-Type: application/json

{
  "title": "Noise Complaint",
  "description": "Loud noise at night",
  "type": "general",
  "is_secret": false
}

# Response 201 Created
{
  "success": true,
  "message": "Complaint submitted successfully",
  "complaint": {
    "id": 5,
    "status": "pending",
    "created_at": "2025-01-25T15:30:00Z"
  }
}
```

### Example 3: Get Attendance with Filter
```bash
GET /api/student/attendance?month=2025-01
Authorization: Bearer eyJhbGc...

# Response 200 OK
{
  "success": true,
  "count": 15,
  "attendance": [
    {
      "id": 1,
      "date": "2025-01-25",
      "status": "Present"
    }
  ]
}
```

### Example 4: Subscribe to Activity
```bash
POST /api/activities/subscribe
Authorization: Bearer eyJhbGc...

{
  "activity_id": 1
}

# Response 201 Created
{
  "success": true,
  "message": "Successfully subscribed to \"Football League\""
}
```

---

## ⚠️ ERROR CODES

| Code | Meaning | Solution |
|------|---------|----------|
| **400** | Bad Request | Check required fields, valid format, valid enum values |
| **401** | Unauthorized | Get new token from /api/auth/login |
| **404** | Not Found | Resource doesn't exist |
| **409** | Conflict | Duplicate (e.g., already subscribed) |
| **500** | Server Error | Database/server issue, try again later |

---

## 🔍 QUERY PARAMETERS

### Attendance Filters
```
?month=2025-01       → Get attendance for January 2025
?date=2025-01-25     → Get attendance for specific date
```

### Complaints Filters
```
?status=pending      → Get pending complaints only
?type=general        → Get general type only
?status=pending&type=urgent  → Combine filters
```

### Maintenance Filters
```
?status=open         → Get open requests
?category=electrical → Get electrical issues
```

### Permission Filters
```
?status=approved     → Get approved permissions
?type=travel         → Get travel permissions
```

### Activity/Announcement Filters
```
?limit=10            → Get only 10 items (default: all)
?category=maintenance → Get maintenance announcements
```

---

## 📤 POST REQUEST BODIES

### Create Complaint
```json
{
  "title": "string (max 200 chars, required)",
  "description": "string (max 5000 chars, required)",
  "type": "general|urgent (required)",
  "is_secret": "boolean (optional, defaults to false)"
}
```

### Create Maintenance
```json
{
  "category": "string (required, e.g., plumbing, electrical)",
  "description": "string (required)"
}
```

### Request Permission
```json
{
  "type": "travel|late|medical|other (required)",
  "start_date": "YYYY-MM-DD (required, must be future)",
  "end_date": "YYYY-MM-DD (required, >= start_date)",
  "reason": "string (required)"
}
```

### Subscribe to Activity
```json
{
  "activity_id": "number (required)"
}
```

---

## 🧪 QUICK TEST WITH CURL

### 1. Get Token
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"national_id": "30412010101234", "password": "123456"}'
```

### 2. Save Token (Linux/Mac)
```bash
TOKEN="eyJhbGciOiJIUzI1NiIs..." # Copy from response above
```

### 3. Test Endpoint
```bash
curl http://localhost:3000/api/student/profile \
  -H "Authorization: Bearer $TOKEN"
```

### 4. Submit Complaint
```bash
curl -X POST http://localhost:3000/api/services/complaints \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Complaint",
    "description": "Test description",
    "type": "general"
  }'
```

---

## 📚 FILE LOCATIONS

| File | Purpose |
|------|---------|
| `controllers/studentController.js` | Profile, attendance, clearance methods |
| `controllers/serviceController.js` | Complaints, maintenance, permissions methods |
| `controllers/activityController.js` | Activities, announcements methods |
| `routes/api.js` | All 12 routes with full documentation |
| `middleware/auth.js` | JWT token verification |
| `server.js` | Route mounting (line 177-178) |
| `API_IMPLEMENTATION.md` | Complete API documentation |

---

## ⚡ IMPORTANT NOTES

✅ **All 12 endpoints are authenticated** - Always include Authorization header
✅ **All queries are parameterized** - No SQL injection vulnerabilities
✅ **Proper HTTP status codes** - Use them to handle errors
✅ **Input validation** - Required fields, data types, enums
✅ **Rate limited** - 100 requests per 15 minutes
✅ **CORS enabled** - Works with mobile apps on different domains

---

## 🐛 TROUBLESHOOTING

### "401 Unauthorized"
→ Check Authorization header is present and token is valid
→ Get new token from /api/auth/login

### "400 Bad Request"
→ Check required fields are present
→ Check data format (dates should be YYYY-MM-DD)
→ Check enum values are correct

### "404 Not Found"
→ Check resource exists (e.g., activity_id is valid)
→ Check student is assigned to room (for maintenance)

### "409 Conflict"
→ You may have already subscribed to this activity
→ Remove duplicate subscription first

### "500 Server Error"
→ Database may be down
→ Check server logs (npm start output)
→ Verify PostgreSQL is running

---

## 🚀 QUICK START

```bash
# 1. Start server
npm start

# 2. In another terminal, get token
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"national_id": "30412010101234", "password": "123456"}' | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

# 3. Test endpoint
curl http://localhost:3000/api/student/profile \
  -H "Authorization: Bearer $TOKEN" | jq

# 4. Try another endpoint
curl http://localhost:3000/api/announcements \
  -H "Authorization: Bearer $TOKEN" | jq
```

---

## 📞 SUPPORT

For detailed documentation:
- **API Reference:** `API_IMPLEMENTATION.md`
- **Database Schema:** `DATABASE_SCHEMA.md`
- **Setup Guide:** `SETUPDB_REFERENCE.md`
- **Visual Architecture:** `DATABASE_VISUAL_REFERENCE.md`

---

**Status:** ✅ Production Ready | **Version:** 1.0 | **Date:** Jan 25, 2026
