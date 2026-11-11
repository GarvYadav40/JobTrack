# JobTrack – Job Application Tracker API

A backend REST API that helps users manage their job applications, track interview rounds, maintain notes, and monitor application status changes.

## Features

- **User Authentication:** Secure registration and login using bcrypt and JWT.
- **Application Management:** Create, view, update, and delete job applications.
- **Interview Tracking:** Schedule, view, update, and delete interviews.
- **Notes Management:** Add, retrieve, edit, and delete notes for applications.
- **Status History:** Automatically track application status changes using PostgreSQL triggers.
- **User Data Isolation:** Users can access only their own applications and related data.
- **Input Validation:** Validate incoming request data.
- **Centralized Error Handling:** Consistent API error responses.
- **Automated Testing:** Jest and Supertest test suite.

## Tech Stack

- Node.js
- Express.js
- PostgreSQL
- JWT (JSON Web Tokens)
- bcrypt
- Jest
- Supertest

## Project Structure

```text
jobtrack/
├── src/
│   ├── config/
│   │   └── db.js
│   ├── middleware/
│   │   └── authMiddleware.js
│   ├── routes/
│   │   └── authRoutes.js
│   └── server.js
├── tests/
│   └── auth.test.js
├── .env
├── .gitignore
├── package.json
└── README.md
```

## Installation and Setup

### 1. Clone the repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
cd jobtrack
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the project root:

```env
PORT=3000
DB_USER=your_database_user
DB_HOST=localhost
DB_NAME=jobtrack
DB_PASSWORD=your_database_password
DB_PORT=5432
JWT_SECRET=your_secret_key
```

Use your own PostgreSQL credentials and a strong JWT secret.

### 4. Set up the database

Create a PostgreSQL database named `jobtrack`.

Create the required tables: `users`, `applications`, `interviews`, `notes`, and `status_history`.

Also configure the application status history trigger.

### 5. Start the server

Development mode:

```bash
npm run dev
```

Production mode:

```bash
npm start
```

The API runs at:

```text
http://localhost:3000
```

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register a user |
| POST | `/api/auth/login` | Login |

### Applications

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/applications` | Get all applications |
| GET | `/api/applications/:id` | Get an application |
| POST | `/api/applications` | Create an application |
| PATCH | `/api/applications/:id` | Update an application |
| DELETE | `/api/applications/:id` | Delete an application |

### Interviews

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/interviews` | Schedule an interview |
| GET | `/api/interviews` | Get all interviews |
| PATCH | `/api/interviews/:id` | Update an interview |
| DELETE | `/api/interviews/:id` | Delete an interview |

### Notes

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/applications/:id/notes` | Add a note |
| GET | `/api/applications/:id/notes` | Get application notes |
| PATCH | `/api/applications/:id/notes/:noteId` | Update a note |
| DELETE | `/api/applications/:id/notes/:noteId` | Delete a note |

### Status History

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/applications/:id/history` | Get application status history |

## Authentication

Protected endpoints require a JWT access token.

Add the following header to requests:

```text
Authorization: Bearer YOUR_JWT_TOKEN
```

## Running Tests

Run the automated test suite:

```bash
npm test
```

The project currently has **34 passing automated tests** using Jest and Supertest.

## Database Design

The application uses PostgreSQL with relational tables for users, applications, interviews, notes, and status history.

- Each application belongs to a user.
- Interviews and notes belong to an application.
- Status history records application status changes.
- Foreign keys and cascading deletes maintain referential integrity.

## Future Improvements

- Frontend dashboard
- Pagination and filtering
- Application analytics

## Author

Garv Yadav  
B.Tech Computer Science and Engineering
