# Presence

Presence is a React + Vite app for UNC AKPsi chapter operations. It supports approved-member authentication, event creation, location-based check-ins, excusal requests, leaderboard visibility controls, member management, and analytics.

## Tech Stack

- React + Vite
- Firebase Authentication
- Cloud Firestore
- Google Maps JavaScript API / Places library for event location search

## Required Environment Variables

Copy `.env.example` to `.env` locally and fill in the Vite environment variables. Do not commit real values.

```env
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_browser_key
```

`VITE_GOOGLE_MAPS_API_KEY` is only needed for Google Places location autocomplete in event creation. The key should be restricted in Google Cloud to your allowed domains and to the Maps JavaScript and Places APIs.

## Local Development

```bash
npm install
npm run dev
```

## Production Build

```bash
npm run build
npm run preview
```

## Firebase Setup

1. Create a Firebase project.
2. Add a Web app and copy the Firebase config values into `.env`.
3. Enable Firebase Authentication with Email/Password.
4. Create a Cloud Firestore database.
5. Create approved member records in the `members` collection before users create accounts.
6. Add authorized domains in Firebase Authentication settings for local and deployed URLs.

The app expects member document IDs to be normalized lowercase emails, for example:

```text
members/onyen@unc.edu
```

Required member fields:

```js
{
  name: "Member Name",
  email: "onyen@unc.edu",
  role: "super-admin",
  accessStatus: "approved",
  status: "active",
  pledgeClass: "Delta",
  family: "Fireball",
  totalPoints: 0,
  eventsAttended: 0
}
```

## Firestore Collections

- `members`
- `events`
- `checkIns`
- `excusalRequests`
- `appSettings`

## Deployment Notes

- Do not commit `.env`.
- Set the same environment variables in your deployment provider.
- Review `firestore.rules`, then deploy them with Firebase CLI before real members use the app.
- Restrict the Google Maps API key by HTTP referrer and API.
- Empty Firestore collections should show empty states in production, not mock data.

## Pre-Deployment Checks

```bash
npm run lint
npm run build
npm run preview
```

Manual smoke tests:

- approved member login
- pending/denied/unlisted member rejection
- admin event create/edit/delete
- member check-in with location verification
- excusal submission and review
- leaderboard visibility
- member import/management
- analytics and dashboard updates from Firestore data
