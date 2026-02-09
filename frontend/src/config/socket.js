import { io } from "socket.io-client";

let socket = null;

export const connectSocket = () => {
    if (socket) {
    console.log("Socket already connected");
    return socket;
  }
  socket = io(import.meta.env.VITE_SOCKET_URL, {
    auth: {
      token: localStorage.getItem("token")
    },
   
  });

  socket.on("connect", () => {
    console.log("✅ Connected:", socket.id);
  });

  socket.on("connect_error", (err) => {
    console.log("❌ Socket error:", err.message);
  });

  return socket;
};

export const getSocket = () => socket;