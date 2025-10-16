# Firebase Authentication Setup in MotiList App

This document outlines how Firebase Authentication has been implemented in the MotiList application. The authentication system ensures that only logged-in users can access the dashboard and other application features.

## Authentication Structure

1. **Authentication Context & Provider**
   - Located in `src/context/AuthContext.jsx`, `src/context/AuthProvider.jsx`, and `src/context/useAuth.jsx`
   - Manages the authentication state across the application
   - Provides current user information to any component that needs it

2. **Protected Routes**
   - Located in `src/components/ProtectedRoute.jsx`
   - Prevents unauthorized access to application routes
   - Redirects unauthenticated users to the login page

3. **Login Component**
   - Located in `src/components/Login.jsx`
   - Provides user login and registration functionality
   - Supports email/password and Google sign-in

4. **Firebase Authentication Methods**
   - Located in `src/firebaseUtils.js`
   - Handles user signup, login, and logout operations

## How Authentication Works

1. When the application starts, the `AuthProvider` checks if a user is already logged in using Firebase's `onAuthStateChanged` listener.
2. If no user is logged in, any attempt to access protected routes redirects to the login page.
3. Once logged in, the user can access the dashboard and all application features.
4. The authentication state is maintained throughout the session.
5. The logout button in the sidebar or mobile header allows users to sign out.

## Authentication Flow

```
App.jsx (Router)
  ├── /login route -> Login Component
  └── / route -> Protected Route 
       └── MainLayout (Dashboard, Calendar, etc.)
```

## Authentication Methods

1. **Email & Password Authentication**
   - Users can register with email and password
   - Returning users can log in with credentials
   - Password reset functionality (to be implemented)

2. **Google Authentication**
   - One-click login with Google account
   - Creates a new user account if first-time login

## Security Considerations

- Firebase Authentication handles secure token storage and validation
- Firestore security rules are set to allow data access only to authenticated users
- Protected routes prevent UI access for unauthenticated users
- Authentication state is monitored in real-time

## Future Enhancements

- Add password reset functionality
- Implement email verification
- Add additional social login providers (e.g., Facebook, GitHub)
- User profile management
- Role-based access control