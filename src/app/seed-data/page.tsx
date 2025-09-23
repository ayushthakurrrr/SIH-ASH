"use client";

import { useState } from 'react';
import { getFirestore, collection, writeBatch, doc } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import { busRoutes } from '@/lib/bus-routes';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, AlertTriangle, Database } from 'lucide-react';

export default function SeedDataPage() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSeed = async () => {
    setStatus('loading');
    setMessage('Seeding database...');

    try {
      const db = getFirestore(app);
      const batch = writeBatch(db);
      
      console.log('Starting batch write...');
      busRoutes.forEach((route) => {
        const routeRef = doc(db, 'routes', route.id);
        batch.set(routeRef, route);
        console.log(`Staging route: ${route.id}`);
      });

      await batch.commit();
      console.log('Batch commit successful!');
      
      setStatus('success');
      setMessage(`Successfully seeded ${busRoutes.length} bus routes into Firestore.`);
    } catch (error: any) {
      console.error("Error seeding Firestore:", error);
      setStatus('error');
      setMessage(`Failed to seed database. Error: ${error.message}. Please check console for details and ensure your Firebase security rules allow writes.`);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-lg shadow-xl">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Database className="h-8 w-8 text-primary" />
            <CardTitle className="text-2xl font-bold">Firestore Database Seeder</CardTitle>
          </div>
          <CardDescription>
            Click the button below to populate your Firestore database with the initial bus route data.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={handleSeed}
            disabled={status === 'loading' || status === 'success'}
            className="w-full"
            size="lg"
          >
            {status === 'loading' ? 'Seeding...' : 'Seed Database'}
          </Button>
          
          {status !== 'idle' && (
            <div className={`mt-4 p-4 rounded-md flex items-start gap-3 ${
              status === 'success' ? 'bg-green-100 text-green-800' :
              status === 'error' ? 'bg-red-100 text-red-800' :
              'bg-blue-100 text-blue-800'
            }`}>
              {status === 'success' && <CheckCircle className="h-5 w-5 flex-shrink-0" />}
              {status === 'error' && <AlertTriangle className="h-5 w-5 flex-shrink-0" />}
              <p className="text-sm">{message}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}