import React, { useState } from 'react';
import { File, Trash2, Plus, X } from 'lucide-react';
import { getSocket } from '../config/socket';

const FileTree = ({ files, activeFile, onFileSelect, projectId }) => {
  const [showInput, setShowInput] = useState(false);
  const [newFileName, setNewFileName] = useState('');

  const handleCreateFile = () => {
    if (!newFileName.trim()) return;
    
    const socket = getSocket();
    if (!socket) {
      alert('Socket not connected');
      return;
    }

    // Determine language from extension
    const ext = newFileName.split('.').pop().toLowerCase();
    const languageMap = {
      'js': 'javascript',
      'jsx': 'javascript',
      'py': 'python',
      'cpp': 'cpp',
      'c': 'c',
      'java': 'java',
    };
    const language = languageMap[ext] || 'javascript';

    socket.emit('create-file', {
      projectId,
      fileName: newFileName,
      language
    });

    setNewFileName('');
    setShowInput(false);
  };

  const handleDeleteFile = (fileName, e) => {
    e.stopPropagation();
    
    if (!confirm(`Delete ${fileName}?`)) return;

    const socket = getSocket();
    if (!socket) {
      alert('Socket not connected');
      return;
    }

    socket.emit('delete-file', {
      projectId,
      fileName
    });
  };

  const getFileIcon = (fileName) => {
    const ext = fileName.split('.').pop().toLowerCase();
    const colors = {
      'js': 'text-yellow-400',
      'jsx': 'text-yellow-400',
      'py': 'text-blue-400',
      'cpp': 'text-purple-400',
      'c': 'text-green-400',
      'java': 'text-red-400',
    };
    return colors[ext] || 'text-gray-400';
  };

  return (
    <div className="h-full bg-[#1a1a1a] border-r border-white/10 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-white">Files</h2>
        <button
          onClick={() => setShowInput(true)}
          className="p-1 hover:bg-white/10 rounded transition"
          title="New File"
        >
          <Plus size={16} className="text-white" />
        </button>
      </div>

      {/* New File Input */}
      {showInput && (
        <div className="p-2 border-b border-white/10 bg-[#0d0d0d]">
          <div className="flex gap-2">
            <input
              type="text"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleCreateFile()}
              placeholder="filename.ext"
              className="flex-1 px-2 py-1 text-sm bg-black/30 border border-white/20 rounded text-white outline-none focus:border-purple-500"
              autoFocus
            />
            <button
              onClick={handleCreateFile}
              className="px-3 py-1 bg-purple-600 text-white text-sm rounded hover:bg-purple-700 transition"
            >
              Add
            </button>
            <button
              onClick={() => {
                setShowInput(false);
                setNewFileName('');
              }}
              className="p-1 hover:bg-white/10 rounded transition"
            >
              <X size={16} className="text-white" />
            </button>
          </div>
        </div>
      )}

      {/* File List */}
      <div className="flex-1 overflow-y-auto">
        {files.length === 0 ? (
          <div className="p-4 text-center text-gray-500 text-sm">
            No files yet. Click + to create one!
          </div>
        ) : (
          files.map((file) => (
            <div
              key={file.name}
              onClick={() => onFileSelect(file.name)}
              className={`
                flex items-center justify-between px-4 py-2 cursor-pointer
                hover:bg-white/10 transition group
                ${activeFile === file.name ? 'bg-white/20' : ''}
              `}
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <File size={16} className={getFileIcon(file.name)} />
                <span className="text-sm text-white truncate">{file.name}</span>
              </div>
              <button
                onClick={(e) => handleDeleteFile(file.name, e)}
                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 rounded transition flex-shrink-0"
                title="Delete file"
              >
                <Trash2 size={14} className="text-red-400" />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Footer Info */}
      <div className="p-2 border-t border-white/10 text-xs text-gray-500 text-center">
        {files.length} {files.length === 1 ? 'file' : 'files'}
      </div>
    </div>
  );
};

export default FileTree;