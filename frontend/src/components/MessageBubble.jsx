import { useState } from "react";
import { MoreVertical, Edit2, Trash2, Download, X, Check } from "lucide-react";
import Markdown from "react-markdown";
import MarkdownViewer from "./MarkdownViewer";

const MessageBubble = ({ msg, isMe, onEdit, onDelete, onDownload }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(msg.text);

  const handleEdit = () => {
    if (editText.trim() && editText !== msg.text) {
      onEdit(msg.id, editText);
      setIsEditing(false);
    }
  };

  const handleCancelEdit = () => {
    setEditText(msg.text);
    setIsEditing(false);
  };

  const renderFile = () => {
    if (!msg.file) return null;

    const isImage = msg.file.type?.startsWith("image/");
    
    if (isImage) {
      return (
        <div className="mb-2">
          <img 
            src={msg.file.url} 
            alt={msg.file.name}
            className="max-w-xs rounded-lg cursor-pointer hover:opacity-90"
            onClick={() => window.open(msg.file.url, '_blank')}
          />
        </div>
      );
    }

    return (
      <div className="mb-2 flex items-center gap-2 bg-black/20 rounded-lg p-3">
        <div className="flex-1">
          <p className="text-sm font-medium">{msg.file.name}</p>
          <p className="text-xs opacity-70">
            {(msg.file.size / 1024 / 1024).toFixed(2)} MB
          </p>
        </div>
        <button
          onClick={() => onDownload(msg.file.url, msg.file.name)}
          className="p-2 hover:bg-white/10 rounded-lg transition"
        >
          <Download size={18} />
        </button>
      </div>
    );
  };

  return (
    <div className={`flex ${isMe ? "justify-end" : "justify-start"} group`}>
      <div className="relative max-w-xs">
        <div
          className={`px-4 py-2 rounded-xl text-sm ${
            msg.isDeleted 
              ? "bg-gray-600/50 italic text-gray-400"
              : "bg-purple-800 text-white"
          }`}
        >
          <div className="text-xs mb-1 text-white/70 flex items-center justify-between">
            <span>{msg.senderName}</span>
            {isMe && !msg.isDeleted && !isEditing && (
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1 hover:bg-white/20 rounded opacity-0 group-hover:opacity-100 transition"
              >
                <MoreVertical size={14} />
              </button>
            )}
          </div>

          {renderFile()}

          {isEditing ? (
            <div className="flex gap-2 items-center">
              <input
                type="text"
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="flex-1 bg-white/20 px-2 py-1 rounded outline-none"
                onKeyPress={(e) => e.key === "Enter" && handleEdit()}
                autoFocus
              />
              <button onClick={handleEdit} className="p-1 hover:bg-white/20 rounded">
                <Check size={16} />
              </button>
              <button onClick={handleCancelEdit} className="p-1 hover:bg-white/20 rounded">
                <X size={16} />
              </button>
            </div>
          ) : (
            <>
              <MarkdownViewer content = {msg.text} />
              {msg.isEdited && !msg.isDeleted && (
                <span className="text-xs opacity-60 ml-2">(edited)</span>
              )}
            </>
          )}
        </div>

        {/* Message Menu */}
        {showMenu && isMe && !msg.isDeleted && (
          <div className="absolute right-0 top-8 bg-gray-800 rounded-lg shadow-lg py-1 z-10 min-w-[120px]">
            <button
              onClick={() => {
                setIsEditing(true);
                setShowMenu(false);
              }}
              className="w-full px-4 py-2 text-left hover:bg-gray-700 flex items-center gap-2 text-sm"
            >
              <Edit2 size={14} />
              Edit
            </button>
            <button
              onClick={() => {
                onDelete(msg.id);
                setShowMenu(false);
              }}
              className="w-full px-4 py-2 text-left hover:bg-gray-700 flex items-center gap-2 text-sm text-red-400"
            >
              <Trash2 size={14} />
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;