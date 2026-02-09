import React, { useState, useEffect, useContext } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Users, X, Send } from "lucide-react";
import axios from "../config/axios.js";
import { UserContext } from "../context/User.context.jsx";
import InviteCollaboratorModal from "../components/InviteCollaboratorModal.jsx";
import { connectSocket, getSocket } from "../config/socket.js";
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

  async function fetchProject() {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`/project/get-project/${projectId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log(response.data.project);
      setProject(response.data.project);
    } catch (error) {
      console.log(
        "Error fetching project: ",
        error.response?.data || error.message,
      );
      alert("Failed to fetch project.");
    } finally {
      setLoading(false);
    }
  }

  async function fetchMessages() {
    try {
      const res = await axios.get(`/message/get-message/${projectId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      const formatted = res.data.messages.map((m) => ({
        id: m._id,
        text: m.text,
        senderName: m.sender.username,
        senderId:String(m.sender?._id ),
        isMe: String(m.sender?._id ) === String(user.user?._id)
      }));
      setMessages(formatted);
    } catch (error) {
      console.log("Fetch old messages error:", error);
    }
  }

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    let socket = getSocket();
    if(!socket){
      socket = connectSocket();
    }

    socket.emit("send-message", {
      projectId,
      message: newMessage,
    });

    setNewMessage("");
  };
  useEffect(() => {
    if(!user) return;
    
    let socket = getSocket();
    if(!socket){
      socket = connectSocket();
    }
    socket.emit("join-project", projectId);
    fetchMessages();
    socket.on("receive-message", (msg) => {
      console.log(msg);
      setMessages((prev) => [
        ...prev,
        {
          id: msg._id,
          text: msg.text,
          senderName: msg.sender?.username,
          senderId: String(msg.sender?._id || ''),
          isMe: String(msg.sender?._id ) === String(user?.user._id),
        },
      ]);
    });

    return () => {
      socket.off("receive-message");
    };
  }, [projectId, user]);

  useEffect(() => {
    if (!user && !userLoading) {
      navigate("/login");
      return;
    }
    fetchProject();
  }, [projectId, user, userLoading]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0b0616] via-[#1a0b2e] to-[#2b0f45] text-white flex flex-col">
      {/* HEADER */}
      <header className="h-16 border-b border-white/10 flex items-center justify-between px-6">
        {/* LEFT SIDE */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/dashboard")}
            className="p-2 rounded-lg hover:bg-white/10 transition"
          >
            <ArrowLeft size={20} />
          </button>

          <h1 className="text-lg font-semibold">
            {project?.name || "Project Workspace"}
          </h1>
        </div>

        {/* RIGHT SIDE */}
        <div className="flex items-center gap-1">
          {/* Collaborator avatars (click to toggle panel) */}
          <div
            onClick={() => setIsCollaboratorPanelOpen(true)}
            className="flex items-center gap-1 px-2 hover:cursor-pointer rounded-lg hover:bg-white/10 transition"
            title="View collaborators"
          >
            <button
              onClick={() => setIsCollaboratorPanelOpen((prev) => !prev)}
              className="p-1 rounded-lg hover:cursor-pointer"
              title="Open collaborators"
            >
              <Users size={20} />
            </button>
            <h2 className="p-1">{project?.users ? project.users.length : 0}</h2>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <div className="flex flex-1 overflow-hidden">
        <div className="w-2/6 border-r border-white/10 p-6 flex flex-col">
          <div className="flex w-full justify-between items-center mb-4 border-b border-white/10  px-6 py-3">
            <h2 className="text-lg font-semibold">Project Chat.</h2>

            <button
              onClick={() => setIsInviteModalOpen(true)}
              className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 transition text-sm font-medium "
            >
              + Invite
            </button>
          </div>
          <div className="flex-1 overflow-y-auto overflow-x-hidden space-y-4 pr-2">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.isMe ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-xs px-4 py-2 rounded-xl text-sm ${
                    msg.isMe
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                      : "bg-gradient-to-r  from-pink-400 to-purple-400 text-white"
                  }`}
                >
                  <div className={`text-xs mb-1  text-white/70`}>
                    {msg.senderName}
                  </div>
                  {msg.text}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4">
            <div className="flex items-end gap-3 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 backdrop-blur-xl">
              <input
                value={newMessage}
                onChange={(e) => {
                  setNewMessage(e.target.value);
                  e.target.style.height = "auto";
                  e.target.style.height = e.target.scrollHeight + "px";
                }}
                placeholder="Type a message..."
                rows={1}
                className="flex-1 bg-transparent outline-none resize-none text-white placeholder-gray-400 max-h-32 overflow-y-auto leading-relaxed"
              />

              <button
                onClick={handleSendMessage}
                className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90 transition"
              >
                <Send size={20} />
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 p-6">
          <div className="h-full rounded-2xl border border-white/10 bg-white/5 flex items-center justify-center text-gray-500">
            Workspace Area (Coming Soon 🚀)
          </div>
        </div>
      </div>

      {/* COLLABORATOR PANEL */}
      {isCollaboratorPanelOpen && (
        <div className="fixed top-0 left-0 h-full w-80 border-l border-white/10 bg-[#0b0616]/90 backdrop-blur-xl p-6 z-50 transition">
          <button
            onClick={() => setIsCollaboratorPanelOpen(false)}
            className="absolute -right-10 top-4 p-2 rounded-full bg-white/5 hover:bg-white/10"
          >
            <X size={18} />
          </button>

          <h2 className="text-lg font-semibold mb-4">Collaborators</h2>

          <div className="flex flex-col gap-3">
            {project?.users && project.users.length > 0 ? (
              project.users.map((u, idx) => {
                const isString = typeof u === "string";
                const name = isString
                  ? u.slice(0, 6)
                  : u.username || u.email || "Unknown";
                const initial = (
                  isString ? name.charAt(0) : u.username?.charAt(0) || "U"
                ).toUpperCase();
                return (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center font-semibold">
                      {initial}
                    </div>
                    <div>
                      <div className="font-medium">
                        {isString ? name : u.username || u.email}
                      </div>
                      <div className="text-gray-400 text-sm">
                        {!isString && u.email}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-gray-400 text-sm">No collaborators yet.</p>
            )}
          </div>
        </div>
      )}

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
