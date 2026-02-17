import React, { useState, useEffect, useContext, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Users, X, Send } from "lucide-react";
import Split from 'react-split';
import axios from "../config/axios.js";
import { UserContext } from "../context/User.context.jsx";
import InviteCollaboratorModal from "../components/InviteCollaboratorModal.jsx";
import { connectSocket, getSocket } from "../config/socket.js";
import MarkdownViewer from "../components/MarkdownViewer.jsx";
import FileTree from "../components/FileTree.jsx";
import CodeEditor from "../components/CodeEditor.jsx";
import OutputTerminal from "../components/OutputTerminal.jsx";

const ProjectPage = () => {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isCollaboratorPanelOpen, setIsCollaboratorPanelOpen] = useState(false);
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user, loading: userLoading } = useContext(UserContext);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  
  // File system state
  const [files, setFiles] = useState([]);
  const [activeFile, setActiveFile] = useState(null);
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);

  const messagesEndRef = useRef(null);

  const activeFileRef = useRef(activeFile);
  useEffect(() => { activeFileRef.current = activeFile; }, [activeFile]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behaviour: "smooth" });
  };

  async function fetchProject() {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`/project/get-project/${projectId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setProject(response.data.project);
    } catch (error) {
      console.log("Error fetching project: ", error.response?.data || error.message);
      alert("Failed to fetch project.");
    } finally {
      setLoading(false);
    }
  }

  async function fetchMessages() {
    if (!user) {
      console.log("User not loaded yet, skipping fetchMessages");
      return;
    }
    try {
      const res = await axios.get(`/message/get-message/${projectId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const formatted = res.data.messages.map((m) => {
        const senderId = String(m.sender?._id || "");
        return {
          id: m._id,
          text: m.text,
          senderName: m.sender?.username || "Unknown",
          senderId: senderId,
        };
      });
      setMessages(formatted);
    } catch (error) {
      console.log("Fetch old messages error:", error);
    }
  }

  async function fetchFiles() {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`/file/get-files/${projectId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      const fetchedFiles = response.data.files || [];
      setFiles(fetchedFiles);
      
      if (fetchedFiles.length > 0 && !activeFileRef.current) {
        setActiveFile(fetchedFiles[0].name);
      }
    } catch (error) {
      console.log("Error fetching files:", error);
    }
  }

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    let socket = getSocket();
    if (!socket) {
      socket = connectSocket();
    }

    socket.emit("send-message", {
      projectId,
      message: newMessage,
    });

    setNewMessage("");
  };

  // Handle file selection
  const handleFileSelect = (fileName) => {
    setActiveFile(fileName);
  };

  // Handle file content change
  const handleFileContentChange = (fileName, content) => {
    setFiles(prevFiles =>
      prevFiles.map(f =>
        f.name === fileName ? { ...f, content } : f
      )
    );
  };

  // Get active file object
  const getActiveFileObject = () => {
    return files.find(f => f.name === activeFile);
  };

  // Initialize socket and listeners
  useEffect(() => {
    if (userLoading) return;
    if (!user) return;

    fetchMessages();
    fetchFiles();

    let socket = getSocket();
    if (!socket) {
      socket = connectSocket();
    }
    
    socket.emit("join-project", projectId);

    // ========== CHAT MESSAGE EVENTS ==========
    socket.on("receive-message", (msg) => {
      setMessages((prev) => [
        ...prev,
        {
          id: msg._id,
          text: msg.text,
          senderName: msg.sender?.username || "Unknown",
          senderId: String(msg.sender?._id || ""),
        },
      ]);
    });

    // ========== FILE EVENTS ==========
    
    // ✅ FIX: File created - use functional update so we read current files, not stale snapshot
    socket.on("file-created", ({ file, createdBy }) => {
      console.log(`📄 File created: ${file.name} by ${createdBy}`);
      setFiles(prev => {
        // Auto-select if this is the very first file
        if (prev.length === 0) {
          setActiveFile(file.name);
        }
        return [...prev, file];
      });
    });

    // File updated - functional update, no stale refs needed
    socket.on("file-updated", ({ fileName, content, lastEditedBy }) => {
      console.log(`✏️ File updated: ${fileName} by ${lastEditedBy}`);
      setFiles(prevFiles =>
        prevFiles.map(f =>
          f.name === fileName ? { ...f, content, lastEditedBy: { username: lastEditedBy } } : f
        )
      );
    });

    // ✅ FIX: File deleted - use activeFileRef to get current activeFile value
    socket.on("file-deleted", ({ fileName, deletedBy }) => {
      console.log(`🗑️ File deleted: ${fileName} by ${deletedBy}`);
      setFiles(prev => {
        const remaining = prev.filter(f => f.name !== fileName);
        // If the deleted file was active, switch to first remaining
        if (activeFileRef.current === fileName) {
          setActiveFile(remaining.length > 0 ? remaining[0].name : null);
        }
        return remaining;
      });
    });

    // ✅ FIX: File renamed - use activeFileRef to get current activeFile value
    socket.on("file-renamed", ({ oldName, newName, renamedBy }) => {
      console.log(`📝 File renamed: ${oldName} → ${newName} by ${renamedBy}`);
      setFiles(prevFiles =>
        prevFiles.map(f =>
          f.name === oldName ? { ...f, name: newName } : f
        )
      );
      // Update active file if it was renamed
      if (activeFileRef.current === oldName) {
        setActiveFile(newName);
      }
    });

    // Socket error
    socket.on("error", ({ message }) => {
      console.error("Socket error:", message);
      alert(message);
    });

    return () => {
      socket.off("receive-message");
      socket.off("file-created");
      socket.off("file-updated");
      socket.off("file-deleted");
      socket.off("file-renamed");
      socket.off("error");
    };
  }, [projectId, user, userLoading]);

  useEffect(() => {
    if (!user && !userLoading) {
      navigate("/login");
      return;
    }
    fetchProject();
  }, [projectId, user, userLoading]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (loading || userLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-[#0b0616] via-[#1a0b2e] to-[#2b0f45] text-white">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#1e1e1e] flex flex-col overflow-hidden">
      {/* HEADER */}
      <header className="h-14 border-b border-white/10 flex items-center justify-between px-4 bg-[#0b0616] flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/dashboard")}
            className="p-2 hover:bg-white/10 rounded-lg transition"
          >
            <ArrowLeft size={20} className="text-white" />
          </button>
          <h1 className="text-lg font-semibold text-white">
            {project?.name || "Project Workspace"}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsInviteModalOpen(true)}
            className="px-3 py-1.5 text-sm bg-purple-600 hover:bg-purple-700 text-white rounded transition"
          >
            + Invite
          </button>
          <div
            onClick={() => setIsCollaboratorPanelOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 hover:bg-white/10 rounded cursor-pointer transition"
          >
            <Users size={18} className="text-white" />
            <span className="text-sm text-white">{project?.users?.length || 0}</span>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT - 3 PANEL LAYOUT */}
      <div className="flex-1 overflow-hidden">
        <Split
          sizes={[25, 20, 55]}
          minSize={200}
          gutterSize={8}
          className="flex h-full split-container"
        >
          {/* LEFT PANEL - CHAT */}
          <div className="h-full flex flex-col bg-[#0b0616] overflow-hidden">
            <div className="p-3 border-b border-white/10">
              <h2 className="text-sm font-semibold text-white">Project Chat</h2>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3 no-scrollbar">
              {messages.map((msg) => (
                <div key={msg.id} className="bg-white/5 rounded-lg p-3">
                  <div className="text-xs text-purple-400 mb-1">{msg.senderName}</div>
                  <div className="text-sm text-white">
                    <MarkdownViewer content={msg.text} />
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-3 border-t border-white/10">
              <div className="flex gap-2">
                <input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded text-white text-sm outline-none focus:border-purple-500"
                />
                <button
                  onClick={handleSendMessage}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded transition"
                >
                  <Send size={16} className="text-white" />
                </button>
              </div>
            </div>
          </div>

          {/* MIDDLE PANEL - FILE TREE */}
          <div className="h-full overflow-hidden">
            <FileTree
              files={files}
              activeFile={activeFile}
              onFileSelect={handleFileSelect}
              projectId={projectId}
            />
          </div>

          {/* RIGHT PANEL - CODE EDITOR + OUTPUT */}
          <div className="h-full overflow-hidden">
            <Split
              direction="vertical"
              sizes={[70, 30]}
              minSize={100}
              gutterSize={8}
              className="flex flex-col h-full"
            >
              {/* Code Editor */}
              <div className="overflow-hidden">
                <CodeEditor
                  file={getActiveFileObject()}
                  projectId={projectId}
                  onContentChange={handleFileContentChange}
                  setOutput={setOutput}
                  isRunning={isRunning}
                  setIsRunning={setIsRunning}
                />
              </div>

              {/* Output Terminal */}
              <div className="overflow-hidden">
                <OutputTerminal
                  output={output}
                  onClear={() => setOutput('')}
                />
              </div>
            </Split>
          </div>
        </Split>
      </div>

      {/* COLLABORATOR PANEL (Slide-in) */}
      {isCollaboratorPanelOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-end">
          <div className="w-80 h-full bg-[#0b0616] border-l border-white/10 p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-white">Collaborators</h2>
              <button
                onClick={() => setIsCollaboratorPanelOpen(false)}
                className="p-2 hover:bg-white/10 rounded transition"
              >
                <X size={18} className="text-white" />
              </button>
            </div>

            <div className="space-y-3">
              {project?.users && project.users.length > 0 ? (
                project.users.map((u, idx) => {
                  const isString = typeof u === "string";
                  const name = isString ? u.slice(0, 6) : u.username || u.email || "Unknown";
                  const initial = (isString ? name.charAt(0) : u.username?.charAt(0) || "U").toUpperCase();
                  
                  return (
                    <div key={idx} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                      <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center font-semibold text-white">
                        {initial}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-white text-sm">
                          {isString ? name : u.username || u.email}
                        </div>
                        {!isString && u.email && (
                          <div className="text-gray-400 text-xs">{u.email}</div>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-gray-400 text-sm text-center">No collaborators yet.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* INVITE MODAL */}
      <InviteCollaboratorModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        projectId={projectId}
        onSuccess={(updatedProject) => setProject(updatedProject)}
      />
    </div>
  );
};

export default ProjectPage;