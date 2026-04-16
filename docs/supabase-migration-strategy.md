# Supabase Migration Strategy

This document outlines the strategy, requirements, and implications of migrating the LUMS application to Supabase. 

Currently, the stack consists of:
- A custom Node.js Express Backend.
- A local MySQL database accessed via Prisma ORM.
- Custom authentication (JWT + Nodemailer OTPs).

Supabase is a Backend-as-a-Service (BaaS) built on PostgreSQL. Moving to Supabase can be done in stages. Below is a breakdown of what parts of the application we can migrate, how that would look, and the pros and cons.

---

## What Parts Do We Want to Migrate?

We realistically have **two different paths** for migration, depending on how much of the existing backend code you want to keep.

### Option 1: Database-Only Migration (Low Friction)
In this scenario, we keep the existing Express server (`backend/`) exactly as it is, but we migrate the database from local MySQL to **Supabase PostgreSQL**.
- **What changes?** The Prisma `datasource db` provider in `schema.prisma` changes from `mysql` to `postgresql`. You deploy a Postgres database on Supabase and swap the `DATABASE_URL` in your `.env`.
- **What stays?** All your Express route handlers, custom JWT authentication, Nodemailer OTP flow, and event logic remain entirely untouched.

### Option 2: Full Serverless Migration (High Effort, High Reward)
In this scenario, we replace the custom Express backend entirely by adopting Supabase's fully managed tools.
- **Supabase Auth**: Replaces `database/src/middleware/authHandlers.ts`. Supabase provides native Magic Link/OTP email signups. We would configure Supabase to only allow `@student.lu.se` domains.
- **Supabase PostgreSQL & PostgREST**: Replacing `database/src/middleware/eventHandlers.ts`. The React frontend would query the database directly using the `@supabase/supabase-js` client rather than pinging your Express Server.
- **Row Level Security (RLS)**: Replaces `requireAdmin` middlewares. We write SQL policies inside Supabase to restrict access (e.g., "Only users with role 'admin' can insert events").
- **Supabase Edge Functions**: Moves complex logic (like Stripe Webhooks or custom dynamic pricing tier calculations) to serverless Deno functions hosted on Supabase.

---

## What Would Be Needed?

If we go with **Option 2 (Full Migration)**, you will need:

1. **A Supabase Project**: Create a new project on supabase.com.
2. **Database Schema Translation**: 
   - While Prisma handles most of the translation automatically, we need to convert Prisma enums and specific `VarChar` lengths into Postgres data types.
   - We will run Prisma migrations against the new Postgres URL.
3. **Frontend Rewrite (Heavy)**:
   - Uninstall standard Axios/fetch wrappers.
   - Install `@supabase/supabase-js`.
   - Rewrite the `/signup` and `/login` React pages to use `supabase.auth.signInWithOtp()`.
   - Rewrite TanStack queries on `/events` to fetch data directly from Supabase tables instead of `/api/events`.
4. **Backend Decommissioning**: 
   - The Express framework, `jsonwebtoken`, `bcryptjs`, and `nodemailer` packages would be deleted entirely.

---

## Pros and Cons of Migrating to Supabase

### Cons (The Drawbacks)
1. **Migration Cost (Time)**: Rewriting the frontend to use the Supabase SDK and moving business logic from Express into Row Level Security (RLS) SQL policies will take solid development time.
2. **Loss of Custom Control**: Your current Express auth flow manually creates highly specific snapshot tables (`pending_signups`) and ties event form field logic together tightly in a single JS file. Translating this specific logic to Supabase requires splitting it into Postgres Database Triggers or Edge Functions, which can be harder to debug than a simple Express server.
3. **Vendor Lock-in**: Relying heavily on Supabase Auth and RLS means your code is tightly coupled to the Supabase ecosystem, unlike your current Express/Prisma setup which can be deployed to literally any VPS or cloud provider.

### Pros (The Benefits)
1. **Zero Backend Maintenance**: You no longer need to host, monitor, or restart an Express.js server on a platform like Render, Heroku, or an EC2 instance. Supabase manages the uptime.
2. **Drastically Faster Development Rate**: Once configured, fetching data in React becomes incredibly fast. Instead of making an Express route, you just write `supabase.from('events_info').select('*')` on the frontend.
3. **Built-in Realtime**: If you want live-updating event capacities or admin dashboards, Supabase provides instant WebSocket updates out of the box with zero extra code.
4. **World-Class Authentication**: Supabase Auth handles password resets, session refreshment, and OAuth (Google/Apple login) flawlessly.

---

## Recommendation

My recommendation is to **start with Option 1, then progressively adopt Option 2**.

1. **Phase 1**: Change Prisma from MySQL to Supabase Postgres. This guarantees your data is hosted professionally in the cloud instead of your local machine, allowing you to deploy the website to production immediately.
2. **Phase 2**: Slowly migrate endpoints. Since you already have the frontend completely built out to expect REST API responses from Express, throwing away the Express server right now means discarding a lot of excellent code.
