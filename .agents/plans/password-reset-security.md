# Password reset / change — security posture & accepted risk

Status: **Accepted risk for now** (2026-08-17). Revisit if the account-takeover
threat model changes (e.g. more admins, higher-value data).

## The concern

Password changes go through `supabase.auth.updateUser({ password })`, which by
default succeeds for **any authenticated session** and does **not** require the
current password. Two consequences were raised:

1. The Supabase recovery ("forgot password") link establishes a **full session**,
   so clicking it logs the user in. Abandoning the reset leaves them logged in.
2. Anyone with a valid session can change the password — no reset token, no
   current-password check. Primary threat: **an unattended, unlocked, signed-in
   device.** Someone changes the password and gains *permanent* access. Impact is
   worse for users with the `admin` role.

## What was actually changed (client-side only)

Files: `src/hooks/useAuth.tsx`, `src/pages/ResetPassword.tsx`.

- `useAuth` exposes a backend-agnostic `recoveryMode`. For Supabase, a session
  arriving via `PASSWORD_RECOVERY` (or a `type=recovery` URL captured at module
  load) is flagged as recovery and **not** surfaced as a logged-in `user`.
- `ResetPassword` renders the form **only** when `recoveryMode` is true. A normal
  logged-in user visiting `/reset-password` now sees "invalid/expired link" — no
  form. It also calls `signOut()` after a successful reset and on abandon.

Effect: the **casual UI path** ("just navigate to `/reset-password` and change
the password while logged in") is closed.

## Known, accepted limitation

These are **client-side UX controls, not a security boundary.** They do not stop
a deliberate actor:

- With a valid session, anyone can still change the password by calling the API
  directly — Supabase: `PUT /auth/v1/user` with `{ "password": ... }`; REST:
  `POST /api/auth/update-password` (behind `authenticateToken`). No page, no
  reset token, no old password required.
- This requires **curl or browser dev tools** — more effort and intent than
  clicking through the UI.

**Decision:** accept this for now. Rationale:
- The UI no longer offers the action, so accidental/casual change is prevented.
- Exploiting the residual requires curl/dev-tools on an unlocked, signed-in
  device.
- If an attacker has unattended access to an unlocked device for that long, the
  account is already compromised regardless of password gating (see below), and
  that is considered the user's responsibility.

## Important framing (why this is "accept for now" and not "unfixed")

An attacker at an unlocked, signed-in device **already has full access to the
account for the life of that session** — including admin actions and reading
data — just by using the app normally. Blocking the password change only
prevents them from establishing *durable* access beyond that session. The
initial exposure is the unattended unlocked device itself, not the
password-change endpoint.

## Why Supabase's built-in setting does NOT fully solve it

Supabase's **"Secure password change"** toggle is a **24-hour recency gate**: it
allows a password change only if the user signed in within the last 24 hours. It
does **not** require a fresh email code or the current password.

- For the exact threat here (a user who *just* signed in and left the device),
  the session is recent, so the change is still allowed. → does not close the
  hole for recently-active sessions; it only blocks stale (>24h) sessions.
- Note: an earlier suggestion in discussion described this setting as an emailed
  reauthentication nonce required on every change. That was incorrect — the
  dashboard behavior is the recency gate described above.

There is **no built-in Supabase toggle** that enforces "every password change
requires fresh proof (email code or current password)."

## Options for the future (if we decide to actually close it)

1. **Enable "Secure password change" (24h recency).** Free, strictly better than
   nothing (blocks stale sessions), but does not cover recently-active sessions.
2. **Shorten session / JWT lifetime + refresh behavior.** The more fundamental
   lever: bounds how long any captured/unattended live session stays usable —
   for password changes and everything else. Recommended especially for admins.
3. **Custom server-side reset flow (fully realizes the intended model).** A
   Supabase Edge Function using the Admin API
   (`auth.admin.updateUserById(id, { password })`) plus our own single-use,
   short-lived reset token: the link never issues a browser session, and a
   password change is impossible without a valid reset token. This is essentially
   what the REST backend already does — see `rest-recovery-mode.md`. Downside:
   token lifecycle, rate-limiting, and email delivery to maintain.

## Verification of current state

- `npm run build` (vite) passes.
- `npx tsc -p tsconfig.app.json --noEmit`: only 2 pre-existing errors
  (`supabase.api.ts:260`, `Events.tsx:13`), unrelated to these changes.
- To confirm the residual: from a session signed in minutes ago, a direct
  `PUT /auth/v1/user` password change succeeds (expected under current config).

## Related

- `rest-recovery-mode.md` — REST backend work to honor the `recoveryMode`
  contract if/when REST is used again.
