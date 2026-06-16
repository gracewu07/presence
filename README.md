# Presence — UNC AKPsi chapter app

Presence is a mobile-first React + Vite application for managing event attendance, member engagement, and chapter operations for UNC AKPsi.

Quick start

1. Install dependencies

```bash
npm install
```

2. Add Firebase config

Create `src/firebaseConfig.js` with your Firebase web configuration (not included in source for security). Example values are in `.env.example` if present.

3. Run locally

```bash
npm run dev
```

4. Build for production

```bash
npm run build
```

Features

- Firebase email-link sign-in with UNC email enforcement and Firestore member approval
- Firestore-backed members, events, check-ins, and excusal requests
- Member check-in with location verification and duplicate prevention
- Admin dashboard with engagement scoring and at-risk flags
- Analytics dashboard (attendance trends, event breakdowns, engagement distribution)
- QR code event generation and camera-based scanning for quick check-ins
- Member management CRUD for admins

Notes

- Keep `src/firebaseConfig.js` out of source control.
- The app uses Firestore server timestamps for check-ins and excusal submissions.

Development pointers

- Analytics charts use `recharts`.
- QR scanning uses `html5-qrcode` and QR generation uses `qrcode.react`.

If you'd like, I can add CI/CD steps or a production deployment guide.
