import http from 'http';
import dotenv from 'dotenv';
import app from './app.js'
import connectDB from './config/db.config.js';
import {Server} from 'socket.io'
import jwt from 'jsonwebtoken';
import Message from './models/message.models.js';
import { generateResultService } from './services/ai.services.js';
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

    if (!token) {
      console.log("❌ Connection rejected: No token provided");
      return next(new Error("No token"));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    socket.user = decoded;
    
    next();
  } catch (err) {
    console.log("❌ Socket auth error:", err.message);
    next(err);
  }
});

io.on("connection", (socket) => {
  console.log(`✅ Socket connected: ${socket.id} | User: ${socket.user?.username || 'Unknown'}`);

  // Handle disconnect
  socket.on("disconnect", (reason) => {
    console.log(`🔌 Socket disconnected: ${socket.id} | User: ${socket.user?.username || 'Unknown'} | Reason: ${reason}`);
  });

  // JOIN PROJECT ROOM
  socket.on("join-project", (projectId) => {
    socket.join(projectId);
    console.log(`👥 ${socket.user.username} joined project ${projectId}`);
  });

  // SEND MESSAGE
  socket.on("send-message", async ({ projectId, message }) => {
    try {
      const aiIsPresent = message.includes("@ai");
    
    if (aiIsPresent) {
    
      const userMessage = await Message.create({
        sender: socket.user.userId,
        project: projectId,
        text: message
      });
      
      const populatedUserMessage = await userMessage.populate("sender", "username email");
      console.log(`Message sent in project ${projectId} by ${socket.user.username}`);
      io.to(projectId).emit("receive-message", populatedUserMessage);
      
     
      const prompt = message.replace("@ai", "").trim();
      const responseFromAI = await generateResultService(prompt); 
      
      
      const aiMessage = await Message.create({
        sender: process.env.AI_USER_ID, 
        project: projectId,
        text: responseFromAI
      });
      
      const populatedAIMessage = await aiMessage.populate("sender", "username email");
      console.log(`AI response sent in project ${projectId}`);
      io.to(projectId).emit("receive-message", populatedAIMessage);
      
      }else{

        const newMessage = await Message.create({
        sender: socket.user.userId,
        project: projectId,
        text: message
     });
     const populatedMessage = await newMessage.populate("sender", "username email")
     console.log(`Message sent in project ${projectId} by ${socket.user.username}`)
     io.to(projectId).emit("receive-message", populatedMessage)

    }
     

     
    } catch (err) {
      console.log("Message error:", err.message);
    }
  });
});

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
})