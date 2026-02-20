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
  console.log(`✅ Socket connected: ${socket.id} | User: ${socket.user?.username || 'Unknown'}`);

  socket.on("disconnect", (reason) => {
    console.log(`🔌 Socket disconnected: ${socket.id} | Reason: ${reason}`);
  });

  // ─── JOIN PROJECT ROOM ────────────────────────────────────────────
  socket.on("join-project", (projectId) => {
    socket.join(projectId);
    console.log(`👥 ${socket.user.username} joined project ${projectId}`);
  });

  // ─── CHAT: SEND MESSAGE ───────────────────────────────────────────
  socket.on("send-message", async ({ projectId, message, file }) => {
    try {
      const messageData = {
        sender: socket.user.userId,
        project: projectId,
        text: message || ""
      };
      if (file) messageData.file = file;

      const newMessage = await Message.create(messageData);
      const populatedMessage = await newMessage.populate("sender", "username email");
      io.to(projectId).emit("receive-message", populatedMessage);
    } catch (err) {
      console.log("❌ Message error:", err.message);
    }
  });

  // ─── CHAT: EDIT MESSAGE ───────────────────────────────────────────
  socket.on("edit-message", async ({ messageId, newText, projectId }) => {
    try {
      const message = await Message.findById(messageId);
      if (!message) return socket.emit("error", { message: "Message not found" });
      if (message.sender.toString() !== socket.user.userId)
        return socket.emit("error", { message: "Unauthorized" });

      message.text = newText;
      message.isEdited = true;
      message.editedAt = new Date();
      await message.save();

      const populated = await message.populate("sender", "username email");
      io.to(projectId).emit("message-edited", populated);
    } catch (err) {
      socket.emit("error", { message: "Error editing message" });
    }
  });

  // ─── CHAT: DELETE MESSAGE ─────────────────────────────────────────
  socket.on("delete-message", async ({ messageId, projectId }) => {
    try {
      const message = await Message.findById(messageId);
      if (!message) return socket.emit("error", { message: "Message not found" });
      if (message.sender.toString() !== socket.user.userId)
        return socket.emit("error", { message: "Unauthorized" });

      message.isDeleted = true;
      message.deletedAt = new Date();
      message.text = "This message was deleted";
      await message.save();

      io.to(projectId).emit("message-deleted", { messageId });
    } catch (err) {
      socket.emit("error", { message: "Error deleting message" });
    }
  });

  // ─── FILE EVENTS (existing) ───────────────────────────────────────
  socket.on("create-file", async ({ projectId, fileName, language }) => {
    // handled by your existing file controller
  });

  // ─── VIDEO CALL: JOIN ─────────────────────────────────────────────
  socket.on("join-video-call", ({ projectId, username }) => {
    socket.join(`call:${projectId}`);
    // Notify everyone ELSE in the call that this user joined
    socket.to(`call:${projectId}`).emit("user-joined-call", {
      userId: socket.user.userId,
      username: username || socket.user.username,
    });
    console.log(`📞 ${socket.user.username} joined video call in project ${projectId}`);
  });

  // ─── VIDEO CALL: LEAVE ────────────────────────────────────────────
  socket.on("leave-video-call", ({ projectId }) => {
    socket.leave(`call:${projectId}`);
    socket.to(`call:${projectId}`).emit("user-left-call", {
      userId: socket.user.userId,
      username: socket.user.username,
    });
    console.log(`📴 ${socket.user.username} left video call in project ${projectId}`);
  });

  // ─── VIDEO CALL: OFFER ────────────────────────────────────────────
  socket.on("call-offer", ({ projectId, offer, targetUserId }) => {
    // Find the target socket and send directly to them
    io.to(`call:${projectId}`).emit("call-offer", {
      offer,
      fromUserId: socket.user.userId,
      fromUsername: socket.user.username,
      targetUserId,
    });
  });

  // ─── VIDEO CALL: ANSWER ───────────────────────────────────────────
  socket.on("call-answer", ({ projectId, answer, targetUserId }) => {
    io.to(`call:${projectId}`).emit("call-answer", {
      answer,
      fromUserId: socket.user.userId,
      targetUserId,
    });
  });

  // ─── VIDEO CALL: ICE CANDIDATE ────────────────────────────────────
  socket.on("ice-candidate", ({ projectId, candidate, targetUserId }) => {
    socket.to(`call:${projectId}`).emit("ice-candidate", {
      candidate,
      fromUserId: socket.user.userId,
    });
  });

  // ─── VIDEO CALL: TOGGLE VIDEO/AUDIO ──────────────────────────────
  socket.on("toggle-video", ({ projectId, enabled }) => {
    socket.to(`call:${projectId}`).emit("user-toggled-video", {
      userId: socket.user.userId,
      enabled,
    });
  });

  socket.on("toggle-audio", ({ projectId, enabled }) => {
    socket.to(`call:${projectId}`).emit("user-toggled-audio", {
      userId: socket.user.userId,
      enabled,
    });
  });

  // ─── SOCKET ERROR ─────────────────────────────────────────────────
  socket.on("error", ({ message }) => {
    console.error("Socket error:", message);
  });
  })}


