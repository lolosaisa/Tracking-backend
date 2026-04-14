// src/sockets/index.ts
import { Server, Socket } from 'socket.io';
import { prisma } from '../lib/prisma';

// This is the shape of a location update event
// Defining it here gives you type safety on every event handler
interface LocationUpdatePayload {
  mechanicId: string;
  latitude: number;
  longitude: number;
}

export const registerSocketHandlers = (io: Server) => {

  // io.on('connection') fires every time a new device connects
  // Each connected device gets its own unique socket object
  // Think of socket as the phone line for that specific device
  io.on('connection', (socket: Socket) => {
    console.log(`[socket] connected: ${socket.id}`);

    // ── EVENT: mechanic:update ──────────────────────────────
    // Fired by the mechanic's device every few seconds
    // with their current GPS coordinates
    socket.on('mechanic:update', async (data: LocationUpdatePayload) => {
      const { mechanicId, latitude, longitude } = data;

      // Validate the payload — never trust incoming data
      if (!mechanicId || latitude === undefined || longitude === undefined) {
        socket.emit('error', { message: 'Invalid location payload' });
        return;
      }

      try {
        // 1. Persist to database so we always have the latest position
        //    This is what GET /api/mechanics reads from
        await prisma.mechanic.update({
          where: { id: mechanicId },
          data:  { latitude, longitude },
        });

        // 2. Broadcast to every driver watching this mechanic
        //    io.to(room) sends to everyone in that room EXCEPT the sender
        //    This is what moves the map marker on the driver's screen
        io.to(`mechanic:${mechanicId}`).emit('mechanic:moved', {
          mechanicId,
          latitude,
          longitude,
          timestamp: new Date(),
        });

        console.log(`[socket] mechanic ${mechanicId} moved to ${latitude}, ${longitude}`);
      } catch (error) {
        console.error('[socket] mechanic:update error', error);
        socket.emit('error', { message: 'Failed to update location' });
      }
    });

    // ── EVENT: watch:join ───────────────────────────────────
    // Fired by the driver's app when they tap a mechanic on the map
    // or open a mechanic's profile — "I want live updates for this mechanic"
    socket.on('watch:join', (mechanicId: string) => {
      // socket.join() adds this socket to the named room
      // From this point, any io.to(`mechanic:${mechanicId}`) emit
      // will be received by this driver
      socket.join(`mechanic:${mechanicId}`);
      console.log(`[socket] ${socket.id} watching mechanic ${mechanicId}`);

      // Acknowledge back to the driver that they're now watching
      socket.emit('watch:joined', { mechanicId });
    });

    // ── EVENT: watch:leave ──────────────────────────────────
    // Fired when the driver closes the mechanic's profile
    // or navigates away — "stop sending me updates for this mechanic"
    // Important: without this, drivers accumulate in rooms forever
    socket.on('watch:leave', (mechanicId: string) => {
      socket.leave(`mechanic:${mechanicId}`);
      console.log(`[socket] ${socket.id} stopped watching mechanic ${mechanicId}`);
    });

    // ── EVENT: garage:update ────────────────────────────────
    // Same pattern as mechanic:update but for garages
    // A garage admin app (Phase 2) would use this
    socket.on('garage:update', async (data: { garageId: string; latitude: number; longitude: number }) => {
      const { garageId, latitude, longitude } = data;

      try {
        await prisma.garage.update({
          where: { id: garageId },
          data:  { latitude, longitude },
        });

        io.to(`garage:${garageId}`).emit('garage:moved', {
          garageId, latitude, longitude, timestamp: new Date(),
        });
      } catch (error) {
        console.error('[socket] garage:update error', error);
      }
    });

    // ── EVENT: watch:join:garage ────────────────────────────
    // Driver wants live updates for a garage
    socket.on('watch:join:garage', (garageId: string) => {
      socket.join(`garage:${garageId}`);
      socket.emit('watch:joined:garage', { garageId });
    });

    // ── EVENT: disconnect ───────────────────────────────────
    // Fires automatically when a device loses connection
    // (app backgrounded, phone locked, network drops)
    // Socket.io automatically removes this socket from ALL rooms
    // when it disconnects — so we don't need to manually call leave()
    socket.on('disconnect', (reason) => {
      console.log(`[socket] disconnected: ${socket.id} — reason: ${reason}`);
    });
  });
};