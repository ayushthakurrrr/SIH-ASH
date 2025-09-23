// This script is used to seed the Firestore database with initial bus route data.
// To run it, use: `npm run db:seed`
// Make sure your .env.local file has the Firebase service account credentials.

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { busRoutes } from '../src/lib/bus-routes.ts';
import dotenv from 'dotenv';

// Load environment variables from a .env.local file
dotenv.config({ path: '.env.local' });

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function seedDatabase() {
  console.log('Starting to seed database...');

  for (const route of busRoutes) {
    const routeRef = db.collection('routes').doc(route.id);
    try {
      await routeRef.set({
        name: route.name,
        buses: route.buses,
        stops: route.stops,
        path: route.path
      });
      console.log(`Successfully seeded route: ${route.name}`);
    } catch (error) {
      console.error(`Error seeding route ${route.name}:`, error);
    }
  }

  console.log('Database seeding complete!');
}

seedDatabase().catch(console.error);
