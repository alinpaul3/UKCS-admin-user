# UKCS Certifications Portal

UKCS Certifications Portal is a web app for issuing, managing, and verifying digital certificates for UK Certification Solutions.

The system includes an admin dashboard for uploading certificates, managing users, and deleting issued records, plus a public verification portal where certificate IDs can be checked without logging in. Students and registered users can sign in to view and download their own certificates.

## Features

- Admin certificate upload and management
- User account management
- Student dashboard for issued certificates
- Public certificate verification by reference ID
- Firebase Authentication and Firestore database
- Cloudinary-backed certificate file storage
- Netlify deployment support with serverless upload/delete functions

## Tech Stack

- React
- TypeScript
- Vite
- Firebase Auth and Firestore
- Cloudinary
- Netlify Functions
- Tailwind CSS

## Run Locally

Prerequisite: Node.js

Install dependencies:

```bash
npm install
```

Create a local environment file:

```bash
cp .env.example .env.local
```

Add your Firebase, Cloudinary, and optional Gemini values to `.env.local`.

Start the development server:

```bash
npm run dev
```

If you are using PowerShell and `npm run dev` is blocked by execution policy, use:

```powershell
npm.cmd run dev
```

Open:

```text
http://localhost:3000
```

## Environment Variables

Required for Firebase:

```text
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_APP_ID
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_MEASUREMENT_ID
```

Required for certificate file uploads:

```text
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
```

Optional:

```text
GEMINI_API_KEY
APP_URL
```

Do not commit `.env.local`. The repository only includes `.env.example` as a safe template.

## Deployment

The project is configured for Netlify.

Netlify build settings:

```text
Build command: npm run build
Publish directory: dist
Functions directory: netlify/functions
```

Add the environment variables listed above in Netlify Site Settings before deploying.

## Scripts

```bash
npm run dev
npm run build
npm run preview
npm run lint
```
