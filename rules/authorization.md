# Authorization & Authentication Standards

---

## 1. Authentication Layer

All authentication logic MUST live in **`src/lib/auth.ts`**. DO NOT implement custom JWT, cookie, or session handling anywhere else.

### Key Functions

| Function | Purpose |
|---|---|
| `authenticateUser(email, password)` | Validates credentials against `users` table (bcrypt) |
| `createSession(user: { id, displayName, role })` | Signs JWT (HS256) and sets httpOnly cookie `family_session` (30-day expiry) |
| `verifySession()` | Validates JWT from cookie, returns payload or `null` |
| `getDisplayName()` | Extracts `displayName` from session — **throws** if unauthenticated |
| `destroySession()` | Deletes the session cookie |

### JWT Payload

The signed token contains: `userId`, `displayName`, `role`.

### Environment Variables

- `SESSION_SECRET` — used to sign/verify JWTs. Must be a strong random string.

---

## 2. Route Protection

**`middleware.ts`** enforces authentication at the route level.

- All routes are protected **except** `/login` and `/api/auth/login`.
- Static files and Next.js internals are excluded automatically.
- **Adding a new public route requires updating the middleware matcher** — do not bypass middleware in any other way.
- Login endpoint: `app/api/auth/login/route.ts` (POST) — the only auth-related API Route.

---

## 3. Ownership Model

Resources are owned by **`displayName`** (a string), not a numeric user ID.

- `recipes.uploadedBy` — stores the recipe owner's display name (e.g., "אמא", "יעל").
- `familyNotes.author` — stores the note author's display name.
- Identity MUST always be derived server-side via `getDisplayName()` — **never trust client-supplied identity**.

---

## 4. Authorization in Server Actions

Every mutating Server Action MUST enforce authorization:

1. Call `getDisplayName()` at the top of the action.
2. For **create** operations: use the returned `displayName` as `uploadedBy` / `author`.
3. For **update/delete** operations: fetch the resource from the database, compare its owner field with the current user **before** any mutation.
4. On authorization failure, return `{ success: false, error: "אין לך הרשאה..." }`.

```ts
const result = await getRecipeById(id);
if (!result.success) {
  return { success: false, error: "המתכון לא נמצא" };
}

const currentUser = await getDisplayName();
if (result.data.uploadedBy !== currentUser) {
  return { success: false, error: "אין לך הרשאה לערוך מתכון זה" };
}
```

- Zod validates **shape**, not **permissions** — authorization checks are always separate.
- Ownership checks must query the database — never rely on cached or client-provided data.

---

## 5. Role System

- The `users.role` field exists (default: `"member"`) and is included in the JWT payload.
- `users.isActive` field (default: `1`) controls account activation status. Included in JWT payload.
- Two roles: `"admin"` and `"member"`.
- Admin-only routes live under `/admin/*` and are protected at three layers:
  1. **Middleware** — checks `payload.role === "admin"`, redirects non-admins to `/`.
  2. **Admin layout** (`app/admin/layout.tsx`) — defense-in-depth role check via `verifySession()`.
  3. **Server Actions** — every admin action calls `requireAdmin()` which throws if not admin.
- Inactive users (`isActive === 0`) are blocked at middleware level (cookie deleted, redirect to `/login`) and at login time.
- Use `requireAdmin()` from `src/lib/auth.ts` in all admin Server Actions.
- Admin cannot self-demote (remove own admin role), self-deactivate, or self-delete.

---

## 6. Anti-Patterns

- **DO NOT** pass `displayName` from the client to a Server Action — always derive it from `getDisplayName()`.
- **DO NOT** skip ownership checks on update/delete operations.
- **DO NOT** expose JWT contents or the session secret to the client.
- **DO NOT** use API Routes for data mutations — use Server Actions. API Routes are reserved for auth and file uploads only.
