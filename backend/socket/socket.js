import jwt from 'jsonwebtoken';
import Message from '../models/message.models.js';
import Project from '../models/project.models.js';
import { generateResultService } from '../services/ai.services.js';

export const initializeSocket = (io) => {
  // Socket.io authentication middleware
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;

      if (!token) {
        console.log("Connection rejected: No token provided");
        return next(new Error("No token"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded;
      
      next();
    } catch (err) {
      console.log("Socket auth error:", err.message);
      next(err);
    }
  });

  io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id} | User: ${socket.user?.username || 'Unknown'}`);

    // Handle disconnect
    socket.on("disconnect", (reason) => {
      console.log(`Socket disconnected: ${socket.id} | User: ${socket.user?.username || 'Unknown'} | Reason: ${reason}`);
    });

    // JOIN PROJECT ROOM
    socket.on("join-project", (projectId) => {
      socket.join(projectId);
      console.log(`${socket.user.username} joined project ${projectId}`);
    });

    // ========== MESSAGE EVENTS ==========

    // SEND MESSAGE
    socket.on("send-message", async ({ projectId, message }) => {
      try {
        const aiIsPresent = message.includes("@ai");
      
        if (aiIsPresent) {
          // User message
          const userMessage = await Message.create({
            sender: socket.user.userId,
            project: projectId,
            text: message
          });
          
          const populatedUserMessage = await userMessage.populate("sender", "username email");
          console.log(`Message sent in project ${projectId} by ${socket.user.username}`);
          io.to(projectId).emit("receive-message", populatedUserMessage);
          
          // AI response
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
          
        } else {
          // Regular message
          const newMessage = await Message.create({
            sender: socket.user.userId,
            project: projectId,
            text: message
          });
          
          const populatedMessage = await newMessage.populate("sender", "username email");
          console.log(`Message sent in project ${projectId} by ${socket.user.username}`);
          io.to(projectId).emit("receive-message", populatedMessage);
        }
      } catch (err) {
        console.log("Message error:", err.message);
      }
    });

    // ========== FILE COLLABORATION EVENTS ==========

    // CREATE FILE
    socket.on("create-file", async ({ projectId, fileName, language }) => {
      try {
        const project = await Project.findById(projectId);
        
        if (!project) {
          return socket.emit("error", { message: "Project not found" });
        }

        // Check if file already exists
        const existingFile = project.files.find(f => f.name === fileName);
        if (existingFile) {
          return socket.emit("error", { message: "File already exists" });
        }

        const newFile = {
          name: fileName,
          content: '',
          language: language || 'javascript',
          createdBy: socket.user.userId,
          lastEditedBy: socket.user.userId,
          lastEditedAt: new Date()
        };

        project.files.push(newFile);
        await project.save();

        // Broadcast to all users in the project
        io.to(projectId).emit("file-created", {
          file: newFile,
          createdBy: socket.user.username
        });

        console.log(`File "${fileName}" created in project ${projectId} by ${socket.user.username}`);
      } catch (err) {
        console.log("Create file error:", err.message);
        socket.emit("error", { message: "Error creating file" });
      }
    });

    // UPDATE FILE CONTENT (Real-time editing)
    socket.on("update-file", async ({ projectId, fileName, content }) => {
      try {
        const project = await Project.findById(projectId);

        if (!project) {
          return socket.emit("error", { message: "Project not found" });
        }

        const file = project.files.find(f => f.name === fileName);
        if (!file) {
          return socket.emit("error", { message: "File not found" });
        }

        file.content = content;
        file.lastEditedBy = socket.user.userId;
        file.lastEditedAt = new Date();
        await project.save();

        socket.to(projectId).emit("file-updated", {
          fileName: fileName,
          content: content,
          lastEditedBy: socket.user.username,
          lastEditedAt: file.lastEditedAt
        });

        console.log(`File "${fileName}" updated in project ${projectId} by ${socket.user.username}`);
      } catch (err) {
        console.log("Update file error:", err.message);
        socket.emit("error", { message: "Error updating file" });
      }
    });

    // DELETE FILE
    socket.on("delete-file", async ({ projectId, fileName }) => {
      try {
        const project = await Project.findById(projectId);
        
        if (!project) {
          return socket.emit("error", { message: "Project not found" });
        }

        project.files = project.files.filter(f => f.name !== fileName);
        await project.save();

        // Broadcast to all users in the project
        io.to(projectId).emit("file-deleted", {
          fileName: fileName,
          deletedBy: socket.user.username
        });

        console.log(`File "${fileName}" deleted from project ${projectId} by ${socket.user.username}`);
      } catch (err) {
        console.log("Delete file error:", err.message);
        socket.emit("error", { message: "Error deleting file" });
      }
    });

    // RENAME FILE
    socket.on("rename-file", async ({ projectId, oldName, newName }) => {
      try {
        const project = await Project.findById(projectId);
        
        if (!project) {
          return socket.emit("error", { message: "Project not found" });
        }

        const file = project.files.find(f => f.name === oldName);
        
        if (!file) {
          return socket.emit("error", { message: "File not found" });
        }

        // Check if new name already exists
        const existingFile = project.files.find(f => f.name === newName);
        if (existingFile) {
          return socket.emit("error", { message: "File with new name already exists" });
        }

        file.name = newName;
        await project.save();

        // Broadcast to all users in the project
        io.to(projectId).emit("file-renamed", {
          oldName: oldName,
          newName: newName,
          renamedBy: socket.user.username
        });

        console.log(`File renamed from "${oldName}" to "${newName}" in project ${projectId} by ${socket.user.username}`);
      } catch (err) {
        console.log("Rename file error:", err.message);
        socket.emit("error", { message: "Error renaming file" });
      }
    });

    socket.on("cursor-position", ({ projectId, fileName, line, column }) => {
      socket.to(projectId).emit("user-cursor", {
        userId: socket.user.userId,
        username: socket.user.username,
        fileName: fileName,
        line: line,
        column: column
      });
    });
  });

  console.log('Socket.io initialized');
};