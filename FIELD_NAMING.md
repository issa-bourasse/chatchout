# Authentication and API Implementation

## Authentication Flow Overhaul

### Authentication Architecture
We've completely redesigned the authentication flow to work reliably in a serverless environment:

1. **Authentication Middleware** (`auth-middleware.js`):
   - Extracts token from Authorization header
   - Verifies JWT signature
   - Handles both `id` and `userId` fields in token payload
   - Connects to database to validate user exists
   - Returns the user object if authenticated, null otherwise

2. **Auth Endpoints**:
   - `fixed-register.js`: User registration with proper field handling
   - `fixed-login.js`: User login with JWT token generation
   - `fixed-logout.js`: User logout with online status update
   - `auth-test.js`: Debug endpoint to verify token validity

### API Endpoints
All API endpoints now follow a consistent pattern:
1. Connect to MongoDB first
2. Call the auth middleware to authenticate the user
3. Process the request if authentication succeeds
4. Return appropriate response

## Common Authentication Issues Fixed

1. **Token Payload Consistency**:
   - Tokens now consistently use `{ id: user._id }` in the payload
   - Auth middleware handles legacy tokens with either `id` or `userId` fields

2. **Authentication in Serverless Functions**:
   - Middleware adapted for both Express and serverless environments
   - Clear separation between auth verification and route handling

3. **CORS Handling**:
   - All endpoints use the allowCors wrapper
   - Proper OPTIONS handling for preflight requests

4. **Database Connection**:
   - Each handler establishes its own MongoDB connection
   - Connection state is properly managed

## Debugging Authentication
Use the `/api/auth/test` endpoint to check token validity without accessing the database. This helps isolate JWT issues from database access issues.

## MongoDB Document Example
```json
{
  "_id": "...",
  "name": "User Name",
  "email": "user@example.com",
  "password": "hashed_password",
  "bio": "",
  "isOnline": false,
  "avatar": "https://ui-avatars.com/api/?name=User%20Name&background=3b82f6&color=fff&size=128",
  "lastSeen": "2025-08-01T10:08:38.277Z",
  "friends": [],
  "blockedUsers": [],
  "createdAt": "2025-08-01T10:08:38.282Z",
  "updatedAt": "2025-08-01T10:08:38.282Z"
}
```
