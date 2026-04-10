# Project Architecture Map

This document provides a visual and structured map of the LUMS website architecture, representing the interaction between the frontend, backend, database, and external services.

## 1. High-Level System Overview

The application follows a modern client-server architecture, decoupled into a frontend SPA and a backend REST API.

```mermaid
graph TD
    User((User))
    
    subgraph "Frontend (React + Vite)"
        UI[User Interface / Pages]
        State[React Hook Form / TanStack Query]
        API_Wrapper[API Client / lib/api.ts]
    end
    
    subgraph "Backend (Express + Node.js)"
        Router[Express Router]
        Handlers[Business Logic Handlers]
        Prisma[Prisma ORM Client]
    end
    
    subgraph "Database (Relational)"
        DB[(SQL Database)]
    end
    
    subgraph "External Integrations"
        Stripe[Stripe Payments]
        Email[Gmail / Nodemailer]
        Supabase[Supabase Edge Functions]
    end

    User <--> UI
    UI <--> State
    State <--> API_Wrapper
    API_Wrapper <--> Router
    Router <--> Handlers
    Handlers <--> Prisma
    Prisma <--> DB
    
    Handlers -- Send OTP --> Email
    UI -- Checkout --> Stripe
    Stripe -- Webhooks/Redirects --> Supabase
    Supabase -- Sync Data --> DB
```

---

## 2. Monorepo (Workspaces) Structure

As per the latest restructuring into **npm workspaces**, the project is organized to isolate concerns while sharing a root environment.

```mermaid
graph LR
    Root[Root /] --> F[frontend/]
    Root --> B[backend/]
    Root --> D[docs/]
    
    subgraph "frontend/"
        Fsrc[src/]
        Fpub[public/]
        Fpkg[package.json]
    end
    
    subgraph "backend/"
        Bsrc[src/]
        Bprisma[prisma/]
        Bpkg[package.json]
    end
    
    subgraph "docs/"
        Dprd[PRD.md]
        Dback[backend-documentation.md]
        Dfront[frontend-documentation.md]
        Darch[architecture-map.md]
    end
```

---

## 3. Data Flow: Event Registration

This map shows how data moves from a user's click to the persistent database.

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Backend
    participant DB
    
    User->>Frontend: Click "Register"
    Frontend->>Backend: GET /api/events/:id (Fetch Fields)
    Backend->>DB: Query events_info + event_form_fields
    DB-->>Backend: Event Data + Custom Schema
    Backend-->>Frontend: JSON Response
    
    Frontend->>User: Render Dynamic Form
    User->>Frontend: Submit Form (Answers)
    
    Frontend->>Backend: POST /api/events/register
    Backend->>DB: Transaction: Create Registration + Profile + Answers
    DB-->>Backend: Success
    Backend-->>Frontend: Success Response
    Frontend->>User: Confirmation Message (or Stripe Redirect)
```

---

## 4. Authentication State Machine

The logic governing how a visitor becomes a verified student member.

```mermaid
stateDiagram-v2
    [*] --> Visitor
    Visitor --> SignupForm: Fill Details
    SignupForm --> PendingSignup: POST /signup (OTP Sent)
    
    state PendingSignup {
        [*] --> WaitingForOTP
        WaitingForOTP --> Expired: Timer > 3mins
        Expired --> WaitingForOTP: Resend OTP
        WaitingForOTP --> Verifying: Code Submitted
    }
    
    Verifying --> UserAccount: Correct Code
    Verifying --> WaitingForOTP: Wrong Code
    
    UserAccount --> Login: Credentials Provided
    Login --> Authenticated: JWT Issued
    Authenticated --> Member: Membership Paid (Stripe)
```

---

## 5. Security & Isolation Layer

- **CORS Protection**: Access is restricted to trusted origins.
- **Stateless Auth**: JWT eliminates the need for server-side sessions, ensuring better scalability.
- **ORM abstraction**: Prisma acts as a type-safe bridge, preventing raw SQL injection and ensuring schema consistency.
- **Validation**: Shared logic via Zod schemas ensures data integrity at both ends (Frontend UI and Backend Handlers).
