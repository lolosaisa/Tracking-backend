import { Server, Socket } from 'socket.io';
import { prisma } from '../lib/prisma';
import { timeStamp } from 'node:console';
//import { connected } from 'process';

//define the shape of the location update event to avoid TypeScript errors
interface LocationUpdatePayload {
  mechanicId: string;
  latitude: number;
  longitude: number;
}
export const registerSocketHandlers = (io: Server) => {
    //io.on('connection') fires on every time a device connects to the Socket.IO server
    //each device connected get it's own socket object, which we can use to send/receive messages to/from that specific device

    io.on('connection', (socket: Socket) => {
        console.log(`[Socket] connected: ${socket.id}`);

        socket.on('mechanic:update', async(data: LocationUpdatePayload) => {
            const { mechanicId, latitude, longitude } = data;
        
            //validate the payload data received from the client
            if (!mechanicId || latitude === undefined || longitude === undefined) {
                socket.emit('error', { message: 'Invalid location update payload' });
                console.warn(`[Socket] Invalid location update payload: ${JSON.stringify(data)}`);
                return;
            }
            try {
                //update the mechanic's location in the database, persist to the database
                await prisma.mechanic.update({
                    where: { id: mechanicId },
                    data: { latitude, longitude },
                });
                console.log(`[Socket] Updated location for mechanic ${mechanicId}: (${latitude}, ${longitude})`);

                //broadcast location to all driver watching the mechanic
                //io.to(room) sends update to everyone in the room expect the sender
                //this is what moves the map marker on the driver's app in real time
                io.to(`mechanic:${mechanicId}`).emit('mechanic:moved', {
                    mechanicId,
                    latitude,
                    longitude,
                    timeStamp: new Date(),
                });
                console.log(`[Socket] mechanic ${mechanicId} moved to (${latitude}, ${longitude})`);
            } catch (error) {
                console.error(`[Socket] Error updating location for mechanic ${mechanicId}:`, error);
                socket.emit('error', { message: 'Failed to update location' });
            }
        });
}

        }
    };
