import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { busRoutes } from '../src/lib/bus-routes.ts';
import 'dotenv/config'

// Function to get service account credentials
function getServiceAccount() {
  // Try to get from environment variables for deployed environments
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
    try {
      return JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);
    } catch (e) {
      console.error('Error parsing GOOGLE_APPLICATION_CREDENTIALS_JSON:', e);
    }
  }

  // Fallback for local development if you have a service account file
  // (Note: In some environments like Studio, this might not be available,
  // but the default credentials should work)
  try {
    const serviceAccount = require('../serviceAccountKey.json');
    return serviceAccount;
  } catch (e) {
    // This is not an error if default credentials are to be used
    return undefined;
  }
}

async function seedDatabase() {
  try {
    console.log('Initializing Firebase Admin SDK...');

    // Initialize Firebase Admin
    const serviceAccount = getServiceAccount();
    
    const appConfig = {
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    }
    
    if (serviceAccount) {
        appConfig.credential = cert(serviceAccount)
    }

    initializeApp(appConfig);

    const db = getFirestore();
    const batch = db.batch();

    console.log('Preparing to seed bus routes...');
    busRoutes.forEach((route) => {
      const routeRef = db.collection('routes').doc(route.id);
      batch.set(routeRef, route);
      console.log(`- Staging route: ${route.name} (${route.id})`);
    });

    console.log('Committing batch to Firestore...');
    await batch.commit();

    console.log('\n✅ Success! Database seeded successfully.');
    console.log(`✅ Added ${busRoutes.length} routes to the 'routes' collection.`);
    
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error seeding database:', error.message);
    console.error('Please check your Firebase project configuration and ensure Firestore is enabled.');
    if (error.code === 'PERMISSION_DENIED') {
        console.error('Firestore permission denied. Please check your Security Rules.');
    }
    process.exit(1);
  }
}

seedDatabase();
