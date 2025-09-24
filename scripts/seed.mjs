
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, writeBatch } from 'firebase/firestore';
import { busRoutesByCity } from '../src/lib/bus-routes.js';
import dotenv from 'dotenv';

// Configure dotenv to load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function seedDatabase() {
    console.log('Starting to seed database...');

    const batch = writeBatch(db);

    for (const city of busRoutesByCity.cities) {
        console.log(`Processing city: ${city.name}`);
        const cityRef = doc(db, 'cities', city.id);
        batch.set(cityRef, { name: city.name, center: city.center });

        const routesCollectionRef = collection(cityRef, 'routes');
        for (const route of city.routes) {
            console.log(`  Adding route: ${route.name}`);
            const routeRef = doc(routesCollectionRef, route.id);
            // Add cityId to each route for easier lookup if ever needed
            batch.set(routeRef, { ...route, cityId: city.id });
        }
    }

    try {
        await batch.commit();
        console.log('Database seeded successfully!');
    } catch (error) {
        console.error('Error seeding database:', error);
    }
}

seedDatabase().then(() => {
    // Manually exit the process, as the Firestore connection may keep it alive.
    process.exit(0);
}).catch(error => {
    console.error("Seeding script failed:", error);
    process.exit(1);
});
