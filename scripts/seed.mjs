import admin from 'firebase-admin';
import { busRoutes } from '../src/lib/bus-routes.ts';
import 'dotenv/config';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase Admin SDK
// Make sure your GOOGLE_APPLICATION_CREDENTIALS environment variable is set.
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        databaseURL: `https://${firebaseConfig.projectId}.firebaseio.com`
    });
}


const db = admin.firestore();

async function seedDatabase() {
  console.log('Starting to seed the database...');
  const routesCollection = db.collection('routes');

  // Firestore allows batch writes for efficiency
  const batch = db.batch();

  busRoutes.forEach(route => {
    const docRef = routesCollection.doc(route.id);
    batch.set(docRef, route);
  });

  try {
    await batch.commit();
    console.log(`Successfully seeded ${busRoutes.length} routes.`);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }

  console.log('Database seeding complete.');
  process.exit(0);
}

seedDatabase();
