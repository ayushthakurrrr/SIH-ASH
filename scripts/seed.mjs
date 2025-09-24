import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { busRoutesByCity } from '../src/lib/bus-routes.js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

// Initialize Firebase Admin SDK
initializeApp({
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
});

const db = getFirestore();

async function seedDatabase() {
  console.log('Starting to seed the database...');

  const { cities } = busRoutesByCity;
  
  if (!cities || cities.length === 0) {
      console.log('No cities found to seed. Exiting.');
      return;
  }

  const citiesCollection = db.collection('cities');
  const batch = db.batch();

  for (const city of cities) {
    console.log(`Processing city: ${city.name} (${city.id})`);
    
    // Create a document for the city
    const cityRef = citiesCollection.doc(city.id);
    const { routes, ...cityData } = city;
    batch.set(cityRef, cityData);
    
    // Create a subcollection for routes within the city
    const routesCollection = cityRef.collection('routes');
    if (routes && routes.length > 0) {
        for (const route of routes) {
            console.log(`  - Adding route: ${route.name} (${route.id})`);
            const routeRef = routesCollection.doc(route.id);
            // Add cityId to each route for easier lookup if needed later
            batch.set(routeRef, { ...route, cityId: city.id });
        }
    } else {
        console.log(`  - No routes to add for ${city.name}.`);
    }
  }

  try {
    await batch.commit();
    console.log('✅ Database seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
  }
}

seedDatabase();
