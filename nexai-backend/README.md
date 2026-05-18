# NexAI Solutions Backend

Production-ready Node.js backend for the NexAI Solutions agency website.

## Tech Stack

- Node.js
- Express.js
- MongoDB + Mongoose
- JWT authentication
- bcrypt password hashing
- Nodemailer for email notifications
- helmet, cors, express-rate-limit, dotenv
- express-validator

## Folder Structure

```text
nexai-backend/
├── server.js
├── .env
├── .env.example
├── package.json
├── config/
├── models/
├── routes/
├── controllers/
├── middleware/
└── utils/
```

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy `.env.example` to `.env` and fill in real values.

3. Start MongoDB locally or update `MONGO_URI` for your hosted database.

4. Run the server:

```bash
npm run dev
```

The API runs on `http://localhost:5000` by default.

## Environment Variables

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/nexai_db
JWT_SECRET=your_super_secret_key_here
JWT_EXPIRES_IN=7d
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
ADMIN_EMAIL=priyanshu@nexaisolutions.com
FRONTEND_URL=http://localhost:3000
```

## First Admin Setup

Use the one-time registration endpoint only when no admin exists yet.

```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "Priyanshu Kumar",
  "email": "priyanshu@nexaisolutions.com",
  "password": "StrongPassword123"
}
```

After the first admin is created, the endpoint returns `403` for all future attempts.

## Authentication

### Login

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "priyanshu@nexaisolutions.com",
  "password": "StrongPassword123"
}
```

### Me

```http
GET /api/auth/me
Authorization: Bearer <JWT_TOKEN>
```

## Leads API

### Public Lead Submission

```http
POST /api/leads/submit
Content-Type: application/json

{
  "name": "Client Name",
  "email": "client@example.com",
  "service": "Web Design & Development",
  "message": "I need a premium website for my brand."
}
```

Response:

```json
{
  "success": true,
  "message": "Lead submitted successfully",
  "data": {
    "lead": {}
  }
}
```

### Get All Leads

```http
GET /api/leads?page=1&limit=10
Authorization: Bearer <JWT_TOKEN>
```

### Get Single Lead

```http
GET /api/leads/:id
Authorization: Bearer <JWT_TOKEN>
```

### Update Lead Status

```http
PATCH /api/leads/:id/status
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "status": "contacted"
}
```

### Delete Lead

```http
DELETE /api/leads/:id
Authorization: Bearer <JWT_TOKEN>
```

### Lead Stats

```http
GET /api/leads/stats
Authorization: Bearer <JWT_TOKEN>
```

Returns total leads, new leads created today, converted leads, and conversion rate.

## Email Notifications

When a new lead is submitted:

- The admin receives a branded NexAI Solutions email with the lead details.
- The user receives an auto-reply confirming the submission and response timeline.

SMTP is configured through the environment variables above.

## Frontend Connection

The frontend contact form is already configured to send requests to:

```text
http://localhost:5000/api/leads/submit
```

If the frontend is hosted elsewhere, update `FRONTEND_URL` in `.env` and the fetch URL in the client script as needed.

## API Response Format

Success:

```json
{
  "success": true,
  "message": "...",
  "data": {}
}
```

Error:

```json
{
  "success": false,
  "message": "...",
  "errors": []
}
```

## Scripts

- `npm run start` - start production server
- `npm run dev` - start development server with nodemon
- `npm test` - run the Node test runner

## Security Notes

- Passwords are hashed with bcrypt using 12 salt rounds.
- JWT secrets are loaded from `.env`.
- CORS is restricted to the configured frontend origin.
- Public submissions are rate limited to 5 requests per IP per hour.
- MongoDB queries use Mongoose sanitization safeguards.

## Notes

If you deploy the backend, set a real MongoDB URI, SMTP account, and frontend origin before starting the server.