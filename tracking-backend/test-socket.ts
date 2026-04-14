// test-socket.ts  — run with: node test-socket.ts
// 
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000');

socket.on('connect', () => {
  console.log('Connected to server:', socket.id);

  // Simulate a driver joining a room to watch mechanic
  const mechanicId = 'cmnx0iyyn0001rlbqeeg87oq6'; // your real mechanic ID
  socket.emit('watch:join', mechanicId);

  // Listen for location updates broadcast to this room
  socket.on('mechanic:moved', (data) => {
    console.log('Mechanic moved:', data);
  });

  // After joining, simulate the mechanic sending a location update
  setTimeout(() => {
    console.log('Simulating mechanic location update...');
    socket.emit('mechanic:update', {
      mechanicId,
      latitude:  -1.2870,
      longitude: 36.8180,
    });
  }, 1000);
});

socket.on('watch:joined', (data) => {
  console.log('Now watching:', data);
});

socket.on('error', (err) => {
  console.error('Socket error:', err);
});

socket.on('disconnect', () => {
  console.log('Disconnected');
});