# PROJECT SUMMARY — Presence (UNC AKPsi)

Purpose

Presence is designed to streamline chapter operations: track member attendance, simplify check-ins, surface engagement analytics, and provide admins tools for member management and excusal handling.

Core features

- Secure Google Sign-In with UNC domain enforcement and admin allowlist
- Firestore data model with `members`, `events`, `checkIns`, `excusalRequests`, and `appSettings`
- Member check-in flow with duplicate prevention and location verification
- QR code generation for events and camera-based QR scanning for quick check-ins
- Admin dashboard with computed engagement scores and at-risk member identification
- Analytics dashboard with charts for attendance trends, event-type breakdown, and engagement distribution
- Admin tools for member CRUD, event management, and excusal approvals

Next steps (priority)

1. Polish Analytics charts and add filtering (date ranges, pledge class)
2. Add CSV export and scheduled reports for officers
3. Integrate QR check-in signatures to prevent forged QR images
4. Harden security rules for Firestore (enforce role-based access)
5. Add unit/integration tests and CI pipeline

Contact

For questions about design decisions or to request new features, open an issue or contact the project owner in the repo.
