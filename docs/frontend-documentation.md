# Frontend Documentation

This document provides a comprehensive overview of the frontend architecture for the LUMS website. The frontend is a modern Single Page Application (SPA) built using **React 18 and Vite**, incorporating robust state management, routing, and a custom design system.

## Architecture Overview

The frontend architecture prioritizes modularity, utilizing strict type safety with TypeScript and a utility-first styling approach with Tailwind CSS.

### Directory Mapping
- **`src/pages/`**: Contains the top-level route views (e.g., `Home.tsx`, `Login.tsx`, `Signup.tsx`, `Events.tsx`, `AdminDashboard.tsx`). Each file corresponds directly to a URL route in the application.
- **`src/components/`**: Divided into contextual subdirectories:
  - `ui/`: Core reusable primitive components (e.g., `Button`, `Input`, `Card`). Built natively using Radix UI primitives and styled with generic Tailwind classes (often known as the Shadcn UI approach).
  - Feature-specific directories (e.g., `admin/`, `events/`, `membership/`): Complex, composite components mapped directly to their parent pages.
  - Global generic components like `Navbar.tsx` and `Footer.tsx`.
- **`src/lib/`**: Contains core utilities. Most notably `api.ts`, which acts as the wrapper for all external backend communication, automatically handling Bearer token injection and JSON parsing.
- **`src/hooks/`**: Custom React hooks for encapsulating complex state or UI logic.

---

## 1. Routing & Navigation

Navigation is handled entirely client-side via **React Router DOM v6**.
- The app utilizes a declarative routing tree mapped to the `pages/` directory.
- **Protected Routes**: Certain routes (like `/admin`) are fundamentally protected. While the backend strictly enforces authorization at the data layer, the frontend router ensures users who aren't explicitly marked with a `role: 'admin'` in their decoded local session data are bounced back to the homepage or login screen.

---

## 2. API Communication & State Management

### 2.1 The `apiRequest` Interceptor
To standardize external queries, the frontend utilizes a heavily customized fetch wrapper (found in `lib/api.ts`).
1. **Endpoint Resolution**: It resolves the base URL seamlessly using `VITE_API_URL` from the `.env` configuration.
2. **Authorization Headers**: The wrapper automatically retrieves the user's `token` (JWT) from `localStorage` and injects an `Authorization: Bearer <token>` header into outgoing requests.
3. **Error Normalization**: It standardizes error payloads. If the backend throws a 401 Unauthorized or 403 Forbidden, the interceptor provides a clean Error object that the UI can catch to display generic toast notifications or automatically trigger logouts.

### 2.2 Form State Management (`react-hook-form` & `zod`)
Due to the complex nature of the platform's user input (such as dynamic event forms), standard controlled React state is insufficient.
- The platform uses **React Hook Form** to handle uncontrolled input rendering, drastically boosting rendering performance across massive forms (like the multi-step event forms).
- Validation is offloaded entirely to **Zod schema strict typing**.
  - Example: On `/signup`, a Zod schema enforces that the email parameter strictly matches the regex `/^[a-zA-Z0-9.-]{5,}@student\.lu\.se$/`. If a user attempts to input a standard Gmail, the Zod parser immediately blocks form submission locally, displaying an error message beneath the input field without ever pinging the server.

---

## 3. The Design System & UI

### 3.1 Utility-First Styling (Tailwind)
All styling logic relies on Tailwind CSS (`tailwind.config.ts`).
- **CSS Variables**: The root `index.css` defines a strict set of global CSS Variables (`--primary`, `--background`, `--muted`).
- **Dark Mode Support**: Because utility mappings reference generic CSS variables (`bg-background` instead of `bg-white`), dark mode toggling is achieved trivially by swapping the `.dark` class on the root HTML document, which seamlessly reverses the HSL variables.

### 3.2 Accessible Primitives (Radix UI)
Components in `components/ui/` heavily rely on `@radix-ui/react-*`. The implementation logic:
- Ensures proper WAI-ARIA compliance (e.g., screen readers perfectly understand when the Navigation Menu opens, or what options are inside a Select box).
- Handles complex browser interactions (like focus trapping inside dialog modals, or closing a popover when clicking outside of it) without writing custom heavy JS.

---

## 4. Feature Flow: The Event Dynamic Rendering

One of the most complex loops happening locally is the Dynamic Form Rendering on the `/events` page.
1. A user clicks "Register" on an event.
2. The frontend triggers `apiRequest` to fetch the custom `event_form_fields` associated with that specific database ID.
3. The component maps over the array of dynamic fields. Using a unified `DynamicFieldRenderer`, it checks the `field.field_type` (e.g., `SHORT_TEXT`, `SINGLE_CHOICE`, `MULTIPLE_CHOICE`).
4. It dynamically mounts the correct Shadcn UI elements (Inputs, Radio Boxes, Select Menus) defined by the DB. 
5. When the user clicks exactly one Submit button, React Hook Form collates the dynamic answers, transforms the dictionary into the typed JSON the backend strictly requires, and pushes the payload containing their entire custom snapshot to the server.

---

## 5. Third-Party Integrations
- **Stripe Checkout**: Rather than handling card details natively, the frontend uses `@stripe/react-stripe-js`. It utilizes the `loadStripe` wrapper to safely execute redirect flows to hosted Stripe Checkout sessions based on server-side checkout `session_id` tokens.
