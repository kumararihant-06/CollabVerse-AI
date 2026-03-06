import * as Y from 'yjs';
import * as awarenessProtocol from 'y-protocols/awareness.js';
import * as syncProtocol from 'y-protocols/sync.js';
import * as encoding from 'lib0/encoding.js';
import * as decoding from 'lib0/decoding.js';
import { WebSocketServer } from 'ws';

const MESSAGE_SYNC = 0;
const MESSAGE_AWARENESS = 1;

// Map: roomName -> { doc: Y.Doc, awareness: Awareness, conns: Map<WebSocket, Set<number>> }
const rooms = new Map();

function getOrCreateRoom(roomName) {
  if (rooms.has(roomName)) return rooms.get(roomName);

  const doc = new Y.Doc();
  const awareness = new awarenessProtocol.Awareness(doc);

  awareness.on('update', ({ added, updated, removed }) => {
    const room = rooms.get(roomName);
    if (!room) return;

    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, MESSAGE_AWARENESS);
    encoding.writeVarUint8Array(
      encoder,
      awarenessProtocol.encodeAwarenessUpdate(awareness, [...added, ...updated, ...removed])
    );
    const message = encoding.toUint8Array(encoder);

    room.conns.forEach((_, conn) => {
      if (conn.readyState === conn.OPEN) conn.send(message);
    });
  });

  const room = { doc, awareness, conns: new Map() };
  rooms.set(roomName, room);
  return room;
}

function closeConn(roomName, conn) {
  const room = rooms.get(roomName);
  if (!room) return;

  const controlledIds = room.conns.get(conn);
  room.conns.delete(conn);

  if (controlledIds) {
    awarenessProtocol.removeAwarenessStates(room.awareness, [...controlledIds], null);
  }

  if (room.conns.size === 0) {
    room.awareness.destroy();
    rooms.delete(roomName);
  }
}

function safeSend(conn, message) {
  if (conn.readyState === conn.OPEN) {
    try {
      conn.send(message);
    } catch (err) {
      console.error('WebSocket send error:', err);
      conn.close();
    }
  }
}

function setupWSConnection(conn, req, roomName) {
  const room = getOrCreateRoom(roomName);
  room.conns.set(conn, new Set());
  conn.binaryType = 'arraybuffer';

  // Send sync step 1 (initial document state handshake)
  const syncEncoder = encoding.createEncoder();
  encoding.writeVarUint(syncEncoder, MESSAGE_SYNC);
  syncProtocol.writeSyncStep1(syncEncoder, room.doc);
  safeSend(conn, encoding.toUint8Array(syncEncoder));

  // Send current awareness states
  const awarenessStates = room.awareness.getStates();
  if (awarenessStates.size > 0) {
    const awarenessEncoder = encoding.createEncoder();
    encoding.writeVarUint(awarenessEncoder, MESSAGE_AWARENESS);
    encoding.writeVarUint8Array(
      awarenessEncoder,
      awarenessProtocol.encodeAwarenessUpdate(room.awareness, [...awarenessStates.keys()])
    );
    safeSend(conn, encoding.toUint8Array(awarenessEncoder));
  }

  // Broadcast doc updates to all other clients in the room
  const onDocUpdate = (update, origin) => {
    if (origin === conn) return;
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, MESSAGE_SYNC);
    syncProtocol.writeUpdate(encoder, update);
    const message = encoding.toUint8Array(encoder);
    room.conns.forEach((_, otherConn) => {
      if (otherConn !== conn) safeSend(otherConn, message);
    });
  };
  room.doc.on('update', onDocUpdate);

  conn.on('message', (rawMessage) => {
    try {
      const decoder = decoding.createDecoder(new Uint8Array(rawMessage));
      const encoder = encoding.createEncoder();
      const messageType = decoding.readVarUint(decoder);

      switch (messageType) {
        case MESSAGE_SYNC: {
          encoding.writeVarUint(encoder, MESSAGE_SYNC);
          syncProtocol.readSyncMessage(decoder, encoder, room.doc, conn);
          if (encoding.length(encoder) > 1) safeSend(conn, encoding.toUint8Array(encoder));
          break;
        }
        case MESSAGE_AWARENESS: {
          awarenessProtocol.applyAwarenessUpdate(
            room.awareness,
            decoding.readVarUint8Array(decoder),
            conn
          );
          break;
        }
        default:
          console.warn(`[Yjs] Unknown message type: ${messageType}`);
      }
    } catch (err) {
      console.error('[Yjs] Error processing message:', err);
    }
  });

  conn.on('close', () => {
    room.doc.off('update', onDocUpdate);
    closeConn(roomName, conn);
  });

  conn.on('error', (err) => {
    console.error(`[Yjs] Connection error in room "${roomName}":`, err);
    room.doc.off('update', onDocUpdate);
    closeConn(roomName, conn);
  });
}

export function initializeYjs(server) {
  const yws = new WebSocketServer({ noServer: true });

  yws.on('connection', (conn, req) => {
    const roomName = req.url.replace(/^\/yjs\/?/, '').split('?')[0] || 'default';
    setupWSConnection(conn, req, roomName);
  });

  server.on('upgrade', (request, socket, head) => {
    const { pathname } = new URL(request.url, `http://${request.headers.host}`);
    if (pathname.startsWith('/yjs')) {
      yws.handleUpgrade(request, socket, head, (ws) => {
        yws.emit('connection', ws, request);
      });
    }
  });
}