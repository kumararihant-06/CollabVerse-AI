import http from 'http';
import dotenv from 'dotenv';
import app from './app.js'
import connectDB from './config/db.config.js';
import {Server} from 'socket.io'
import jwt from 'jsonwebtoken';
dotenv.config()
connectDB();

const PORT = process.env.PORT

const server  = http.createServer(app);
const io = new Server(server, {
    cors:{
        origin: process.env.FRONTEND_URL,
        credentials: true
    }
});

io.use((socket, next) => {
    try {
        const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
    if(!token){
        return next(new Error("Authentication error: Token not provided."))
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if(!decoded){
        return next(new Error("Authentication error: Invalid token."))
    }
    socket.user = decoded;
    next();
    } catch (error) {
        next(error);
    }

})

io.on('connection', client => {
  client.on('event', data => { /* … */ });
  client.on('disconnect', () => { /* … */ });
});

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
})

