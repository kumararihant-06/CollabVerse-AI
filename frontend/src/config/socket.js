import {io} from "socket.io-client";

let socketInstance = null;

export const connectSocket = () => {

    socketInstance = io(import.meta.env.VITE_SOCKET_URL, {
        auth: {
            token: localStorage.getItem("token")
        }
    });

    socketInstance.on("connect", () => {
    console.log("Socket connected:", socketInstance.id);
  });

  socketInstance.on("connect_error", (err) => {
    console.log("Socket error:", err.message);
  });
    return socketInstance;
}  

export const getSocket = () => socketInstance;

export const disconnectSocket = () => {
    if(socketInstance){
        socketInstance.disconnect();
        socketInstance = null;
    }
}

export const sendMessage = (eventName, data) => {
    socketInstance?.emit(eventName, data);
}

export const recieveMessage = (eventName, callback) => {
    socketInstance?.on(eventName,callback);
}
