import { io } from "socket.io-client";

let socket = null;

export const connectSocket = () => {
  const token = localStorage.getItem("token");
  
  if (!token) {
    console.log("❌ No token found, skipping socket connection");
    return null;
  }

  if (socket && socket.connected) {
    console.log("Socket already connected");
    return socket;
  }

  socket = io(import.meta.env.VITE_SOCKET_URL, {
    auth: {
      token: token
    },
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  socket.on("connect", () => {
    console.log("Connected:", socket.id);
  });

  socket.on("connect_error", (err) => {
    console.log("Socket error:", err.message);
    if (err.message === "No token" || err.message.includes("jwt")) {
      console.log("Authentication failed, disconnecting socket");
      disconnectSocket();
      localStorage.removeItem("token");
    }
  });

  socket.on("disconnect", (reason) => {
    console.log("Socket disconnected:", reason);
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    console.log("Socket manually disconnected");
  }
};

export const getSocket = () => socket;