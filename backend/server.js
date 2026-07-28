import http from 'http';
import app from './src/app.js';
import connectDB from './src/config/db.config.js';
import { Server } from 'socket.io';
import { initializeSocket } from './src/socket/socket.js';
import { initializeYjs } from './src/yjs/yjsServer.js';

connectDB();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL,
    credentials: true
  }
});

initializeSocket(io);
initializeYjs(server);

server.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
  console.log("Press ctrl+c to stop the server.")
});