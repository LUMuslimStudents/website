# Migration Context: Express/Prisma/MySQL → Supabase

> This document is the complete context for an AI agent to implement a backend migration incrementally. Each step is self-contained and evaluatable before proceeding to the next. Do not skip steps or combine them unless explicitly noted. ALL code in this document shoudl be regarded as examples, and can be modified or completely ignored!

---

## 1. Project Overview

### Existing Stack
- **Frontend**: Vite/React (TypeScript)
- **Backend**: Express.js server (separate Node.js process)
- **ORM**: Prisma (currently targeting MySQL)
- **Database**: MySQL
- **Auth**: Custom-built — OTP codes sent via Gmail, sessions stored in `localStorage`
- **API communication**: `import { apiRequest } from "@/lib/api"` — a central `fetch` wrapper

### Current `api.ts` Signature
```ts
export const apiRequest = async (endpoint: string, method: string = 'GET', body?: any)
```
Every component in the frontend calls this function. It must remain the single public interface — its signature must not change.

### App Features
- Event listings (public)
- Event registrations (with and without user login — guests can register)
- User accounts with custom fields (study program, term, gender, etc.)
- Admin panel: create events, view participants, view users
- Custom event form fields per event
- Payments (to be implemented)

---

## 2. Goals & Constraints

### Goals
1. Replace insecure custom auth (Gmail OTP + localStorage) with a robust third-party solution
2. Replace the self-hosted Express backend with Supabase infrastructure
3. Improve overall security without relying on hand-rolled backend logic

### Hard Constraints (Non-Negotiable)
- **Frontend components must not change** — all components call `apiRequest` and must continue to do so unchanged. However, if it is suitable to use Supabase's subscription feature for live updates, communicate with the developer. We are open to use it, but we want to find a solution that doesn't prevent switching out the backend (for example, with the current REST api) with no errors. That is to say, loss of that functionality is OK.
- **`@prisma/client` remains the type source of truth for the frontend** — components import types from `@prisma/client`, not from Supabase or any other source.
- **Supabase must be hidden behind the service layer** — no component or shared utility outside of `backend/supabase/` should import from `@supabase/supabase-js`
- **The migration must be backend-swappable** — if Supabase is replaced in the future, only `src/lib/api.ts` and auxiliary files in the same folder `src/lib/` should need changes

### Soft Constraints
- Keep Supabase-specific code minimal and isolated (in `backend/supabase/`)
- Prefer the Supabase SDK over Edge Functions for simple CRUD
- Use Edge Functions only for: payment processing, business logic requiring secrets, or complex multi-step operations
- Try to emulate `backend/REST/` in the layout of the Supabase services.
- It is okay to modify existing schemas, but keep to a minimum. In the case of changing column types, both MySQL and Postgres schemas should be changed to keep parity. (eg. if `id` type in a table should be changed)

---

## 3. Architectural Decisions

These decisions were made deliberately — do not deviate from them without explicit instruction.

### Decision 1: Express Server is Removed
The Express server is replaced entirely by:
- **Supabase SDK** (for simple DB operations, called directly from the frontend service layer)
- **Supabase Edge Functions** (for server-side logic — payments, secrets, complex validation)

### Decision 2: Prisma is Kept as a Type-Only Dependency in the Frontend
Prisma is NOT used for database queries anymore. It is used solely to generate TypeScript types via `npx prisma generate`. The frontend imports types from `@prisma/client` exactly as it does today. `PrismaClient` is never instantiated in the frontend. The Supabase services (source of data) in `backend/supabase/` should handle casting the data fetched from DB to Prisma types.

### Decision 3: Two `api.ts` Files, One Entry Point
```
src/lib/api.ts            ← single export, components import from here only
src/lib/REST.api.ts       ← original fetch-based implementation (kept intact)
src/lib/supabase.api.ts   ← new Supabase-based implementation (same signature)
```
Switching backends requires changing one line in `api.ts`. No component changes.

### Decision 4: Supabase Types Are Used Only Inside Service Functions
`supabase-gen` types (`Database['public']['Tables']...`) are imported only inside `backend/supabase/` for type-safe SDK queries. They never appear in `api.ts` or any component. All service functions return Prisma types.

### Decision 5: Prisma Schema Is the Single Source of Truth for Types
The Prisma schema defines the canonical data shape. Two schema files are maintained (and any more database types can be added similarily in the future):
- `backend/prisma/schema.mysql.prisma` — original, preserved for MySQL use
- `backend/prisma/schema.postgres.prisma` — active schema for Supabase (see Section 5)

The active schema is handled by `prisma.config.ts`.

### Decision 6: Type Conformance Happens at the Service Boundary
Supabase returns data that differs from Prisma types in two ways:
- `DateTime` fields → returned as ISO strings, Prisma expects `Date`
- `BigInt` ID fields → returned as `number`, Prisma expects `BigInt`

A shared `prismaConform.ts` utility handles this conversion. It is applied inside every service function before returning data.

### Decision 7: Realtime Is Out of Scope for `apiRequest`
Supabase Realtime subscriptions are event-based and cannot be modelled as request/response. If Realtime is needed in the future, it is implemented as a separate `subscribe*` function alongside `apiRequest` — never inside it. As mentioned before, I would like to take advantage of it whenever it seems suitable, but then it should be easy to switch out (even lose this functionality) when switching the backend without any errors.

---

## 4. Target Architecture

```
┌─────────────────────────────────────────────┐
│              React Components               │
│   import { apiRequest } from "@/lib/api"    │
│   import type { X } from "@prisma/client"   │
└────────────────────┬────────────────────────┘
                     │
┌────────────────────▼────────────────────────┐
│              @/lib/api.ts                   │
│   re-exports apiRequest from api.supabase   │
│   (or api.rest — one line swap)             │
└────────────────────┬────────────────────────┘
                     │
┌────────────────────▼────────────────────────┐
│          @/lib/api.supabase.ts              │
│   routes endpoint strings to services       │
│   applies normalizeEventData to all results │
│   returns Prisma types                      │
└──────┬──────────────────────┬───────────────┘
       │                      │
┌──────▼───────┐    ┌─────────▼──────────────┐
│ authService  │    │ eventService           │
│ eventService │    │ paymentService         │
│ etc.         │    │ etc.                   │
│              │    │                        │
│ Uses         │    │ Uses                   │
│ Supabase SDK │    │ supabase.functions     │
│ + gen types  │    │ .invoke(...)           │
│ internally   │    │                        │
│ Returns      │    │ Returns                │
│ Prisma types │    │ Prisma types           │
└──────┬───────┘    └─────────┬──────────────┘
       │                      │
┌──────▼──────────────────────▼──────────────┐
│              Supabase                       │
│  ┌──────────┐ ┌──────────┐ ┌────────────┐ │
│  │ Postgres │ │   Auth   │ │  Edge Fns  │ │
│  │  (RLS)   │ │  (OTP)   │ │ (Payments) │ │
│  └──────────┘ └──────────┘ └────────────┘ │
└─────────────────────────────────────────────┘
```

---

## 5. The Postgres Prisma Schema
A schema has already been made for Postgres. However, it should be modified so that use of Supabase utility and advantages is maximal. For example, registration and authentication. 

The plan is that their will be complete feature parity between the REST api and Supabase (aside from realtime subscriptions) with the finished product.

---

## 6. Implementation Steps

Each step should be implemented and verified before proceeding.

---

### Step 1 — Prisma Schema: MySQL → Postgres

**Goal**: Produce a Postgres-compatible schema that generates identical TypeScript types.

**Actions**:
1. Modify the Postgres schema `backend/prisma/prisma.postgres.schema` so that it is compatible with Supabase and it's features, but produces the same types as the mysql schema. How should we handle built-in tables?

**Evaluation**:
- `npx prisma generate` completes without errors
- TypeScript compilation passes — no type errors introduced anywhere in the frontend

---

### Step 2 — Supabase Project Setup

**Goal**: Create the Supabase project and push the schema.

**Actions**:
1. Create a new Supabase project at supabase.com
2. Install Supabase CLI: `npm install -g supabase`
3. Login: `supabase login`
4. Link project: `supabase link --project-ref <project-id>`
5. Push schema to Supabase: `supabase db push` (or `npx prisma migrate dev` with the Supabase connection string)
6. Set `DATABASE_URL` in `.env` to the Supabase Postgres connection string:
   ```
   DATABASE_URL="postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres"
   ```

**Evaluation**:
- Supabase dashboard shows all tables matching the Prisma schema
- All enums exist in Postgres (`Role`, `Gender`, `Invitation`, `Siblings`, `EventRegistrationStatus`, `EventFormFieldType`)
- All relations and indexes are present

---

### Step 3 — Generate Supabase Types

**Goal**: Produce Supabase-generated types for use inside the service layer only.

**Actions**:
1. Run:
   ```bash
   supabase gen types typescript --project-id <project-id> > src/types/supabase.ts
   ```
2. Do not import this file from any component or from `api.ts`. It is only used inside `backend/supabase/`.

**Evaluation**:
- `backend/supabase/types/types.ts` exists and contains a `Database` type
- The type contains all tables: `users` (?), `pending_signups`, `events_info`, `event_registrations`, `event_registration_profiles`, `event_form_fields`, `event_registration_field_answers`

---

### Step 4 — Supabase Client + Type Conformance Utilities

**Goal**: Create the two shared utilities used by all service files.

#### `backend/supabase/supabase.ts`
```ts
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);
```

Add to `.env`:
```
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
```

#### `backend/supabase/types/prismaConform.ts`
```ts
/**
 * Converts Supabase SDK raw output to match Prisma-generated types.
 * Supabase returns DateTime as ISO strings and BigInt IDs as numbers.
 * Prisma types expect Date objects and BigInt respectively.
 * Apply this to all data before it exits a service function.
 */
export const conformDates = <T extends Record<string, any>>(obj: T): T => {
    const result: any = {};
    for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
            result[key] = new Date(value);
        } else if (typeof value === 'number' && key === 'id') {
            result[key] = BigInt(value);
        } else if (Array.isArray(value)) {
            result[key] = value.map(conformDates);
        } else if (value !== null && typeof value === 'object') {
            result[key] = conformDates(value);
        } else {
            result[key] = value;
        }
    }
    return result as T;
};
```

**Evaluation**:
- TypeScript compiles with no errors
- `supabase` client can be imported in a test file and `supabase.from('events_info').select('*')` resolves without TypeScript errors

---

### Step 5 — Service Layer

**Goal**: Create typed service functions for each domain. Each function uses Supabase types internally and returns Prisma types externally.

#### Pattern for Every Service Function
```ts
/* relevant imports*/
import { conformDates } from ']/supabase/types/prismaConform';

type SupabaseRow = Database['public']['Tables']['table_name']['Row'];

export const service = {
    getAll: async (): Promise<PrismaType[]> => {
        const { data, error } = await supabase.from('table_name').select('*');
        if (error) throw new Error(error.message); // matches existing throw pattern in components
        return (data as SupabaseRow[]).map(conformDates) as unknown as PrismaType[];
    }
};
```

#### Authentication
Wrap Supabase Auth methods. The frontend calls these via `apiRequest('/auth/...')` — it never calls Supabase Auth directly.

Functions to implement:
- `sendOTP(email: string)` — calls `supabase.auth.signInWithOtp({ email })`
- `verifyOTP(email: string, token: string)` — calls `supabase.auth.verifyOtp({ email, token, type: 'email' })`
- `getUser()` — calls `supabase.auth.getUser()`
- `signOut()` — calls `supabase.auth.signOut()`

Note: Supabase Auth manages its own session storage securely. Do NOT use `localStorage` for the auth token. Remove `localStorage.getItem('token')` from `api.rest.ts` when that file is created in Step 7.

#### Event info
Functions to implement:
- `getAll()` — returns `events_info[]`
- `getById(id: number)` — returns `events_info`
- `create(data)` — admin only, insert into `events_info`
- `update(id, data)` — admin only
- `getFormFields(eventId: number)` — returns `event_form_fields[]`

#### Event registration
Functions to implement:
- `register(data)` — insert into `event_registrations` + `event_registration_profiles`
- `getByEvent(eventId: number)` — admin only, returns registrations with profiles
- `getByUser(userId: bigint)` — returns user's own registrations
- `submitAnswers(registrationId, answers)` — insert into `event_registration_field_answers`

#### Admin
Functions to implement:
- `getUsers()` — returns `users[]`
- `getRegistrationsWithProfiles(eventId)` — join across `event_registrations` and `event_registration_profiles`

#### Payment (skip for now)
This service invokes an Edge Function — not a direct SDK call. Stripe secret key must never appear in frontend code.

```ts
export const paymentService = {
    createCheckout: async (eventId: number, userId?: bigint) => {
        const { data, error } = await supabase.functions.invoke('create-checkout', {
            body: { eventId, userId: userId?.toString() }
        });
        if (error) throw new Error(error.message);
        return data as { url: string };
    }
};
```

**Evaluation for Step 5**:
- Each service function compiles without TypeScript errors
- Return types are verified to be Prisma types (not `any`, not Supabase types)
- Test each function individually against the live Supabase project

---

### Step 6 — `api.supabase.ts`

**Goal**: Implement the Supabase version of `apiRequest` with the identical signature to the existing implementation.

```ts
// src/lib/api.supabase.ts

/*relevant imports*/

// ---- Preserve these exactly from the original api.ts ----
const normalizeMarkdownEscapes = (text: string | null | undefined): string | null | undefined => {
    if (typeof text !== 'string') return text;
    return text
        .replace(/\\\\r\\\\n/g, '\n')
        .replace(/\\\\n/g, '\n')
        .replace(/\\\\t/g, '\t')
        .replace(/\\r\\n/g, '\n')
        .replace(/\\n/g, '\n')
        .replace(/\\t/g, '\t');
};

const normalizeEventData = (data: any): any => {
    if (!data) return data;
    if (Array.isArray(data)) return data.map(normalizeEventData);
    if (typeof data === 'object') {
        const normalized: any = {};
        for (const [key, value] of Object.entries(data)) {
            if (key === 'description' && typeof value === 'string') {
                normalized[key] = normalizeMarkdownEscapes(value);
            } else if (typeof value === 'object') {
                normalized[key] = normalizeEventData(value);
            } else {
                normalized[key] = value;
            }
        }
        return normalized;
    }
    return data;
};
// ---------------------------------------------------------

const route = async (endpoint: string, method: string, body?: any): Promise<any> => {
    // Auth
    if (endpoint === '/auth/send-otp')    return authService.sendOTP(body.email);
    if (endpoint === '/auth/verify-otp')  return authService.verifyOTP(body.email, body.token);
    if (endpoint === '/auth/user')        return authService.getUser();
    if (endpoint === '/auth/signout')     return authService.signOut();

    // Events
    if (endpoint === '/events' && method === 'GET')   return eventService.getAll();
    if (endpoint === '/events' && method === 'POST')  return eventService.create(body);
    if (endpoint.match(/^\/events\/\d+$/) && method === 'GET') {
        return eventService.getById(Number(endpoint.split('/')[2]));
    }
    if (endpoint.match(/^\/events\/\d+\/fields$/))  {
        return eventService.getFormFields(Number(endpoint.split('/')[2]));
    }

    // Registrations
    if (endpoint === '/registrations' && method === 'POST')  return registrationService.register(body);
    if (endpoint.match(/^\/events\/\d+\/registrations$/))    {
        return registrationService.getByEvent(Number(endpoint.split('/')[2]));
    }

    // Admin
    if (endpoint === '/admin/users')  return adminService.getUsers();

    // Payments
    if (endpoint === '/payments/checkout')  return paymentService.createCheckout(body.eventId, body.userId);

    throw new Error(`Unhandled route: ${method} ${endpoint}`);
};

export const apiRequest = async (endpoint: string, method: string = 'GET', body?: any) => {
    const result = await route(endpoint, method, body);
    return normalizeEventData(result);
};
```

**Important**: Map all existing Express endpoints used in the frontend to entries in `route()`. Audit every `apiRequest` call across all components to ensure full coverage before declaring this step complete.

**Evaluation**:
- Every existing `apiRequest` call in the codebase has a corresponding route entry
- No `throw new Error('Unhandled route...')` is ever hit during normal app usage
- TypeScript compiles cleanly

---

### Step 7 — Wire `api.ts` and Preserve `api.rest.ts`

**Goal**: Make `api.ts` where we seemlessly switch backends. Preserve the original implementation.


#### `src/lib/api.ts`
should always export `apiRequest`.
What is the solution for realtime subscriptions?


**Evaluation**:
- All components compile without errors (they import from `@/lib/api` — unchanged)
- Switching the export line and running the app connects to the old Express server (if still running)
- Switching back to Supabase works correctly

---

### Step 8 — Row Level Security (RLS) Policies

**Goal**: Enforce access control at the database level. This replaces Express middleware authorization.

Enable RLS on all tables first:
```sql
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE events_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_registration_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_form_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_registration_field_answers ENABLE ROW LEVEL SECURITY;
```

Minimum policies to implement:

```sql
-- Public can read published events
CREATE POLICY "Public read published events"
ON events_info FOR SELECT
USING (is_published = true);

-- Admins can do everything on events
CREATE POLICY "Admins manage events"
ON events_info FOR ALL
USING (auth.jwt() ->> 'role' = 'admin');

-- Users can read their own registrations
CREATE POLICY "Users read own registrations"
ON event_registrations FOR SELECT
USING (auth.uid()::text = user_id::text);

-- Users can insert their own registrations
CREATE POLICY "Users insert own registrations"
ON event_registrations FOR INSERT
WITH CHECK (auth.uid()::text = user_id::text OR user_id IS NULL);

-- Admins can read all registrations
CREATE POLICY "Admins read all registrations"
ON event_registrations FOR SELECT
USING (auth.jwt() ->> 'role' = 'admin');

-- Users can read their own profile
CREATE POLICY "Users read own profile"
ON users FOR SELECT
USING (auth.uid()::text = id::text);

-- Admins can read all users
CREATE POLICY "Admins read all users"
ON users FOR SELECT
USING (auth.jwt() ->> 'role' = 'admin');
```

**Evaluation**:
- Unauthenticated user can fetch published events, cannot fetch user data
- Authenticated non-admin user can fetch their own registrations, cannot fetch others'
- Admin user can fetch all registrations and users
- Attempt to read another user's data returns empty result, not an error

---

### Step 9 — Auth Migration

**Goal**: Replace custom Gmail OTP + localStorage with Supabase Auth.

**Actions**:
1. In Supabase dashboard → Authentication → Email settings: enable OTP (magic link / OTP)
2. Disable the custom email provider in your app (remove Gmail SMTP config)
3. Confirm `authService.sendOTP` and `authService.verifyOTP` work end-to-end
4. Verify that after `verifyOTP`, `supabase.auth.getUser()` returns the authenticated user
5. Verify that Supabase SDK automatically attaches the auth token to all subsequent requests (it does — this is built in, no manual header setting required)
6. Remove `localStorage.getItem('token')` and all manual `Authorization` header logic — it is no longer needed

**Guest registrations**: For event registrations without login, use Supabase anonymous auth (`supabase.auth.signInAnonymously()`) to give guests a real session

**Evaluation**:
- User can receive OTP email, enter code, and be authenticated
- `supabase.auth.getUser()` returns the correct user after authentication
- Guest registration (no login) still works
- No `localStorage` token access anywhere in the codebase

---

### Step 10 — Edge Functions: Payments (skip for now)

**Goal**: Implement Stripe checkout via Edge Function. The Stripe secret key must never appear in frontend code.

#### `supabase/functions/create-checkout/index.ts`
```ts
import Stripe from 'https://esm.sh/stripe@13';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!);
const DOMAIN = Deno.env.get('FRONTEND_URL')!;

Deno.serve(async (req) => {
    try {
        const { eventId, userId } = await req.json();

        // Fetch event price from DB here using Supabase admin client
        // ...

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'payment',
            success_url: `${DOMAIN}/events/${eventId}?payment=success`,
            cancel_url: `${DOMAIN}/events/${eventId}?payment=cancelled`,
            metadata: { eventId: String(eventId), userId: String(userId) },
            line_items: [
                {
                    price_data: {
                        currency: 'sek',
                        product_data: { name: 'Event Registration' },
                        unit_amount: 0, // replace with actual price from DB in cents
                    },
                    quantity: 1,
                }
            ],
        });

        return new Response(JSON.stringify({ url: session.url }), {
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
});
```

#### `supabase/functions/stripe-webhook/index.ts`
Handles `checkout.session.completed` — marks registration as confirmed. Uses the `metadata.eventId` and `metadata.userId` set during checkout creation.

Set secrets:
```bash
supabase secrets set STRIPE_SECRET_KEY=sk_...
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
supabase secrets set FRONTEND_URL=https://yourapp.com
```

**Evaluation**:
- `paymentService.createCheckout(eventId, userId)` returns a Stripe checkout URL
- Redirecting to that URL shows the Stripe checkout page
- Completing payment triggers the webhook and updates the registration status to `confirmed`

---

## 8. What NOT to Do

These are explicit anti-patterns for this codebase:

| Don't | Why |
|---|---|
| Import `@supabase/supabase-js` in a component | Breaks backend agnosticism |
| Import `Database` type from `supabase.ts` in a component | Same reason |
| Import Prisma types from `@prisma/client` in a service file | Services should accept/return their own layer's types |
| Instantiate `PrismaClient` in the frontend | Prisma is type-only in the frontend |
| Store auth tokens in `localStorage` | Use Supabase Auth session management |
| Put Stripe secret key in frontend code or `.env` frontend variables | Always use Edge Functions for payment processing |
| Bypass `apiRequest` and call a service function directly from a component | Breaks the abstraction and makes future swaps harder |
| Add a new backend route without a corresponding entry in `api.supabase.ts` AND `api.rest.ts` | Both implementations must stay in sync |

---


## 9. Dependency Changes

```bash
# Add
npm install @supabase/supabase-js

# Keep (type generation only — do not remove)
npm install prisma @prisma/client

# Remove (after Express server is fully decommissioned)
# express, cors, dotenv, nodemailer (or equivalent Gmail package)
# mysql2 or equivalent MySQL driver
```

---

## 10. Workflow for Adding New Features Going Forward

```
1. Add table/field to prisma/schema.postgres.prisma
2. Run: supabase db push
3. Run: npx prisma generate          (updates @prisma/client types)
4. Run: supabase gen types typescript --project-id <id> > src/types/supabase.ts
5. Add RLS policies for the new table in Supabase dashboard
6. Add service function in src/services/
7. Add route entry in src/lib/api.supabase.ts
8. Add matching route entry in src/lib/api.rest.ts (for parity)
9. Components call apiRequest as always — no changes needed there
```
