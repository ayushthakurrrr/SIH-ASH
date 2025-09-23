import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { busRoutes } from '../src/lib/bus-routes.js';
import 'dotenv/config';

// This script will seed the bus route data into your Firestore database.
// It's designed to be run from the command line.

async function seedDatabase() {
  try {
    console.log('Initializing Firebase Admin SDK...');

    // Use Application Default Credentials, specifying only the projectId.
    // This is a more robust method for authentication in many environments.
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    if (!projectId) {
      throw new Error('NEXT_PUBLIC_FIREBASE_PROJECT_ID is not set in your .env file.');
    }

    if (!getApps().length) {
        initializeApp({
            projectId: projectId,
        });
    }

    const db = getFirestore();
    console.log('Firestore initialized.');

    const routesCollection = db.collection('routes');
    const batch = db.batch();

    console.log('Preparing to seed bus routes...');

    for (const route of busRoutes) {
      // We remove the 'path' property as it's no longer part of the data model.
      const { path, ...routeData } = route;
      const docRef = routesCollection.doc(route.id);
      batch.set(docRef, routeData);
      console.log(`- Staging route: ${route.name} (${route.id})`);
    }

    console.log('Committing batch to Firestore...');
    await batch.commit();

    console.log('✅ Database seeded successfully!');
  } catch (error) {
    console.error('\n❌ Error seeding database:', error.message);
    if (error.code === 'PERMISSION_DENIED' || error.code === 7) {
        console.error('\nPlease ensure your Firestore security rules allow write access for the Admin SDK.');
    } else if (error.codePrefix === 'app' || error.message.includes('credential')) {
        console.error('\nPlease check your Firebase project configuration and authentication setup.');
    }
    process.exit(1);
  }
}

seedDatabase();
