# API Endpoints Quick Reference

## Base URL
```
http://localhost:3000/api/student
```

## Authentication
All endpoints marked with 🔒 require Bearer token in Authorization header:
```
Authorization: Bearer <jwt_token>
```

---

## 📋 Profile Management

### Get Student Profile 🔒
```
GET /profile
```
Returns: Student info with room as nested object

---

## 📺 Public Content (No Auth Required)

### Get All Activities
```
GET /activities
```
Returns: Array of activities sorted by date

### Get All Announcements
```
GET /announcements
```
Returns: Array of announcements sorted by latest

---

## 📍 Attendance 🔒

### Get Attendance Logs
```
GET /attendance
```
Returns: Student's attendance records sorted by date

---

## 📢 Complaints 🔒

### Get My Complaints
```
GET /complaints
```
Returns: Array of student's complaints

### Submit New Complaint
```
POST /complaints

Body: {
  "title": "string",
  "description": "string",
  "recipient": "string (optional)",
  "is_secret": boolean (optional),
  "type": "string (General|Urgent)"
}
```
Returns: Created complaint (HTTP 201)

---

## 🔧 Maintenance Requests 🔒

### Get My Maintenance Requests
```
GET /maintenance
```
Returns: Array of student's maintenance requests

### Submit Maintenance Request
```
POST /maintenance

Body: {
  "category": "string (Electric|Plumbing|Net|Furniture|Other)",
  "description": "string"
}
```
Returns: Created request (HTTP 201)

---

## 📝 Permissions 🔒

### Get My Permissions
```
GET /permissions
```
Returns: Array of student's permission requests

### Request Permission
```
POST /permissions

Body: {
  "type": "string (Late|Travel)",
  "start_date": "YYYY-MM-DD",
  "end_date": "YYYY-MM-DD",
  "reason": "string"
}
```
Returns: Created permission (HTTP 201)

---

## 🔔 Notifications 🔒

### Get My Notifications
```
GET /notifications
```
Returns: Array of student's notifications

### Mark Notification as Read
```
POST /notifications/:id/read
```
Returns: Confirmation message

---

## ✅ Clearance Requests 🔒

### Get Clearance Status
```
GET /clearance
```
Returns: Current clearance status or "Not Initiated"

### Initiate Clearance
```
POST /clearance/initiate
```
Returns: Created clearance request (HTTP 201)

---

## 📊 Response Formats

### Success (HTTP 200, 201)
```json
{
  "success": true,
  "data": {
    // Response data here
  }
}
```

### Error (HTTP 400, 404, 500)
```json
{
  "success": false,
  "message": "Error description"
}
```

---

## 🔐 Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success (GET) |
| 201 | Created (POST) |
| 400 | Bad Request (validation) |
| 404 | Not Found |
| 500 | Server Error |

---

## 📌 Important Notes

1. **Student ID**: Automatically extracted from JWT token (`req.user.id`)
2. **Room Format**: Returns as nested object `{room_no, building}`
3. **Dates**: Use format `YYYY-MM-DD`
4. **Status Defaults**:
   - Complaints: `Pending`
   - Maintenance: `Pending`
   - Permissions: `Pending`
   - Clearance: `Pending`

---

## 🧪 Example Requests

### Get Profile
```bash
curl -X GET http://localhost:3000/api/student/profile \
  -H "Authorization: Bearer <token>"
```

### Submit Complaint
```bash
curl -X POST http://localhost:3000/api/student/complaints \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Noise Issue",
    "description": "Room too noisy",
    "type": "General"
  }'
```

### Request Permission
```bash
curl -X POST http://localhost:3000/api/student/permissions \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "Late",
    "start_date": "2025-02-01",
    "end_date": "2025-02-02",
    "reason": "Doctor appointment"
  }'
```

---

## 📱 Mobile App Integration

All responses follow DataRepository format:
```dart
class StudentResponse {
  final bool success;
  final dynamic data;
  final String? message;
}
```

---

**Status**: ✅ Ready for Mobile App Integration
