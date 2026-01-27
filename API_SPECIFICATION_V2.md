# API Specification v2 - Student Housing System

**Version:** 2.0  
**Last Updated:** 2026-01-28  
**Status:** Active  
**Base URL:** `http://{server}:{port}`

---

## Overview

This document defines the strict Interface Contract (JSON Request/Response) for all Student Housing App v2 API endpoints. Backend developers must implement these specifications exactly as documented.

---

## Table of Contents

1. [Standard Response Format](#standard-response-format)
2. [Authentication](#authentication)
3. [Endpoint Specifications](#endpoint-specifications)
   - [POST /student/complaints](#post-studentcomplaints)
   - [GET /student/activities](#get-studentactivities)
   - [POST /student/clearance](#post-studentclearance)
   - [GET /student/profile](#get-studentprofile)

---

## Standard Response Format

All API responses follow this standard structure:

```json
{
  "success": true|false,
  "data": {},
  "message": "string (optional)"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `success` | BOOLEAN | ✓ | Indicates request success (true) or failure (false) |
| `data` | OBJECT \| ARRAY | ✗ | Response payload (omitted if null/empty) |
| `message` | STRING | ✗ | Human-readable message (optional, for errors or confirmations) |

### HTTP Status Codes

| Code | Scenario |
|------|----------|
| `200` | Successful request |
| `201` | Resource created |
| `400` | Bad request (validation error) |
| `401` | Unauthorized (missing/invalid token) |
| `403` | Forbidden (insufficient permissions) |
| `404` | Resource not found |
| `500` | Server error |

---

## Authentication

All endpoints require Bearer token in the `Authorization` header:

```
Authorization: Bearer {jwt_token}
```

**Token Source:** Obtained from `/auth/login` endpoint.  
**Token Type:** JWT (JSON Web Token)  
**Claims Included:**
- `id` - Student ID
- `national_id` - National ID
- `iat` - Issued at timestamp
- `exp` - Expiration timestamp

---

## Endpoint Specifications

---

### POST /student/complaints

**Description:** Submit a new complaint (grievance, issue report, or confidential report).

**HTTP Method:** `POST`  
**Authentication:** Required (Bearer token)  
**Content-Type:** `application/json`

#### Request Body

```json
{
  "title": "string",
  "description": "string",
  "recipient": "string",
  "is_secret": "boolean"
}
```

| Field | Type | Required | Length | Description |
|-------|------|----------|--------|-------------|
| `title` | STRING | ✓ | 1-200 | Complaint subject/headline |
| `description` | STRING | ✓ | 1-5000 | Detailed complaint text |
| `recipient` | STRING | ✓ | 1-100 | Recipient department/role (e.g., "management", "maintenance", "security", "general") |
| `is_secret` | BOOLEAN | ✓ | - | Whether complaint is confidential (true) or public (false) |

#### Request Example

```json
{
  "title": "Noise from Adjacent Room",
  "description": "Room 203 has been making excessive noise during study hours. Please investigate.",
  "recipient": "management",
  "is_secret": false
}
```

```json
{
  "title": "Sensitive Matter",
  "description": "I witnessed inappropriate behavior and prefer to report confidentially.",
  "recipient": "security",
  "is_secret": true
}
```

#### Success Response (HTTP 200)

```json
{
  "success": true,
  "data": {
    "id": 42,
    "student_id": 5,
    "title": "Noise from Adjacent Room",
    "description": "Room 203 has been making excessive noise during study hours. Please investigate.",
    "recipient": "management",
    "is_secret": false,
    "type": "General",
    "status": "pending",
    "attachment_url": null,
    "admin_reply": null,
    "created_at": "2026-01-28T14:32:00.000Z",
    "updated_at": "2026-01-28T14:32:00.000Z"
  },
  "message": "Complaint submitted successfully"
}
```

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | INTEGER | Complaint ID (auto-generated) |
| `student_id` | INTEGER | ID of complaining student |
| `title` | STRING | Complaint title |
| `description` | STRING | Complaint description |
| `recipient` | STRING | Recipient field |
| `is_secret` | BOOLEAN | Confidentiality flag |
| `type` | STRING | Complaint type (e.g., "General", "Urgent") |
| `status` | STRING | Current status (always "pending" on creation, lowercase) |
| `attachment_url` | STRING \| NULL | URL to attached evidence (if any) |
| `admin_reply` | STRING \| NULL | Admin response (null until replied) |
| `created_at` | ISO 8601 STRING | Submission timestamp |
| `updated_at` | ISO 8601 STRING | Last modification timestamp |

#### Error Responses

**Missing Required Field (HTTP 400)**
```json
{
  "success": false,
  "message": "Missing required field: title"
}
```

**Unauthorized (HTTP 401)**
```json
{
  "success": false,
  "message": "Unauthorized - Invalid or missing token"
}
```

**Server Error (HTTP 500)**
```json
{
  "success": false,
  "message": "Failed to submit complaint"
}
```

---

### GET /student/activities

**Description:** Retrieve all available activities/events for the student.

**HTTP Method:** `GET`  
**Authentication:** Required (Bearer token)  
**Query Parameters:** None

#### Request

```
GET /student/activities HTTP/1.1
Authorization: Bearer {jwt_token}
```

#### Success Response (HTTP 200)

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "Football League Tournament",
      "description": "Inter-dormitory football championship tournament",
      "image_url": "http://server:port/uploads/football.jpg",
      "location": "Main Sports Ground",
      "event_date": "2026-02-11T14:00:00.000Z",
      "is_subscribed": true,
      "created_at": "2026-01-20T10:00:00.000Z"
    },
    {
      "id": 2,
      "title": "Arts & Crafts Workshop",
      "description": "Hands-on workshop for creative students",
      "image_url": "http://server:port/uploads/arts.jpg",
      "location": "Art Studio (Building C)",
      "event_date": "2026-02-18T16:00:00.000Z",
      "is_subscribed": false,
      "created_at": "2026-01-20T10:00:00.000Z"
    },
    {
      "id": 3,
      "title": "Cultural Night",
      "description": "Celebrating diverse cultures from residents",
      "image_url": null,
      "location": "Main Hall",
      "event_date": "2026-03-05T19:00:00.000Z",
      "is_subscribed": false,
      "created_at": "2026-01-22T08:30:00.000Z"
    }
  ]
}
```

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | INTEGER | Activity ID |
| `title` | STRING | Activity name |
| `description` | STRING \| NULL | Detailed description |
| `image_url` | STRING \| NULL | Full URL to promotional image (absolute path) |
| `location` | STRING \| NULL | Venue/location of activity |
| `event_date` | ISO 8601 STRING | Scheduled date and time (UTC) |
| `is_subscribed` | BOOLEAN | Whether current student is registered (TRUE/FALSE) |
| `created_at` | ISO 8601 STRING | Creation timestamp |

#### Important Constraints

1. **`event_date` Format:**
   - Must be ISO 8601 format (e.g., `2026-02-11T14:00:00.000Z`)
   - Must be in UTC timezone
   - NULL values are acceptable if no date is set

2. **`is_subscribed` Field:**
   - REQUIRED field that indicates student's registration status
   - TRUE = student is registered for this activity
   - FALSE = student is not registered
   - Must be calculated per-student (different for each requester)

3. **`image_url` Field:**
   - Must be absolute URL (including protocol and host)
   - Format: `http://{server}:{port}{path}`
   - NULL if no image available
   - Never return relative paths like `/uploads/image.jpg`

#### Error Response (HTTP 401)

```json
{
  "success": false,
  "message": "Unauthorized - Invalid or missing token"
}
```

#### Error Response (HTTP 500)

```json
{
  "success": false,
  "message": "Failed to retrieve activities"
}
```

---

### POST /student/clearance

**Description:** Initiate a new clearance request for room checkout/graduation process.

**HTTP Method:** `POST`  
**Authentication:** Required (Bearer token)  
**Content-Type:** `application/json`

#### Request Body

```json
{
  "initiated_by": "string (optional)"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `initiated_by` | STRING | ✗ | Optional field describing who initiated (e.g., "student", "admin"). Defaults to authenticated student. |

#### Request Example

**Minimal Request (Most Common)**
```json
{}
```

**With Optional Context**
```json
{
  "initiated_by": "student"
}
```

#### Success Response (HTTP 201)

```json
{
  "success": true,
  "data": {
    "id": 8,
    "student_id": 5,
    "status": "pending",
    "room_check_passed": false,
    "keys_returned": false,
    "initiated_at": "2026-01-28T14:45:30.000Z"
  },
  "message": "Clearance request initiated successfully"
}
```

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | INTEGER | Clearance request ID (auto-generated) |
| `student_id` | INTEGER | ID of student for whom clearance is initiated |
| `status` | STRING | Status code (always "pending" on creation, lowercase) |
| `room_check_passed` | BOOLEAN | Room inspection status (false on creation) |
| `keys_returned` | BOOLEAN | Key return status (false on creation) |
| `initiated_at` | ISO 8601 STRING | Timestamp of request creation |

#### Status Values

| Status | Description |
|--------|-------------|
| `"pending"` | Clearance in progress, awaiting completion |
| `"completed"` | All clearance requirements met |

#### Error Responses

**Student Already Has Pending Clearance (HTTP 400)**
```json
{
  "success": false,
  "message": "Student already has an active clearance request"
}
```

**Unauthorized (HTTP 401)**
```json
{
  "success": false,
  "message": "Unauthorized - Invalid or missing token"
}
```

**Server Error (HTTP 500)**
```json
{
  "success": false,
  "message": "Failed to initiate clearance request"
}
```

---

### GET /student/profile

**Description:** Retrieve authenticated student's profile information including room assignment.

**HTTP Method:** `GET`  
**Authentication:** Required (Bearer token)  
**Query Parameters:** None

#### Request

```
GET /student/profile HTTP/1.1
Authorization: Bearer {jwt_token}
```

#### Success Response (HTTP 200)

```json
{
  "success": true,
  "data": {
    "id": 5,
    "national_id": "30412010101234",
    "full_name": "محمد أحمد علي",
    "student_id": "30412010101234",
    "college": "Engineering",
    "academic_year": "2025-2026",
    "photo_url": "http://server:port/uploads/student_5.jpg",
    "room": {
      "room_no": "101",
      "building": "Building A"
    }
  }
}
```

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | INTEGER | Student database ID |
| `national_id` | STRING | 14-digit national ID |
| `full_name` | STRING | Student's full name |
| `student_id` | STRING | Student identifier (typically same as national_id) |
| `college` | STRING \| NULL | Faculty/Department name |
| `academic_year` | STRING \| NULL | Current academic year (e.g., "2025-2026") |
| `photo_url` | STRING \| NULL | Full URL to profile photo (absolute path) |
| `room` | OBJECT | **Room assignment object** |

#### Room Object Structure (CRITICAL ⚠️)

**MUST BE AN OBJECT, NOT A STRING OR NULL:**

```json
{
  "room_no": "string or null",
  "building": "string or null"
}
```

| Field | Type | Allowed Values | Description |
|-------|------|---|-------------|
| `room_no` | STRING \| NULL | Room number (e.g., "101", "A-203") or null if unassigned | Room identifier |
| `building` | STRING \| NULL | Building name (e.g., "Building A", "Dorm C") or null if unassigned | Building name |

#### Room Scenarios

**Scenario 1: Student Assigned to Room**
```json
{
  "room_no": "101",
  "building": "Building A"
}
```

**Scenario 2: Student Unassigned (No Room)**
```json
{
  "room_no": null,
  "building": null
}
```

**Scenario 3: Empty/Placeholder Display**
```json
{
  "room_no": "غير مسكن",
  "building": "---"
}
```

#### Image URL Requirements

- `photo_url` must be a full absolute URL (e.g., `http://server:port/uploads/...`)
- NULL if student has no photo
- Never return relative paths

#### Error Response (HTTP 401)

```json
{
  "success": false,
  "message": "Unauthorized - Invalid or missing token"
}
```

#### Error Response (HTTP 404)

```json
{
  "success": false,
  "message": "Student profile not found"
}
```

#### Error Response (HTTP 500)

```json
{
  "success": false,
  "message": "Failed to retrieve profile"
}
```

---

## Data Validation Rules

### Field Validation

| Field | Type | Min | Max | Pattern | Required |
|-------|------|-----|-----|---------|----------|
| `title` (complaints) | STRING | 1 | 200 | Any | ✓ |
| `description` (complaints) | STRING | 1 | 5000 | Any | ✓ |
| `recipient` (complaints) | STRING | 1 | 100 | alphanumeric, spaces | ✓ |
| `is_secret` (complaints) | BOOLEAN | - | - | true/false | ✓ |
| `event_date` (activities) | ISO 8601 | - | - | YYYY-MM-DDTHH:mm:ss.sssZ | ✗ |
| `is_subscribed` (activities) | BOOLEAN | - | - | true/false | ✓ |

### Status Normalization

All status fields must be **lowercase**:
- ❌ `"Pending"`, `"PENDING"`, `"pending"` (inconsistent)
- ✅ `"pending"` (correct)
- ✅ `"completed"` (correct)

---

## Implementation Checklist

- [ ] POST /student/complaints accepts and returns correct fields
- [ ] GET /student/activities returns `is_subscribed` per-student
- [ ] GET /student/activities returns `event_date` in ISO 8601 format
- [ ] POST /student/clearance initiates with `status: "pending"`
- [ ] GET /student/profile returns `room` as OBJECT with `room_no` and `building`
- [ ] All image URLs are absolute (include protocol and host)
- [ ] All timestamps are ISO 8601 format in UTC
- [ ] All status values are lowercase
- [ ] All error responses follow standard format
- [ ] Authentication is enforced on all protected endpoints

---

## Notes for Backend Developers

1. **Column Mapping:** Database column names may differ from API field names (e.g., `room_number` → `room_no`). Ensure proper mapping in controllers.

2. **Timezone:** All timestamps must be in UTC (ISO 8601 format ending with `Z`).

3. **Image URLs:** The `fixImageUrl()` helper should convert relative paths to absolute URLs before sending responses.

4. **Per-Student Data:** The `is_subscribed` field in activities must be calculated dynamically based on the authenticated user's subscriptions.

5. **Cascading:** When a student is deleted, all related clearance requests, complaints, etc., should be cascade-deleted per foreign key constraints.

6. **Room Object:** The room object must NEVER be null or a string. It must always be an object `{room_no, building}` even if values are null.

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 2.0 | 2026-01-28 | Initial specification for v2; introduced `event_date`, `is_subscribed`, room object structure |
| 1.0 | 2025-12-15 | Original API specification |
