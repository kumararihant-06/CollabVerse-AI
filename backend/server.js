import http from 'http';
import dotenv from 'dotenv';
import app from './src/app.js';
import connectDB from './src/config/db.config.js';
import { Server } from 'socket.io';
import { WebSocketServer } from 'ws';
import * as Y from 'yjs';
import { initializeSocket } from './src/socket/socket.js';


dotenv.config();
connectDB();
const PORT = process.env.PORT || 3000;
const server = http.createServer(app);


const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL,
    credentials: true
  }
});
initializeSocket(io);

//yjs websocket setup
const yws = new WebSocketServer({ noServer: true});
const docs = new Map();
yws.on('connection', (conn, req) => {
  const roomName = req.url.split('/').pop();

  let doc = docs.get(roomName);
  if (!doc) {
    doc = new Y.Doc();
    docs.set(roomName, doc);
  }
  import('y-websocket/bin/utils.js').then(utils => {
    utils.setupWSConnection(conn, req, { docName: roomName, gc: true });
  });
});

server.on('upgrade', (request, socket, head) => {
  const {pathname} = new URL(request.url, `http://${request.headers.host}`);

  if(pathname.startsWith('/yjs')){
    yws.handleUpgrade(request, socket, head, (ws) => {
      yws.emit('connection', ws,request);
    })
  };
})
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
