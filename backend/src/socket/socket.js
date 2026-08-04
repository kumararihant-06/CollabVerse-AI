import jwt from 'jsonwebtoken';
import Message from '../models/message.models.js';
import Project from '../models/project.models.js';
import { generateResultService } from '../services/ai.services.js';

// A user is authorized for a project if they are the owner or a collaborator.
async function isProjectMember(projectId, userId) {
  const project = await Project.findOne({
    _id: projectId,
    $or: [{ owner: userId }, { collaborators: userId }]
  });
  return !!project;
}

async function handleAiRequest(io, projectId, prompt) {
  io.to(projectId).emit("ai-thinking", { projectId });

  try {
    const aiText = await generateResultService(prompt);

    const aiMessage = await Message.create({
      sender: process.env.AI_USER_ID,
      project: projectId,
      text: aiText
    });
    const populated = await aiMessage.populate("sender", "username email");

    io.to(projectId).emit("receive-message", populated);
  } catch (err) {
    console.log("❌ AI response error:", err.message);

    try {
      const errorMessage = await Message.create({
        sender: process.env.AI_USER_ID,
        project: projectId,
        text: "⚠️ Unable to get response. Please try again."
      });
      const populatedError = await errorMessage.populate("sender", "username email");
      io.to(projectId).emit("receive-message", populatedError);
    } catch (innerErr) {
      console.log("❌ Failed to save AI error message:", innerErr.message);
    }
  } finally {
    io.to(projectId).emit("ai-thinking-end", { projectId });
  }
}

export const initializeSocket = (io) => {
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

    // Personal room — lets us target this exact user directly from anywhere,
    // regardless of which project/call room they're in, without broadcasting
    // to everyone else in a shared room.
    socket.join(`user:${socket.user.userId}`);

    socket.on("disconnect", (reason) => {
      console.log(`🔌 Socket disconnected: ${socket.id} | Reason: ${reason}`);

      // Notify any video calls this socket was part of, since a closed tab
      // never emits "leave-video-call" explicitly.
      for (const room of socket.rooms) {
        if (room.startsWith('call:')) {
          const projectId = room.replace('call:', '');
          socket.to(room).emit("user-left-call", {
            userId: socket.user.userId,
            username: socket.user.username,
          });
        }
      }
    });

    // ─── JOIN PROJECT ROOM ────────────────────────────────────────────
    socket.on("join-project", async (projectId) => {
      try {
        const authorized = await isProjectMember(projectId, socket.user.userId);
        if (!authorized) {
          return socket.emit("error", { message: "Not authorized to join this project." });
        }
        socket.join(projectId);
        console.log(`👥 ${socket.user.username} joined project ${projectId}`);
      } catch (err) {
        console.log("Join project error:", err.message);
        socket.emit("error", { message: "Error joining project." });
      }
    });

    // ─── CHAT: SEND MESSAGE ───────────────────────────────────────────
    socket.on("send-message", async ({ projectId, message, file }) => {
      try {
        const authorized = await isProjectMember(projectId, socket.user.userId);
        if (!authorized) {
          return socket.emit("error", { message: "Not authorized for this project." });
        }

        const messageData = {
          sender: socket.user.userId,
          project: projectId,
          text: message || ""
        };
        if (file) messageData.file = file;

        const newMessage = await Message.create(messageData);
        const populatedMessage = await newMessage.populate("sender", "username email");
        io.to(projectId).emit("receive-message", populatedMessage);

        // ─── @ai TRIGGER ────────────────────────────────────────────
        // authorized === true already guarantees only project members reach here,
        // so the Gemini call below is implicitly gated on project membership too.
        const trimmed = (message || "").trim();
        if (/^@ai\b/i.test(trimmed)) {
          const prompt = trimmed.replace(/^@ai\b/i, "").trim();
          if (prompt) {
            handleAiRequest(io, projectId, prompt);
          }
        }
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

    // ─── FILE: CREATE (atomic — no lost updates) ──────────────────────
    socket.on("create-file", async ({ projectId, fileName, language }) => {
      try {
        const newFile = {
          name: fileName,
          content: '',
          language: language || 'javascript',
          createdBy: socket.user.userId,
          lastEditedBy: socket.user.userId,
          lastEditedAt: new Date()
        };

        // Atomic: only succeeds if no file with this name exists yet.
        // Two users racing to create the same filename can no longer both succeed.
        const updatedProject = await Project.findOneAndUpdate(
          { _id: projectId, "files.name": { $ne: fileName } },
          { $push: { files: newFile } },
          { new: true }
        );

        if (!updatedProject) {
          return socket.emit("error", { message: "File already exists or project not found." });
        }

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

    // ─── FILE: UPDATE (atomic — only touches this file's subfields) ──
    // Note: Yjs already handles the real-time collaborative content sync.
    // This event only exists so peers' "last edited by" label updates live —
    // it must not re-persist content via load/save, or it reintroduces the
    // exact lost-update race we're avoiding.
    socket.on("update-file", async ({ projectId, fileName, content }) => {
      try {
        const updatedProject = await Project.findOneAndUpdate(
          { _id: projectId, "files.name": fileName },
          {
            $set: {
              "files.$.lastEditedBy": socket.user.userId,
              "files.$.lastEditedAt": new Date()
            }
          },
          { new: true }
        );

        if (!updatedProject) {
          return socket.emit("error", { message: "File not found" });
        }

        socket.to(projectId).emit("file-updated", {
          fileName,
          content,
          lastEditedBy: {
            _id: socket.user.userId,
            username: socket.user.username
          },
          lastEditedAt: new Date()
        });

        console.log(`File "${fileName}" updated in project ${projectId} by ${socket.user.username}`);
      } catch (err) {
        console.log("Update file error:", err.message);
        socket.emit("error", { message: "Error updating file" });
      }
    });

    // ─── VIDEO CALL: JOIN ─────────────────────────────────────────────
    socket.on("join-video-call", ({ projectId, username }) => {
      socket.join(`call:${projectId}`);
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

    // ─── VIDEO CALL: OFFER (targeted, not broadcast) ──────────────────
    socket.on("call-offer", ({ offer, targetUserId }) => {
      io.to(`user:${targetUserId}`).emit("call-offer", {
        offer,
        fromUserId: socket.user.userId,
        fromUsername: socket.user.username,
      });
    });

    // ─── VIDEO CALL: ANSWER (targeted) ─────────────────────────────────
    socket.on("call-answer", ({ answer, targetUserId }) => {
      io.to(`user:${targetUserId}`).emit("call-answer", {
        answer,
        fromUserId: socket.user.userId,
      });
    });

    // ─── VIDEO CALL: ICE CANDIDATE (targeted) ─────────────────────────
    socket.on("ice-candidate", ({ candidate, targetUserId }) => {
      io.to(`user:${targetUserId}`).emit("ice-candidate", {
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
  });
}