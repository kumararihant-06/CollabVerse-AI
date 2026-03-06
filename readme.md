# CollabVerse AI

A real-time collaborative development platform that combines a multi-user code editor, AI pair programming, project chat, file management, and video calling - all in one workspace.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture Overview](#architecture-overview)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Environment Variables](#environment-variables)
  - [Installation](#installation)
  - [Running the App](#running-the-app)
- [API Reference](#api-reference)
- [Real-Time System](#real-time-system)
- [How CRDT Collaboration Works](#how-crdt-collaboration-works)
- [Supported Languages](#supported-languages)

---

## Features

- **Real-Time Collaborative Editing** — Multiple users edit the same file simultaneously. Changes sync instantly using Yjs CRDT over WebSockets — no refresh needed.
- **AI Pair Programmer** — Powered by Gemini 2.5 Flash. Ask it to write code, debug errors, or explain concepts directly in the project chat.
- **Code Execution** — Run code in 10+ languages in the browser via the Wandbox API. No server-side sandboxing required.
- **Project File System** — Create, rename, and delete files per project. Supports JavaScript, Python, C++, Java, TypeScript, and more.
- **Project Chat** — Real-time messaging with edit and delete support, per project.
- **Video Calling** — WebRTC-based peer-to-peer video calls within a project workspace.
- **Authentication** — JWT-based auth with token blacklisting via Redis on logout.
- **Last Edited Tracking** — Every file tracks who last edited it and when, updated live across all connected users.

---

## Tech Stack

### Backend
| Technology | Purpose |
|---|---|
| Node.js + Express 5 | HTTP API server |
| MongoDB + Mongoose | Database for users, projects, files, messages |
| Socket.IO | Real-time chat, file events, video signalling |
| Yjs + ws | CRDT WebSocket server for collaborative editing |
| Redis (ioredis) | JWT blacklist for secure logout |
| Google Gemini 2.5 Flash | AI pair programming responses |
| Wandbox API | Remote code execution |
| JWT + bcrypt | Authentication and password hashing |


### Frontend
| Technology | Purpose |
|---|---|
| React 19 + Vite | UI framework and build tool |
| Monaco Editor | VS Code-style code editor in the browser |
| Yjs + y-monaco + y-websocket | CRDT client — syncs editor state in real time |
| Socket.IO Client | Chat, file events, video signalling |
| Tailwind CSS v4 | Styling |
| React Router v7 | Client-side routing |
| React Split | Resizable panel layouts |
| Lucide React | Icons |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                    Frontend (Vite)                  │
│                                                     │
│  Monaco Editor ←→ y-monaco ←→ Yjs Doc               │
│                                   ↕                 │
│                          y-websocket client         │
└──────────────────────┬──────────────────────────────┘
                       │ HTTP (Axios)    │ WebSocket
                       ↓                 ↓
┌──────────────────────────────────────────────────────┐
│                  Backend (Express)                   │
│                                                      │
│  REST API (/api/v1/*)    Socket.IO     Yjs WS Server │
│       ↓                     ↓               ↓        │
│   MongoDB              Redis Cache      Y.Doc rooms  │
│                                                      │
│  Gemini API (AI)    Wandbox API (Code Execution)     │
└──────────────────────────────────────────────────────┘
```

Two separate WebSocket systems run on the same HTTP server:
- **Socket.IO** handles chat messages, file events (create/update/delete/rename), and WebRTC video call signalling.
- **Yjs WebSocket Server** (raw `ws`) handles CRDT document sync for the code editor, mounted at `/yjs/*`.

---

## Project Structure

```
CollabVerse-AI/
├── backend/
│   ├── server.js                  # Entry point — HTTP, Socket.IO, Yjs init
│   └── src/
│       ├── app.js                 # Express app, middleware, CORS
│       ├── config/
│       │   └── db.config.js       # MongoDB connection
│       ├── controllers/           # Route handlers
│       │   ├── ai.controllers.js
│       │   ├── codeExecution.controllers.js
│       │   ├── file.controllers.js
│       │   ├── message.controllers.js
│       │   ├── project.controllers.js
│       │   └── user.controllers.js
│       ├── middlewares/
│       │   └── auth.middleware.js # JWT verification + Redis blacklist check
│       ├── models/
│       │   ├── message.models.js
│       │   ├── project.models.js  # Project, File, ActiveUser schemas
│       │   └── user.models.js     # User schema with JWT + bcrypt methods
│       ├── routes/
│       │   ├── index.js           # Mounts all v1 routers under /api
│       │   └── v1/
│       │       ├── ai.routes.js
│       │       ├── codeExecution.routes.js
│       │       ├── file.routes.js
│       │       ├── message.routes.js
│       │       ├── project.routes.js
│       │       └── user.routes.js
│       ├── services/
│       │   ├── ai.services.js          # Gemini API integration
│       │   ├── codeExecution.services.js # Wandbox API integration
│       │   ├── file.services.js        # File CRUD + lastEditedBy updates
│       │   ├── message.services.js
│       │   ├── project.service.js
│       │   ├── redis.service.js        # Redis client
│       │   └── user.services.js
│       ├── socket/
│       │   └── socket.js          # All Socket.IO event handlers
│       └── yjs/
│           └── yjsServer.js       # Yjs CRDT WebSocket server
│
└── frontend/
    ├── index.html
    └── src/
        ├── App.jsx
        ├── main.jsx
        ├── Routes/
        │   └── AppRoutes.jsx       # All page routes
        ├── Pages/
        │   ├── HomePage.jsx
        │   ├── LoginPage.jsx
        │   ├── RegisterPage.jsx
        │   ├── DashboardPage.jsx
        │   ├── ProjectPage.jsx     # Main workspace — chat, files, editor
        │   └── ProfilePage.jsx
        ├── components/
        │   ├── CodeEditor.jsx      # Monaco + Yjs CRDT + autosave
        │   ├── FileTree.jsx        # File browser sidebar
        │   ├── OutputTerminal.jsx  # Code execution output
        │   ├── MessageBubble.jsx   # Chat message with edit/delete
        │   ├── VideoCall.jsx       # WebRTC video call UI
        │   ├── MarkdownViewer.jsx
        │   ├── CreateProjectModal.jsx
        │   └── InviteCollaboratorModal.jsx
        ├── config/
        │   ├── axios.js            # Axios instance with auth interceptor
        │   └── socket.js           # Socket.IO client singleton
        └── context/
            ├── User.context.jsx
            └── FileSystem.context.jsx
```

---

## Getting Started

### Prerequisites

- Node.js **v20+**
- MongoDB (local or Atlas)
- Redis (local or cloud — e.g. Redis Cloud)
- A Google Gemini API key
- An ImageKit account (for file uploads)

---

### Environment Variables

#### `backend/.env`

```env
PORT=3000
FRONTEND_URL=http://localhost:5173

# MongoDB
MONGO_URI=mongodb://localhost:27017/collabverse

# JWT
JWT_SECRET=your_jwt_secret_here

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Google Gemini
GEMINI_API_KEY=your_gemini_api_key_here

# ImageKit
IMAGEKIT_PUBLIC_KEY=your_imagekit_public_key
IMAGEKIT_PRIVATE_KEY=your_imagekit_private_key
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_id
```

#### `frontend/.env`

```env
VITE_API_URL=http://localhost:3000/api/v1
VITE_SOCKET_URL=http://localhost:3000
```

> **Note:** `VITE_API_URL` already includes `/api/v1`. All Axios calls in the frontend should use paths like `/user/login`, `/file/save-content` — without repeating `/v1/`.

---

### Installation

```bash
# Clone the repo
git clone https://github.com/your-username/collabverse-ai.git
cd collabverse-ai

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

---

### Running the App

**Start the backend:**
```bash
cd backend
npm start        # uses nodemon — auto-restarts on file changes
```

**Start the frontend:**
```bash
cd frontend
npm run dev
```

The app will be available at `http://localhost:5173`.

---

## API Reference

All endpoints are prefixed with `/api/v1`. Protected routes require a `Bearer <token>` Authorization header.

### Auth — `/user`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/user/register` | ❌ | Register a new user |
| POST | `/user/login` | ❌ | Login, returns JWT |
| POST | `/user/logout` | ✅ | Logout, blacklists token in Redis |
| GET | `/user/profile` | ✅ | Get current user profile |

### Projects — `/project`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/project/create` | ✅ | Create a new project |
| GET | `/project/get-projects` | ✅ | Get all projects for current user |
| GET | `/project/get-project/:projectId` | ✅ | Get a single project by ID |
| POST | `/project/invite` | ✅ | Invite a collaborator by email |

### Files — `/file`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/file/get-files/:projectId` | ✅ | Get all files in a project |
| POST | `/file/save-content` | ✅ | Save file content, updates `lastEditedBy` |

### Messages — `/message`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/message/get-message/:projectId` | ✅ | Fetch message history for a project |

### AI — `/ai`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/ai/generate` | ✅ | Send a prompt to Gemini, get a response |

### Code Execution — `/code`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/code/execute` | ✅ | Execute code via Wandbox API |

**Request body:**
```json
{
  "code": "console.log('hello')",
  "language": "javascript"
}
```

**Response:**
```json
{
  "success": true,
  "output": "hello\n"
}
```

---

## Real-Time System

### Socket.IO Events

The Socket.IO server handles chat, file lifecycle events, and WebRTC signalling. All events require the socket to be authenticated via JWT in `socket.handshake.auth.token`.

#### Client → Server

| Event | Payload | Description |
|-------|---------|-------------|
| `join-project` | `projectId` | Join a project room |
| `send-message` | `{ projectId, message }` | Send a chat message |
| `edit-message` | `{ messageId, newText, projectId }` | Edit a sent message |
| `delete-message` | `{ messageId, projectId }` | Soft-delete a message |
| `create-file` | `{ projectId, fileName, language }` | Create a new file |
| `update-file` | `{ projectId, fileName, content }` | Update file, broadcasts `lastEditedBy` |
| `join-video-call` | `{ projectId }` | Join the project video call |
| `leave-video-call` | `{ projectId }` | Leave the video call |
| `call-offer` | `{ projectId, offer, targetUserId }` | WebRTC offer |
| `call-answer` | `{ projectId, answer, targetUserId }` | WebRTC answer |
| `ice-candidate` | `{ projectId, candidate, targetUserId }` | ICE candidate |

#### Server → Client

| Event | Payload | Description |
|-------|---------|-------------|
| `receive-message` | message object | New chat message broadcast |
| `message-edited` | message object | Edited message broadcast |
| `message-deleted` | `{ messageId }` | Deleted message broadcast |
| `file-created` | `{ file, createdBy }` | New file created in project |
| `file-updated` | `{ fileName, content, lastEditedBy, lastEditedAt }` | File saved — updates editor state and header |
| `file-deleted` | `{ fileName }` | File deleted |
| `file-renamed` | `{ oldName, newName }` | File renamed |
| `user-joined-call` | `{ userId, username }` | A user joined the video call |
| `user-left-call` | `{ userId, username }` | A user left the video call |

---

## How CRDT Collaboration Works

CollabVerse uses **Yjs** (a CRDT library) to sync code changes between users in real time without conflicts.

```
User A types               User B types
     ↓                          ↓
  Y.Doc (local)            Y.Doc (local)
     ↓                          ↓
y-websocket client ←→ Yjs WS Server (/yjs/roomName) ←→ y-websocket client
                          Y.Doc (server)
```

1. Each project file gets its own Yjs **room** on the server, named `{projectId}-{fileName}`.
2. When a user opens a file, a `WebsocketProvider` connects to `ws://localhost:3000/yjs/{projectId}-{fileName}`.
3. The server sends a **sync step 1** message, the client responds with its state, and the server sends back any missing updates — both sides converge to the same document.
4. Every keystroke is encoded as a **Yjs update** (a small binary delta) and broadcast to all other clients in the room instantly.
5. On first load, the editor waits for the sync to complete (`provider.once('sync', ...)`) before inserting the saved file content — this prevents duplication on refresh.
6. **Autosave** fires 2 seconds after the user stops typing. It only triggers for local changes (`transaction.origin !== provider`) so user B doesn't get credited for user A's edits.

---

## Supported Languages

Code execution is powered by the [Wandbox](https://wandbox.org) API. The following languages are supported:

| Language | Compiler |
|----------|----------|
| JavaScript | Node.js (latest stable) |
| Python | CPython (latest stable) |
| C++ | GCC (latest stable) |
| C | GCC (latest stable) |
| Java | OpenJDK (latest stable) |


The compiler is selected dynamically at runtime by querying Wandbox's compiler list and picking the latest stable version  no hardcoded compiler names.