import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  let credential;
  if (process.env.NODE_ENV === 'production' && process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    credential = admin.credential.applicationDefault();
    console.log("Firebase Admin SDK initializing with Application Default Credentials.");
  } else {
    if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
      console.error("Missing Firebase Admin SDK environment variables. Please set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY in your .env.local file.");
      throw new Error("Firebase Admin SDK credentials are not fully configured.");
    }
    credential = admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    });
    console.log("Firebase Admin SDK initializing with provided service account credentials.");
  }

  admin.initializeApp({
    credential: credential,
  });

  console.log("Firebase Admin SDK initialization complete.");
} else {
  console.log("Firebase Admin SDK already initialized. Skipping.");
}

export const db = admin.firestore();
export { admin };