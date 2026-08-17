# REST backend: support the `recoveryMode` auth contract

## Why

The frontend was changed to close two password-reset security holes:

1. Clicking a reset link created a **full, persistent login**. Abandoning the
   reset (without setting a new password) left the visitor logged in — a
   passwordless-login bypass for anyone with inbox access.
2. Any already-authenticated user could open `/reset-password` and change the
   password with **no reset token and no re-authentication**.

The frontend fix introduces a backend-agnostic concept in `useAuth`:

- **`recoveryMode: boolean`** — true when the visitor arrived through a valid
  password-reset link.
- While `recoveryMode` is true, **`user` is `null`**. A recovery session is NOT
  an authenticated app user; it may only be used to call
  `POST /auth/update-password` once.
- After a successful password update (or if the user abandons the page),
  `signOut()` is called to destroy the recovery session, so it can never be
  reused as a login.

This is implemented for the Supabase backend today (via the
`PASSWORD_RECOVERY` auth event). The **REST backend does not yet honor this
contract** — this document describes the work needed so a future migration back
to REST (or running REST in parallel) stays secure.

## Current REST behavior (the gap)

Files: `backend/REST/middleware/authHandlers.ts`, `src/lib/REST.api.ts`,
`src/hooks/useAuth.tsx` (REST branch).

- `POST /api/auth/verify-reset` validates the emailed token and returns a
  **`generateTempAccessToken`** with `expires_in: 300` as `access_token`
  (no refresh token).
- `src/lib/REST.api.ts` → `RESTRequest` stores **any** `data.access_token` from
  **any** response via `setTokens(...)` and dispatches `auth-state-changed`.
- `useAuth` (REST branch) reacts to `auth-state-changed` by calling
  `restRefresh()` → `GET /auth/user`, and if it succeeds, sets `user`.
- Result: the 5-minute temp reset token is treated as a **normal login**, and
  `recoveryMode` stays `false`. Both original vulnerabilities still apply to
  REST:
  - The temp token is a working session for 5 minutes even if the password is
    never changed.
  - `POST /api/auth/update-password` uses `authenticateToken` on the *current*
    token, so any logged-in user (not just a recovery session) can change the
    password with no current-password check.

## Target contract for REST

The REST implementation must make `useAuth` expose `recoveryMode === true` /
`user === null` during a reset, and must ensure the recovery credential cannot
act as a general-purpose session.

### 1. Mark the reset credential as recovery-scoped

In `generateTempAccessToken` (see `backend/REST/middleware/utils.ts` /
wherever it is defined), add a claim that marks the token's purpose, e.g.:

```jsonc
{ "sub": "<user_id>", "scope": "password_reset", "exp": <now + 300s> }
```

Do **not** issue a refresh token for this credential (already the case).

### 2. Keep the recovery credential out of the normal session store

Two options — pick one and keep it consistent with the Supabase behavior:

- **Preferred:** return the recovery credential under a distinct field, e.g.
  `reset_token` (not `access_token`), so `RESTRequest`'s generic
  "store any `access_token`" path does not treat it as a login. The reset page
  would hold it in memory (React state) only.
- **Alternative:** keep returning `access_token` but tag the response
  (e.g. `recovery: true`) and special-case it in `RESTRequest` so it is stored
  under a separate key (`reset_token`) and dispatches a
  `recovery-state-changed` event instead of `auth-state-changed`.

### 3. Restrict `update-password` to the recovery scope

`POST /api/auth/update-password` must accept **only** a `scope=password_reset`
token (verify the claim), not a normal access token. This closes the
"already-logged-in user changes password with no token" hole on the server
side. (A separate, authenticated "change password while logged in" endpoint
that requires the current password is tracked separately — frontend fix #4,
deferred.)

Invalidate the reset token immediately after a successful update
(`password_reset_tokens.deleteMany`) so it cannot be replayed.

### 4. Wire `recoveryMode` into `useAuth` (REST branch)

In `src/hooks/useAuth.tsx`, the REST branch currently only tracks
`auth-state-changed`. Add handling so that:

- When a recovery credential is present (e.g. `reset_token` in memory/storage,
  or a `recovery-state-changed` event fired by `RESTRequest`), set
  `recoveryMode = true` and `user = null` — mirroring the Supabase branch's
  `applySession()` recovery path.
- `restSignOut()` must clear the recovery credential (`reset_token`) and reset
  `recoveryMode = false`, matching `supabaseSignOut`.

The page-level code (`ResetPassword.tsx`) already consumes only `recoveryMode`
and `signOut()`, so **no page changes are needed** once the REST branch honors
the contract.

## Acceptance criteria

- Verifying a REST reset link yields `recoveryMode === true` and `user === null`
  (visitor is not treated as authenticated anywhere in the app).
- Navigating away from `/reset-password` without submitting destroys the
  recovery credential (frontend already calls `signOut()` on unmount).
- `POST /api/auth/update-password` rejects a normal access token and accepts
  only a `password_reset`-scoped credential.
- After a successful reset, the recovery credential is invalidated server-side
  and the user is forced to log in with the new password.

## Out of scope (tracked elsewhere)

- Frontend fix #4: a dedicated authenticated "change password" flow that
  requires the current password. Deferred per request.
- Reworking/removing the legacy `token_hash` query-param path.
