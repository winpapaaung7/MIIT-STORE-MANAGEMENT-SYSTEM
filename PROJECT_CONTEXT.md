# MIIT Store Management System — Project Context

## Purpose

MIIT Store Management System tracks institutional assets and their locations. It supports item inventory, departments and rooms, QR-code lookup, transfers, and laptop-rental records.

## Application structure

- `client/` is the React, TypeScript, and Vite web application.
- `server/` is the Express and TypeScript API.
- `server/prisma/schema.prisma` defines the MySQL database schema.
- `scanner_app/` is the mobile scanner application.

## Access roles

| Role | Main access |
| --- | --- |
| `ADMIN` | Full system administration, including user management. |
| `DEPARTMENT_HEAD` | Read access within the assigned department and transfer-related work. |
| `LAPTOP_RENTAL` | Laptop rental, students, teachers, and related records. |

The server is the authority for permissions. The client sidebar and protected routes only present the correct UI for the authenticated role.

## Authentication flow

1. A user submits an email address and password on `LoginPage`.
2. The server validates the account and sends a six-digit OTP to the registered email address.
3. `OtpVerificationPage` submits the OTP to the server.
4. After successful verification, the server returns a short-lived access token and stores an opaque refresh-token hash in the database.
5. The browser keeps the refresh token only in the HTTP-only `miit_refresh` cookie. `AuthContext` uses `/api/auth/refresh` when the application starts to restore a valid session.
6. Logout, password reset, a revoked token, an inactive account, or expiry removes access.

## Token lifetime policy

- Access token: 15 minutes.
- Email OTP: 5 minutes by default (`OTP_EXPIRES_MINUTES`).
- Refresh session: 30 days by default (`AUTH_REFRESH_TOKEN_DAYS`).

The refresh token is rotated whenever a session refresh occurs. Its original expiry date is retained, so opening or refreshing the application does **not** extend the session beyond 30 days. The user must complete email OTP login again after that limit.

## Current change context

The recent changes focus on making the authentication flow readable, reliable, and role-aware:

- Formatted the auth context, sidebar, protected route, login, OTP, and user-management pages into standard readable TSX.
- Kept the OTP as a short-lived email-verification step rather than extending it to one month.
- Changed the authenticated refresh session from the previous fixed 7-day value to a configurable 30-day value.
- Added `AUTH_REFRESH_TOKEN_DAYS="30"` to `server/.env.example`.
- Preserved the original refresh-token expiry when rotating a token, enforcing an absolute one-month session limit.

## Required environment configuration

Copy `server/.env.example` to `server/.env` and provide real database, token-secret, and SMTP values. To use the one-month default explicitly, include:

```env
AUTH_REFRESH_TOKEN_DAYS="30"
```

After editing server environment settings, restart the server. Existing sessions keep the expiry recorded when they were issued; newly authenticated sessions use the updated duration.

## API URL development setup

The React client reads its API origin from `VITE_API_BASE_URL`. Copy
`client/.env.example` to `client/.env` and use a URL without a trailing slash:

```env
VITE_API_BASE_URL="http://localhost:5000"
```

When the React app runs on another device, set this value to the computer's
reachable LAN URL, for example `http://YOUR_SERVER_IP:5000`. Include that
client origin in the server's `CLIENT_ORIGIN` setting.

The Flutter scanner reads `API_BASE_URL` only from a compile-time Dart define.
It falls back to `http://localhost:5000` for local desktop development. A
physical phone must use the server's reachable LAN URL:

```bash
cd scanner_app
flutter run --dart-define=API_BASE_URL=http://YOUR_SERVER_IP:5000
```

The scanner continues to use the server's intentionally public, read-only
`/api/accessories/by-code/:code` endpoint; no browser cookie is required for
that lookup.
