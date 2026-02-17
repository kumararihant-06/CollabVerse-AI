import http from 'http';
import dotenv from 'dotenv';
import app from './app.js';
import connectDB from './config/db.config.js';
import { Server } from 'socket.io';
import { initializeSocket } from './socket/socket.js';

dotenv.config();

connectDB();

const PORT = process.env.PORT || 3000;

const server = http.createServer(app);


const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL,
    credentials: true
  }
});

initializeSocket(io);

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
