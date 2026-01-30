import { X } from "lucide-react";
import { useState } from "react";

export default function CreateProjectModal({ isOpen, onClose, onCreate }) {
  const [projectName, setProjectName] = useState("");

  if (!isOpen) return null;

  const submitHandler = (e) => {
    e.preventDefault();

    if (!projectName.trim()) return;

    onCreate(projectName);
    setProjectName("");
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-[#12081f] border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">
            Create New Project
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={22} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={submitHandler} className="space-y-5">
          <div>
            <label className="block text-sm text-gray-400 mb-1">
              Project Name
            </label>
            <input
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              type="text"
              placeholder="Enter project name"
              className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              autoFocus
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl border border-white/10 text-gray-300 hover:bg-white/5"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="px-6 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 font-semibold hover:opacity-90 transition"
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
