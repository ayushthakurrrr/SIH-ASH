import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { busRoutes } from '../src/lib/bus-routes.js'; // Use .js extension for ES modules

// IMPORTANT: Path to your service account key file
// Download this from your Firebase Project Settings -> Service Accounts
const serviceAccount = {
    "type": "service_account",
    "project_id": process.env.FIREBASE_PROJECT_ID,
    "private_key_id": process.env.FIREBASE_PRIVATE_KEY_ID,
    "private_key": process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    "client_email": process.env.FIREBASE_CLIENT_EMAIL,
    "client_id": process.env.FIREBASE_CLIENT_ID,
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_x509_cert_url": `https://www.googleapis.com/robot/v1/metadata/x509/${process.env.FIREBASE_CLIENT_EMAIL?.replace('@', '%40')}`
};

async function seedDatabase() {
    try {
        console.log("Initializing Firebase Admin SDK...");
        initializeApp({
            credential: cert(serviceAccount)
        });

        const db = getFirestore();
        const routesCollection = db.collection('routes');
        
        console.log("Preparing to seed bus routes...");
        const batch = db.batch();

        busRoutes.forEach(route => {
            const { id, ...data } = route;
            const docRef = routesCollection.doc(id);
            // The 'path' property is removed from the data before seeding
            const { path, ...routeData } = data;
            console.log(`- Staging route: ${route.name} (${id})`);
            batch.set(docRef, routeData);
        });

        console.log("Committing batch to Firestore...");
        await batch.commit();

        console.log('✅ Database seeding completed successfully!');
    } catch (error) {
        console.error('❌ Error seeding database:', error);
        process.exit(1);
    }
}

seedDatabase();
