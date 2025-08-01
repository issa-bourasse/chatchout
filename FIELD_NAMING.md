# Field Naming in Frontend vs Backend

## Issue
The frontend and backend have mismatches in field naming conventions:
- Frontend uses `name` in the registration form
- Backend expects `username` in the registration endpoint

## Solution
A field mapping handler has been created to solve this issue without needing to change the frontend code.

### Implementation
1. Created `fixed-register.js` in the server/api directory that:
   - Accepts requests from the frontend with the `name` field
   - Maps the `name` field to `username` before passing to the backend logic
   - Returns the appropriate response back to the frontend

2. Updated `vercel.json` to route registration requests to this new handler:
   ```json
   {
     "src": "/api/auth/register",
     "dest": "/api/fixed-register.js"
   }
   ```

## Best Practices Going Forward
When developing frontend and backend components:
1. Agree on consistent field naming conventions before development
2. Document API contracts including required field names
3. Use validation on both ends to ensure data integrity
4. Consider using TypeScript interfaces/types shared between frontend and backend

## Other Potential Field Mismatches
Check for similar field naming inconsistencies in other endpoints:
- Login form
- Profile update forms
- Message/chat creation
- Video call endpoints

If similar issues are found, consider using the same mapping approach or updating the frontend to match the backend expectations.
