# MotiList - Firebase Integration Guide

This guide will help you set up Firebase for the MotiList application, enabling cloud storage for tasks and user authentication.

## Prerequisites

1. You need a Google account to create a Firebase project
2. Node.js and npm installed on your system
3. The MotiList application code

## Setting up Firebase

### Step 1: Create a Firebase Project

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter a project name (e.g., "MotiList")
4. Enable Google Analytics if desired
5. Click "Create project"

### Step 2: Register Your Web App

1. On your Firebase project dashboard, click the web icon (</>) to add a web app
2. Register your app with a nickname (e.g., "MotiList Web")
3. Check "Also set up Firebase Hosting" if you plan to deploy the app
4. Click "Register app"
5. You'll see Firebase configuration details. Keep this page open.

### Step 3: Configure the Environment Variables

1. In the MotiList project directory, create a `.env` file (or edit if it exists)
2. Add the following variables with values from your Firebase configuration:

```
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Google OAuth Client ID (if you're using Google Sign-In)
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
```

### Step 4: Set Up Authentication in Firebase Console

1. In the Firebase console, navigate to "Authentication"
2. Click "Get started"
3. Enable the "Email/Password" provider
4. If you want Google authentication, also enable the "Google" provider
5. For Google auth, you'll need to configure the OAuth consent screen in Google Cloud Console

### Step 5: Set Up Firestore Database

1. In the Firebase console, navigate to "Firestore Database"
2. Click "Create database"
3. Choose either "Production mode" or "Test mode" (start with Test mode for development)
4. Select a location for your database
5. Click "Enable"

### Step 6: Create Firestore Security Rules

1. In the Firestore Database section, navigate to the "Rules" tab
2. Update the rules to:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users to read and write their own tasks
    match /tasks/{taskId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }
    
    // Allow authenticated users to read and write their own user profile
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Running the Application

1. Install dependencies if you haven't already:

     ```bash
     npm install
     ```
  
  2. Start the development server:
  
     ```bash
     npm run dev
     ```

```
2. Start the development server:

   ```bash
   npm run dev
   ```

3. Open the application in your browser at the URL shown in the terminal

## Firebase Features Implemented

The MotiList application now uses these Firebase features:

1. **Authentication**: Email/password and Google sign-in
2. **Firestore Database**: Storing and synchronizing tasks across devices
3. **Security Rules**: Ensuring users can only access their own data

## Troubleshooting

- If you see authentication errors, check that your Firebase API key and configuration are correct
- If tasks aren't saving to Firestore, verify your security rules allow writing to the tasks collection
- For CORS issues with authentication, ensure your domain is added to the authorized domains in Firebase Authentication settings

## Next Steps

- Implement user profile management
- Add real-time updates for collaborative task management
- Set up Firebase Functions for server-side operations
- Add offline support with Firestore persistence
