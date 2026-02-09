import http from 'http';
import dotenv from 'dotenv';
import app from './app.js'
import connectDB from './config/db.config.js';
import {Server} from 'socket.io'
import jwt from 'jsonwebtoken';
import Project from './models/project.models.js';
import Message from './models/message.models.js';
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
    const token = socket.handshake.auth?.token;

    if (!token) return next(new Error("No token"));

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    socket.user = decoded;
    
    next();
  } catch (err) {
    console.log("Socket auth error:", err.message);
    next(err);
  }
});

io.on("connection", (socket) => {
  console.log("✅ Socket connected:", socket.id);

  // JOIN PROJECT ROOM
  socket.on("join-project", (projectId) => {
    socket.join(projectId);
    console.log(`${socket.user.username} joined project ${projectId}`);
  });

  // SEND MESSAGE
  socket.on("send-message", async ({ projectId, message }) => {
    try {
     const newMessage = await Message.create({
        sender: socket.user.userId,
        project: projectId,
        text: message
     });

     const populatedMessage = await newMessage.populate("sender", "username email")
     console.log(populatedMessage)
     io.to(projectId).emit("receive-message", populatedMessage)
    } catch (err) {
      console.log("Message error:", err.message);
    }
  });
});

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
})

