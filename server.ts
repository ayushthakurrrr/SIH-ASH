
import { createServer } from 'http';
import express from 'express';
import next from 'next';
import { Server } from 'socket.io';
import type { LocationUpdate } from './src/types';

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = 9002;

const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

// In-memory storage for bus locations
const busLocations: Record<string, { lat: number; lng: number }> = {};

app.prepare().then(() => {
  const expressApp = express();
  const httpServer = createServer(expressApp);

  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  io.on('connection', (socket) => {
    console.log('A client connected');

    // Send initial locations to the newly connected client
    socket.emit('initialLocations', busLocations);

    socket.on('updateLocation', (data: LocationUpdate) => {
      if(data.busId && data.location) {
        busLocations[data.busId] = data.location;
        // Broadcast to all other clients
        socket.broadcast.emit('locationUpdate', data);
      }
    });

    socket.on('disconnect', () => {
      console.log('A client disconnected');
      // Note: For a real-world app, you might want to handle bus disconnection,
      // e.g., remove it from the map after a timeout.
    });
  });
  
  // Let Next.js handle all other requests
  expressApp.all('*', (req, res) => {
    return handler(req, res);
  });

  httpServer
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    })
    .on('error', (err) => {
      console.error(err);
      process.exit(1);
    });
});
