# Project Summary: Presence

Presence helps UNC AKPsi manage chapter attendance and member engagement.

## Core Features

- Firebase Email/Password authentication
- Approved-member access through Firestore `members`
- Role-based access for member, admin, sub-admin, and super-admin users
- Event creation and editing with Google Places location lookup
- Location-verified check-ins for Chapter, Service, and Professional Development events
- Excusal request submission and standards review
- Leaderboard visibility controls
- Member management with CSV import
- Operations, standards, and analytics dashboards

## Current Data Model

- `members`: approved roster, roles, profile details, class/family, status
- `events`: event details, type, time, points, required status, location metadata
- `checkIns`: member attendance records and points awarded
- `excusalRequests`: submitted and reviewed excusals
- `appSettings`: app-level settings such as leaderboard visibility

## Production Notes

- Production behavior should use real Firebase/Firestore data.
- Mock/demo data should not appear in production.
- Firebase config is loaded from Vite environment variables in `src/lib/firebase.js`.
- Google Places uses `VITE_GOOGLE_MAPS_API_KEY` when configured.
- Firestore security rules are versioned in `firestore.rules` and should be reviewed/deployed before public use.
