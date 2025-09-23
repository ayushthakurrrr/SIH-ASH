
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
// Map socket IDs to bus IDs
const socketBusMap: Record<string, string> = {};

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
    console.log(`A client connected: ${socket.id}`);

    // Send initial locations to the newly connected client
    socket.emit('initialLocations', busLocations);

    socket.on('updateLocation', (data: LocationUpdate) => {
      if(data.busId && data.location) {
        // Store mapping if it's the first time we see this socket with a busId
        if (!socketBusMap[socket.id]) {
            socketBusMap[socket.id] = data.busId;
        }
        
        busLocations[data.busId] = data.location;
        // Broadcast to all other clients
        socket.broadcast.emit('locationUpdate', data);
      }
    });

    socket.on('disconnect', () => {
      const busId = socketBusMap[socket.id];
      if (busId) {
        console.log(`Bus ${busId} disconnected.`);
        // Remove the bus from our records
        delete busLocations[busId];
        delete socketBusMap[socket.id];
        // Notify all clients that this bus is now offline
        io.emit('removeBus', busId);
      } else {
        console.log(`A client disconnected: ${socket.id}`);
      }
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
