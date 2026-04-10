# Lund University Muslim Students (LUMS) - Product Requirements Document (PRD)

## 1. Introduction & Overview
The LUMS (Lund University Muslim Students) website is a full-stack web application designed to serve the Muslim student community at Lund University. It provides an online platform for membership registration, event management, ticketing, and organizational information.

The platform is designed to be mobile-responsive, modern, and user-friendly, employing a clean UI with dark mode support.

## 2. Tech Stack

### Frontend
- **Framework**: React 18 with Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS, PostCSS
- **UI Components**: Shadcn UI (Radix UI primitives), Lucide React (icons)
- **Routing**: React Router DOM (v6)
- **State Management & Data Fetching**: TanStack Query (React Query)
- **Form Handling & Validation**: React Hook Form, Zod
- **Build Tool**: Vite

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **ORM**: Prisma
- **Database**: Relational Database (agnostic, managed via Prisma)
- **Authentication**: JSON Web Tokens (JWT), bcrypt for password hashing
- **Email Service**: Nodemailer (via Gmail)
- **File Processing**: Multer (for form parsing and image uploads)

### External Integrations
- **Payments**: Stripe (Test mode), handled via Supabase Edge Functions (as per `STRIPE-SETUP.md`)
- **API Communication**: Cross-Origin Resource Sharing (CORS) enabled for frontend-backend communication

## 3. System Architecture

### 3.1 Directory Structure
- `/src`: Frontend React application.
  - `/components`: UI and feature components (e.g., `admin`, `events`, `membership`, `ui`).
  - `/pages`: Route components (e.g., `Home`, `Login`, `Signup`, `Events`, `AdminDashboard`).
  - `/lib`: Utility functions and shared logic (e.g., API wrappers).
  - `/hooks`: Custom React hooks.
- `/database`: Backend Express server and route handlers.
  - `index.ts`: Main entry point, server configuration, route definitions.
  - `/middleware`: Business logic separated by domain.
    - `authHandlers.ts`: Signup, login, verification logic.
    - `eventHandlers.ts`: Event creation, listing, registration, ICS file generation.
    - `adminHandlers.ts`: Admin specific operations (user management, event oversight).
- `/prisma`: Database schema and migrations.
  - `schema.prisma`: The single source of truth for the database structure.

### 3.2 Database Schema (`prisma/schema.prisma`)
The system revolves around several core entities managed entirely through Prisma:
- **`users`**: Stores user accounts. Can be regular users or admins. Includes LU specific student validation status.
- **`pending_signups`**: Temporary storage for users who have submitted the signup form but haven't verified their LU email yet. This ensures only verified LU students can create accounts.
- **`events_info`**: Represents events. Contains title, date, location, pricing for different user tiers (members, non-members, alumni), and status.
- **`event_form_fields`**: Defines dynamic questions/fields that admins can add to specific events for attendees to answer upon registration.
- **`event_registrations`**: Links a user (or guest) to an event. Tracks payment status, quoted price, and registration timestamp.
- **`event_registration_profiles`**: Captures snapshot profile data at the time of registration.
- **`event_registration_field_answers`**: Stores the user's answers to the dynamic `event_form_fields`.

## 4. Key Features & User Flows

### 4.1 Authentication & Membership Pipeline
To ensure the integrity of the student organization, a rigorous authentication pipeline is enforced:
1. **Signup Initiation**: The user fills out the signup form (`/signup`), providing personal details and an `@student.lu.se` email address.
2. **Pending State**: The backend stores the details in the `pending_signups` table and uses Nodemailer to send a 6-digit OTP to the provided LU email.
3. **Verification**: The user enters the OTP on the `/verify-email` page. The backend validates the OTP, moves the data from `pending_signups` to `users`, and hashes the password.
4. **Login**: Users log in (`/login`) with their newly verified credentials. The backend issues a JWT, stored in `localStorage` on the frontend.
5. **Membership Payment**: To become a full "member", users must pay a membership fee via Stripe.

### 4.2 Event Management
Events are a core feature of the LUMS platform.
- **Event Creation (Admin)**: Admins can create events via the Admin Dashboard. They can define standard fields (title, date, location, pricing tiers) and configure **dynamic form fields** (e.g., dietary requirements, shirt size) that attendees must answer.
- **Event Viewing**: Users can view a list of upcoming events (`/events`).
- **Registration**: 
  - Users select an event and proceed to registration.
  - The system dynamically renders forms based on the `event_form_fields` defined by the admin.
  - Pricing is calculated dynamically based on the user's status (Member, Non-Member, Alumnus).
  - The registration process handles Stripe checkout for paid events.
- **ICS Integration**: Users can download `.ics` calendar files to add events directly to their personal calendars.

### 4.3 Administrator Dashboard
The `/admin` route is protected and restricted to users with the `admin` role.
- **User Management**: View all registered users, their membership status, and study programs.
- **Event Management**: Create new events, view existing events, manage dynamic form templates (presets), and view the list of registered attendees and their form answers for specific events.

## 5. Stripe Integration
The application uses Stripe for handling payments for both Membership fees and paid Event tickets.
- **Infrastructure**: According to `STRIPE-SETUP.md`, Stripe interactions are mediated by Supabase Edge Functions. This offloads payment processing logic from the core Express server.
- **Test Mode**: Currently configured to use Stripe Test Mode (`pk_test_...`, `sk_test_...`).
- **Flow**:
  1. Frontend initiates a checkout request.
  2. Supabase function creates a Stripe Checkout Session.
  3. Frontend redirects the user to the Stripe Checkout UI.
  4. Upon completion, Stripe redirects the user back to `/payment-success` or triggers webhooks to finalize the `payment_status` in the database.

## 6. Environment Configuration
The application relies on several environment variables (`.env`) for configuration:
- `DATABASE_URL`: Connection string for the database via Prisma.
- `VITE_API_URL`: The URL of the backend Express server (e.g., `http://192.168.0.78:5000/api`).
- `JWT_SECRET`: Secret string for signing and verifying JWT tokens.
- `EMAIL_SERVICE`, `EMAIL_USER`, `EMAIL_PASSWORD`: Nodemailer configuration for sending verification emails. The password should be an App Password, never a raw account password.
- `PORT`: (Optional) Port defining where the Express server listens.

## 7. Known Issues & Future Improvements
1. **Hardcoded URLs**: `VITE_API_URL` currently defaults to a local network IP in some files. This should be made fully dynamic depending on the environment (development vs. production).
2. **Database Management**: Local development can face issues with file-based locking depending on the underlying database engine setup. Using a containerized database approach (e.g., Docker) or using cloud-hosted development databases is recommended to resolve local file locking issues and simplify onboarding.
3. **Stripe Webhooks**: Ensure robust webhook endpoints are implemented in the Express backend or Supabase functions to definitively capture payment success/failure events asynchronously.
4. **Error Handling**: Enhance global error handling in the frontend to gracefully manage network failures or API timeouts, particularly during payment flows.
