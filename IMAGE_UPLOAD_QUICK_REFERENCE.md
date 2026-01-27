# 🖼️ Image Upload Feature - Quick Reference Guide

**Status:** ✅ Complete and Ready for Production  
**Date:** January 27, 2026  
**Version:** 2.0.0 (with image upload)

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
# This will install multer (now in package.json)
```

### 2. Start Server
```bash
npm start
```

### 3. Server Creates `uploads/` Automatically
Server will auto-create the directory on startup.

---

## 📸 Image Upload Endpoint

### Request

**Endpoint:** `POST /api/student/upload-photo`

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: multipart/form-data
```

**Body:**
- Field: `photo`
- Type: File (JPEG, PNG, GIF, WebP)
- Max Size: 5MB

### Response

**Success (200):**
```json
{
  "success": true,
  "data": {
    "photo_url": "http://localhost:3000/uploads/photo-1642345678901.jpg"
  }
}
```

**Error (400 - No file):**
```json
{
  "success": false,
  "message": "No file uploaded"
}
```

**Error (400 - Invalid file type):**
```json
{
  "success": false,
  "message": "Only image files are allowed"
}
```

---

## 🧪 Testing with Curl

```bash
# 1. Login and get token
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "userType": "student",
    "id": "30412010101234",
    "password": "password123"
  }' | jq -r '.data.token')

echo "Token: $TOKEN"

# 2. Upload photo
curl -X POST http://localhost:3000/api/student/upload-photo \
  -H "Authorization: Bearer $TOKEN" \
  -F "photo=@/path/to/your/photo.jpg"

# 3. Fetch image from browser or curl
curl http://localhost:3000/uploads/photo-{timestamp}.jpg > saved_photo.jpg
```

---

## 📱 Testing with Postman

### Step 1: Get Auth Token
- **Method:** POST
- **URL:** `http://localhost:3000/api/auth/login`
- **Body (JSON):**
```json
{
  "userType": "student",
  "id": "30412010101234",
  "password": "password123"
}
```
- **Copy token from response**

### Step 2: Upload Photo
- **Method:** POST
- **URL:** `http://localhost:3000/api/student/upload-photo`
- **Headers:** `Authorization: Bearer <token>`
- **Body:** 
  - Type: `form-data`
  - Key: `photo`
  - Value: Select image file
- **Click Send**

### Step 3: Test Response
Should see:
```json
{
  "success": true,
  "data": {
    "photo_url": "http://localhost:3000/uploads/photo-..."
  }
}
```

---

## 🔄 Field Mapping Fix

### Activities Endpoint

**What Changed:**
- Database stores: `event_date`
- Mobile app receives: `date`

**Before (Broken):**
```javascript
// Mobile app couldn't find 'date' field
const activity = {
  id: 1,
  title: "Football",
  event_date: "2025-02-08"  // ❌ Wrong field name
}
```

**After (Fixed):**
```javascript
// Mobile app finds 'date' field correctly
const activity = {
  id: 1,
  title: "Football",
  event_date: "2025-02-08",
  date: "2025-02-08"  // ✅ Correct field name
}
```

**Test Command:**
```bash
curl http://localhost:3000/api/student/activities | jq '.data[0].date'
# Returns: "2025-02-08"
```

---

## 🏠 Profile Room Structure

### Endpoint: `GET /api/student/profile`

**Response Format:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "full_name": "محمد أحمد",
    "student_id": "20230001",
    "photo_url": "http://localhost:3000/uploads/photo-1642345678901.jpg",
    "room": {
      "room_no": "101",
      "building": "Building A"
    },
    "college": "Engineering",
    "academic_year": "Third Year",
    "housing_type": "Double",
    "created_at": "2025-01-15T10:30:00Z"
  }
}
```

**Key Points:**
- ✅ Room is nested object (not flat)
- ✅ Contains `room_no` and `building`
- ✅ Photo URL is absolute (can be accessed from mobile app)

---

## 📂 File Structure

```
/home/khalidhmh/Documents/H.S/Back/
├── uploads/                    ← Auto-created on startup
│   ├── photo-1642345678901.jpg
│   ├── photo-1642345678902.jpg
│   └── ...
├── server.js                   ✅ Updated
├── routes/api.js               ✅ Updated
├── controllers/
│   └── studentController.js    ✅ Updated
├── package.json                ✅ Updated (added multer)
└── ...
```

---

## 🔐 Security Features

| Feature | Status | Details |
|---------|--------|---------|
| File Type Validation | ✅ | Only JPEG, PNG, GIF, WebP |
| File Size Limit | ✅ | 5MB maximum |
| Unique Filenames | ✅ | Timestamp + random suffix |
| Authentication | ✅ | JWT token required |
| Directory Auto-Create | ✅ | Creates on startup |
| Static File Serving | ✅ | Secure access via /uploads |

---

## 📊 All Endpoints (Updated)

### New Endpoint:
```
POST /api/student/upload-photo
├── Auth: Required (JWT)
├── Input: multipart/form-data (photo)
├── Output: { success, data: { photo_url } }
└── Status: 200 (success) | 400 (error)
```

### Updated Endpoint:
```
GET /api/student/activities
├── Auth: Not required
├── Change: Added 'date' field (mapped from event_date)
├── Output: { success, data: [{ id, title, date, ... }] }
└── Status: 200 (success) | 500 (error)
```

### Existing Endpoints (Still Working):
```
GET  /api/student/profile      ✅ (room object intact)
GET  /api/student/announcements ✅ (public)
GET  /api/student/attendance   ✅ (protected)
GET  /api/student/complaints   ✅ (protected)
POST /api/student/complaints   ✅ (protected)
GET  /api/student/maintenance  ✅ (protected)
POST /api/student/maintenance  ✅ (protected)
GET  /api/student/permissions  ✅ (protected)
POST /api/student/permissions  ✅ (protected)
GET  /api/student/notifications ✅ (protected)
POST /api/student/notifications/:id/read ✅ (protected)
GET  /api/student/clearance    ✅ (protected)
POST /api/student/clearance/initiate ✅ (protected)
POST /api/auth/login           ✅ (public)
GET  /health                   ✅ (public)
```

---

## 🐛 Troubleshooting

### Error: "Cannot find module 'multer'"
**Solution:**
```bash
npm install multer --save
# OR
npm install
```

### Error: "ENOENT: no such file or directory, open 'uploads'"
**Solution:** Server auto-creates directory on startup. Just restart:
```bash
npm start
```

### Error: "413 Payload Too Large"
**Solution:** File exceeds 5MB. Use smaller image or increase limit in routes/api.js

### Error: "Only image files are allowed"
**Solution:** Upload JPEG, PNG, GIF, or WebP file (not PDF, TXT, etc.)

### Uploads Directory Not Created
**Solution:** Check if server started successfully. Should see in console:
```
✅ Created uploads directory
```

---

## 📱 Mobile App Integration Example

### React Native Example:

```typescript
import * as ImagePicker from 'expo-image-picker';

const uploadProfilePhoto = async (authToken: string) => {
  // Pick image
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    aspect: [1, 1],
    quality: 0.8,
  });

  if (result.canceled) return;

  // Create FormData
  const formData = new FormData();
  formData.append('photo', {
    uri: result.assets[0].uri,
    type: 'image/jpeg',
    name: 'profile-photo.jpg',
  } as any);

  // Upload
  const response = await fetch('http://localhost:3000/api/student/upload-photo', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${authToken}`
    },
    body: formData,
  });

  const data = await response.json();
  
  if (data.success) {
    console.log('Photo uploaded:', data.data.photo_url);
    return data.data.photo_url;
  } else {
    console.error('Upload failed:', data.message);
  }
};
```

### Fetch Activities with Date:

```typescript
const fetchActivities = async () => {
  const response = await fetch('http://localhost:3000/api/student/activities');
  const data = await response.json();
  
  if (data.success) {
    // Now 'date' field is available!
    data.data.forEach(activity => {
      console.log(`${activity.title} on ${activity.date}`);
    });
  }
};
```

---

## ✅ Pre-Deployment Checklist

- ✅ Multer installed: `npm install multer`
- ✅ server.js updated with path/fs imports
- ✅ server.js creates uploads directory
- ✅ server.js serves uploads statically
- ✅ routes/api.js has multer configuration
- ✅ routes/api.js has upload route
- ✅ controllers/studentController.js has uploadPhoto method
- ✅ controllers/studentController.js maps event_date → date
- ✅ package.json includes multer dependency
- ✅ All existing endpoints still working
- ✅ Testing done with Postman/curl

---

## 🎉 You're All Set!

Everything is ready for:
1. ✅ Image uploads
2. ✅ Static file serving
3. ✅ Mobile app integration
4. ✅ Production deployment

**Start your server:**
```bash
npm start
```

**Test an endpoint:**
```bash
curl http://localhost:3000/health
```

**Upload a photo:**
```bash
# (See testing section above)
```

Happy coding! 🚀
