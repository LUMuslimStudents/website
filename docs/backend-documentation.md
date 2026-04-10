# Backend Documentation

This document provides a comprehensive overview of the backend architecture for the LUMS website. The backend is an API server built on **Node.js, Express, and Prisma**, serving requests from the React frontend.

## Architecture Overview

The backend uses a standard modular architecture. The entry point is `src/index.ts`, which bootstraps the Express server, configures global middleware (like CORS and JSON parsing), initializes the Prisma ORM client, and registers separate route handler modules.

### Directory Mapping
- **`src/index.ts`**: The main application file. Maps high-level HTTP route prefixes to specific handler functions.
- **`src/middleware/`**: Contains the core business logic, categorized by domain. 
  - `authHandlers.ts`: Manages user registration, login, and email verification workflows.
  - `eventHandlers.ts`: Manages the creation, fetching, and registration logic for events.
  - `userHandlers.ts`: Provides administrative data fetching for the user base.
  - `auth.ts`: Provides JWT verification middleware and role-based access control (RBAC).
  - `utils.ts`: Helper functions (Nodemailer config, OTP generation).
- **`prisma/`**: Contains `schema.prisma`, which dictates the database schema and is used to generate the strongly-typed Prisma Client used across the application.

---

## 1. Authentication & Authorization Pipeline

The system enforces a strict verification pipeline to ensure only valid LU students can create standard accounts.

### 1.1 The Signup Process (`/api/auth/signup` and `/api/auth/verify-email`)
1. **Initial Submission**: A user submits their details (name, `@student.lu.se` email, chosen password) to the `/signup` endpoint.
2. **Pending State (`authHandlers.ts`)**: Instead of creating a `users` record immediately, the backend generates a random 6-digit OTP (via `utils.ts:generateVerificationCode`) and stores the user's data + OTP in the `pending_signups` table.
3. **Email Delivery (`utils.ts`)**: The backend uses Nodemailer to send the OTP to the student's email address. The OTP expires after 3 minutes.
4. **Verification**: The user submits the OTP to `/verify-email`. The server retrieves the corresponding `pending_signups` record. If the OTP matches and hasn't expired, the backend:
    - Hashes the plaintext password using `bcryptjs`.
    - Creates a permanent record in the `users` table.
    - Deletes the `pending_signups` record.

### 1.2 Login & Session Management (`/api/auth/login`)
User sessions are fundamentally managed via stateless JSON Web Tokens (JWT).
1. The user provides an email and password.
2. The server locates the user via Prisma (`prisma.users.findUnique`) and compares hashes.
3. Upon success, a JWT is generated (`jsonwebtoken.sign`) encoding the user's ID, email, and role. This token is returned and stored in the frontend's `localStorage`.

### 1.3 Access Control (`auth.ts`)
The `auth.ts` middleware file exports interceptor functions used to protect routes:
- **`authenticateToken`**: Parses the HTTP `Authorization: Bearer <token>` header, verifies it against the `JWT_SECRET`, and attaches the decoded user payload to the Express `Request` object. Rejects unauthorized requests.
- **`requireAdmin`**: Checks if the decoded user attached to the Request has `role: 'admin'`. Rejects non-admin traffic.

---

## 2. Event Management Engine

The `eventHandlers.ts` file acts as the core engine for creating and signing up for events. Events in LUMS are highly dynamic.

### 2.1 Event Creation (`POST /api/admin/events`)
Because event requirements change drastically (e.g., a dinner requires dietary info, a sports event requires t-shirt sizes), the backend supports dynamic form fields.
- When an admin posts a new event, they supply standard metadata (title, time, location, price logic) alongside an array of `customFields`.
- The backend uses Prisma transactions to:
  1. Insert the event into `events_info`.
  2. Map and insert the `customFields` into `event_form_fields`, establishing a relational link to the new event ID.

### 2.2 Event Registration Flow
When a user attempts to register for an event, the backend processes potentially complex logic:
1. **Snapshotting Profiles**: The `event_registration_profiles` table stores a snapshot of the user's details at the moment of registration. This is crucial historically; if a user later changes their name or student status, the event organizers still see them exactly as they were when they bought the ticket.
2. **Dynamic Answers**: The user's answers to the dynamic event fields are extracted and stored into `event_registration_field_answers`. Each answer is strictly linked back to its defining `event_form_fields` record.
3. **Pricing Tier Calculation**: The registration handler enforces role-based pricing logic. It calculates the `quoted_price` dynamically based on whether the registering user is flagged in the database as a full member, an alumnus, or a non-member.
4. **Linked Users vs Guest Checkouts**: The backend supports linking a registration directly to an authenticated `users` record or allowing a completely unlinked guest checkout, depending on the event's configuration.

### 2.3 Calendar Integration (ICS)
The backend dynamically builds and serves `.ics` files by constructing raw vCalendar specification text. When the user requests `/api/events/:id/calendar`, it streams an ICS file enabling 1-click addition to Apple/Google calendars.

---

## 3. Storage and File Handling
For endpoints requiring file uploads (like event poster images), the backend leverages `multer`.
- Images are uploaded multipart/form-data.
- Multer processes the stream and writes the file to the local disk (the `public/` or `uploads/` directory).
- The Express server serves these folders statically using `express.static()`.

## 4. User Admin Interfacing
The backend exposes restricted endpoints (protected by `requireAdmin`) to allow dashboard overviews. For example, `userHandlers.ts` allows fetching all users while explicitly purging sensitive hashed password data using Destructuring Assignment before sending the JSON response.
