

# Plan: Fix Role Persistence with Backend Storage and Auth0 Audience Configuration

## Problem Summary

There are two related issues causing the dashboard to behave incorrectly:

1. **Role resets on page refresh/navigation**: The selected role (Artist/Company) is stored in React state, which resets whenever the page reloads or the user navigates.

2. **Auth0 access token not configured for backend API**: Without the `audience` parameter, Auth0 returns an opaque token that your backend cannot validate, causing API calls to fail.

## Solution Overview

We'll implement a complete fix by:
- Storing user roles in your backend database (persisted across sessions)
- Configuring Auth0 to issue valid JWT access tokens for your backend API
- Fetching the role on app load and keeping the UI in sync

---

## Technical Implementation

### Step 1: Database Schema for User Roles

Create a `user_profiles` table to store the user's role, linked to their Auth0 user ID:

```sql
-- Create enum for user roles
CREATE TYPE public.user_role AS ENUM ('artist', 'company');

-- Create profiles table
CREATE TABLE public.user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth0_sub TEXT UNIQUE NOT NULL,
  role user_role NULL,
  email TEXT,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- RLS policies - users can only access their own profile
-- (Backend validates auth0_sub from JWT)
```

### Step 2: Backend API Integration

Add two new API endpoints to your existing backend (`apiClient.ts`):

```text
GET  /api/v1/user/profile  -> { role, email, name, auth0_sub }
PUT  /api/v1/user/profile  -> { role } (sets the user's role)
```

The frontend will:
- Call `GET /api/v1/user/profile` after login to check if user has a role
- Call `PUT /api/v1/user/profile` during onboarding to set the role

### Step 3: Auth0 Audience Configuration

Update `Auth0Provider.tsx` to include the `audience` parameter:

```tsx
authorizationParams={{
  redirect_uri: window.location.origin,
  audience: import.meta.env.VITE_AUTH0_AUDIENCE, // Your backend API identifier
}}
```

This ensures Auth0 returns a JWT that your backend can validate.

### Step 4: Updated Auth Flow

```text
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Login     │────▶│  Auth0      │────▶│  Get Token  │────▶│  Fetch Role │
│   Page      │     │  Redirect   │     │  + Set API  │     │  from API   │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
                                                                   │
                           ┌───────────────────────────────────────┼───────┐
                           │                                       ▼       │
                           │   Has Role?                                   │
                           │   ├── YES → Navigate to Dashboard             │
                           │   └── NO  → Navigate to Onboarding            │
                           └───────────────────────────────────────────────┘
```

### Step 5: AuthContext Changes

Update `AuthContext.tsx` to:

1. Fetch user profile from backend after authentication
2. Store role in state from API response
3. Send role update to backend during onboarding

```tsx
// After getting access token
useEffect(() => {
  const fetchUserProfile = async () => {
    if (auth0IsAuthenticated) {
      const token = await getAccessTokenSilently();
      apiClient.setAccessToken(token);
      
      try {
        const profile = await apiClient.getUserProfile();
        setRoleState(profile.role);
      } catch (err) {
        // Profile doesn't exist yet - that's okay, user will onboard
        setRoleState(null);
      }
    }
  };
  fetchUserProfile();
}, [auth0IsAuthenticated]);
```

### Step 6: Onboarding Update

Update `Onboarding.tsx` to save role to backend:

```tsx
const handleContinue = async () => {
  setIsSubmitting(true);
  
  // Save role to backend
  await apiClient.updateUserProfile({ role: selectedRole });
  
  // Update local state
  setRole(selectedRole);
  
  // Navigate to dashboard
  navigate(selectedRole === 'artist' ? '/artist/artworks' : '/company/scan');
};
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/providers/Auth0Provider.tsx` | Add `audience` to authorizationParams |
| `src/services/apiClient.ts` | Add `getUserProfile()` and `updateUserProfile()` methods |
| `src/contexts/AuthContext.tsx` | Fetch role from API on login, add loading state for role fetch |
| `src/pages/Onboarding.tsx` | Save role to backend before navigating |
| `.env` | Ensure `VITE_AUTH0_AUDIENCE` is set (you confirmed you have this) |

---

## Auth0 Dashboard Action Required

You mentioned you have an Auth0 API Identifier (audience). Make sure:

1. The `VITE_AUTH0_AUDIENCE` environment variable is set to your API Identifier
2. Your backend validates tokens against this same audience

---

## Backend Endpoint Expectations

Your backend at `http://149.28.127.248` needs these endpoints:

| Endpoint | Method | Request | Response |
|----------|--------|---------|----------|
| `/api/v1/user/profile` | GET | — | `{ auth0_sub, role, email, name }` |
| `/api/v1/user/profile` | PUT | `{ role: "artist" \| "company" }` | `{ success: true }` |

**Does your backend already have these endpoints, or should I include instructions to add them?**

---

## Expected Behavior After Fix

1. User logs in via Auth0
2. Frontend fetches user profile from backend
3. If role exists → Navigate directly to correct dashboard
4. If role is null → Navigate to Onboarding
5. After selecting role in Onboarding → Role is saved to backend
6. On future logins (any device/browser) → Role is remembered

