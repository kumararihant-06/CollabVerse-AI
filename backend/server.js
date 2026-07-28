import http from 'http';
import app from './src/app.js';
import connectDB from './src/config/db.config.js';
import { Server } from 'socket.io';
import { initializeSocket } from './src/socket/socket.js';
import { initializeYjs } from './src/yjs/yjsServer.js';
import {  ServerConfig } from './src/config/enviornment.config.js';

//loadConfig()
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

server.listen(ServerConfig.PORT, () => {
  console.log(`Server is running on port ${ServerConfig.PORT}`);
  console.log("Press ctrl+c to stop the server.")
});