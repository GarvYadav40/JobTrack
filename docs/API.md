# JobTrack API Documentation

Base URL: `http://localhost:3000`

All request and response bodies use JSON unless otherwise specified.

## 1. Authentication

### Register a User

`POST /api/auth/register`

Creates a new user account.

**Request Body**

```json
{
  "name": "Garv Yadav",
  "email": "garv@example.com",
  "password": "your_password"
}
```

**Success Response – 201 Created**

```json
{
  "message": "User registered successfully",
  "user": {
    "id": "user-uuid",
    "name": "Garv Yadav",
    "email": "garv@example.com",
    "created_at": "2026-11-11T10:00:00.000Z"
  }
}
```

**Error Responses**

| Status | Description |
|---|---|
| 400 | Name, email and password are required |
| 409 | Email already registered |
| 500 | Internal server error |

Passwords are hashed using bcrypt before being stored.

### Login

`POST /api/auth/login`

Authenticates a user and generates a JWT token.

**Request Body**

```json
{
  "email": "garv@example.com",
  "password": "your_password"
}
```

**Success Response – 200 OK**

```json
{
  "message": "Login successful",
  "token": "your_jwt_token",
  "user": {
    "id": "user-uuid",
    "name": "Garv Yadav",
    "email": "garv@example.com"
  }
}
```

**Error Responses**

| Status | Description |
|---|---|
| 400 | Email and password are required |
| 401 | Invalid email or password |
| 500 | Internal server error |

JWT tokens expire after 1 day.

### Get Authenticated Profile

`GET /api/auth/profile`

Returns the authenticated user's JWT payload.

**Success Response – 200 OK**

```json
{
  "message": "Authenticated successfully",
  "user": {
    "id": "user-uuid",
    "iat": 1794391200,
    "exp": 1794477600
  }
}
```

Requires authentication.

## 2. Health Check

### Check API Status

`GET /api/health`

**Success Response – 200 OK**

```json
{
  "status": "OK",
  "message": "Jobtrack API is running"
}
```

## 3. Applications

All application endpoints require authentication.

### Create Application

`POST /api/applications`

**Request Body**

```json
{
  "company": "Google",
  "role": "SDE Intern",
  "status": "Applied",
  "job_url": "https://careers.google.com"
}
```

`company` and `role` are required. `status` and `job_url` are optional.

Allowed application statuses:
- Applied
- Interview
- Offer
- Rejected

**Success Response – 201 Created**

```json
{
  "message": "Application created successfully",
  "application": {
    "id": "application-uuid",
    "user_id": "user-uuid",
    "company": "Google",
    "role": "SDE Intern",
    "job_url": "https://careers.google.com",
    "status": "Applied"
  }
}
```

### Get All Applications

`GET /api/applications`

Returns the authenticated user's applications.

Optional query parameters:

| Parameter | Description |
|---|---|
| status | Filter by application status |
| company | Filter by company name |

Example:

`GET /api/applications?status=Applied&company=Google`

**Success Response – 200 OK**

```json
{
  "count": 1,
  "applications": [
    {
      "id": "application-uuid",
      "company": "Google",
      "role": "SDE Intern",
      "status": "Applied"
    }
  ]
}
```

### Get Application by ID

`GET /api/applications/:id`

Returns a specific application belonging to the authenticated user.

**Success Response – 200 OK**

```json
{
  "application": {
    "id": "application-uuid",
    "company": "Google",
    "role": "SDE Intern",
    "status": "Applied"
  }
}
```

### Update Application

`PATCH /api/applications/:id`

Updates one or more application fields.

**Request Body**

```json
{
  "status": "Interview",
  "company": "Google",
  "role": "SDE Intern",
  "job_url": "https://careers.google.com"
}
```

At least one field must be provided.

**Success Response – 200 OK**

```json
{
  "message": "Application updated successfully",
  "application": {
    "id": "application-uuid",
    "company": "Google",
    "role": "SDE Intern",
    "status": "Interview"
  }
}
```

### Delete Application

`DELETE /api/applications/:id`

Deletes an application belonging to the authenticated user.

**Success Response – 200 OK**

```json
{
  "message": "Application deleted successfully",
  "application": {
    "id": "application-uuid",
    "company": "Google",
    "role": "SDE Intern"
  }
}
```

Deleting an application also deletes its related interviews, notes and status history through cascading foreign keys.

### Application Error Responses

| Status | Description |
|---|---|
| 400 | Invalid ID format |
| 400 | Invalid company, role or application status |
| 400 | At least one field is required for update |
| 404 | Application not found |
| 500 | Internal server error |

## 4. Dashboard Statistics

### Get Dashboard Statistics

`GET /api/dashboard/stats`

Returns application counts for the authenticated user.

**Success Response – 200 OK**

```json
{
  "stats": {
    "total": "10",
    "applied": "4",
    "interviews": "3",
    "offers": "2",
    "rejected": "1"
  }
}
```

Note: PostgreSQL COUNT results are returned as strings by the `pg` driver.

## 5. Interviews

All interview endpoints require authentication.

### Create Interview

`POST /api/interviews`

**Request Body**

```json
{
  "application_id": "application-uuid",
  "round": "Technical Interview",
  "scheduled_at": "2026-11-15T10:00:00",
  "mode": "Online",
  "notes": "Prepare DSA and core CS subjects"
}
```

Required fields: `application_id` and `round`.

**Success Response – 201 Created**

```json
{
  "message": "Interview scheduled successfully",
  "interview": {
    "id": "interview-uuid",
    "application_id": "application-uuid",
    "round": "Technical Interview",
    "scheduled_at": "2026-11-15T10:00:00",
    "mode": "Online",
    "notes": "Prepare DSA and core CS subjects",
    "result": "Scheduled"
  }
}
```

### Get All Interviews

`GET /api/interviews`

Returns all interviews belonging to the authenticated user, ordered by scheduled date.

**Success Response – 200 OK**

```json
{
  "count": 1,
  "interviews": [
    {
      "id": "interview-uuid",
      "application_id": "application-uuid",
      "company": "Google",
      "role": "SDE Intern",
      "round": "Technical Interview",
      "result": "Scheduled"
    }
  ]
}
```

### Update Interview

`PATCH /api/interviews/:id`

**Request Body**

```json
{
  "round": "Final Interview",
  "scheduled_at": "2026-11-16T11:00:00",
  "mode": "Online",
  "notes": "Prepare system design",
  "result": "Passed"
}
```

At least one field is required.

Allowed interview results:
- Scheduled
- Passed
- Failed

**Success Response – 200 OK**

```json
{
  "message": "Interview updated successfully",
  "interview": {
    "id": "interview-uuid",
    "round": "Final Interview",
    "result": "Passed"
  }
}
```

### Delete Interview

`DELETE /api/interviews/:id`

**Success Response – 200 OK**

```json
{
  "message": "Interview deleted successfully",
  "interview": {
    "id": "interview-uuid",
    "round": "Final Interview"
  }
}
```

### Interview Error Responses

| Status | Description |
|---|---|
| 400 | Invalid ID, application ID, round, date, mode or result |
| 400 | At least one field is required for update |
| 404 | Application or interview not found |
| 500 | Internal server error |

## 6. Notes

All note endpoints require authentication.

### Add Note

`POST /api/applications/:id/notes`

**Request Body**

```json
{
  "content": "Recruiter mentioned that the next round will focus on DSA."
}
```

**Success Response – 201 Created**

```json
{
  "message": "Note added successfully",
  "note": {
    "id": "note-uuid",
    "application_id": "application-uuid",
    "content": "Recruiter mentioned that the next round will focus on DSA."
  }
}
```

### Get Application Notes

`GET /api/applications/:id/notes`

**Success Response – 200 OK**

```json
{
  "count": 1,
  "notes": [
    {
      "id": "note-uuid",
      "application_id": "application-uuid",
      "content": "Prepare for the next round."
    }
  ]
}
```

### Update Note

`PATCH /api/applications/:id/notes/:noteId`

**Request Body**

```json
{
  "content": "Prepare DSA and DBMS questions."
}
```

**Success Response – 200 OK**

```json
{
  "message": "Note updated successfully",
  "note": {
    "id": "note-uuid",
    "content": "Prepare DSA and DBMS questions."
  }
}
```

### Delete Note

`DELETE /api/applications/:id/notes/:noteId`

**Success Response – 200 OK**

```json
{
  "message": "Note deleted successfully",
  "note": {
    "id": "note-uuid",
    "content": "Prepare DSA and DBMS questions."
  }
}
```

### Notes Error Responses

| Status | Description |
|---|---|
| 400 | Invalid application ID or note ID |
| 400 | Note content is required |
| 404 | Application or note not found |
| 500 | Internal server error |

## 7. Application Status History

### Get Application Status History

`GET /api/applications/:id/history`

Returns the status change history of an application in chronological order.

**Success Response – 200 OK**

```json
{
  "count": 2,
  "history": [
    {
      "id": "history-uuid-1",
      "application_id": "application-uuid",
      "old_status": null,
      "new_status": "Applied"
    },
    {
      "id": "history-uuid-2",
      "application_id": "application-uuid",
      "old_status": "Applied",
      "new_status": "Interview"
    }
  ]
}
```

Status history is maintained automatically using a PostgreSQL trigger whenever an application is created or its status changes.

## 8. Authentication Header

All protected endpoints require a valid JWT token.

Include the following header in requests:

```http
Authorization: Bearer YOUR_JWT_TOKEN
```

The token is generated during login and expires after one day.

**Authentication Error Responses**

| Status | Description |
|---|---|
| 401 | Missing authentication token |
| 401 | Invalid or expired token |

## 9. Security and Data Isolation

- Passwords are hashed using bcrypt.
- JWT authentication protects private endpoints.
- Each application is associated with its owner.
- Users can access only their own applications and related records.
- Parameterized SQL queries are used to avoid SQL injection.
- Foreign keys enforce relationships between database tables.
- Cascading deletes maintain referential integrity.

---

**Testing:** The API is tested using Jest and Supertest. The current automated test suite contains 34 passing tests.