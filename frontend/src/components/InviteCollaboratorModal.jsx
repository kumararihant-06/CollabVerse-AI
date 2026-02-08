import { useState } from "react";
import axios from "../config/axios";
import { X } from "lucide-react";

export default function InviteCollaboratorModal({
  isOpen,
  onClose,
  projectId,
  onSuccess
}) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleInvite = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      // STEP 1 → Find User
      const userRes = await axios.post(
        "/user/user-info",
        { email },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      const userId = userRes.data.user._id;

      // STEP 2 → Add User To Project
      const projectRes = await axios.put(
        "/project/add-user",
        {
          projectId,
          users: [userId]
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      onSuccess(projectRes.data.project);

      setEmail("");
      onClose();

    } catch (error) {
      console.log(error);
      alert(error.response?.data?.message || "Invite failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">

      <div className="bg-[#12081f] p-6 rounded-2xl w-full max-w-md border border-white/10">

        <div className="flex justify-between mb-6">
          <h2 className="text-xl font-semibold">Invite Collaborator</h2>
          <button onClick={onClose}>
            <X />
          </button>
        </div>

        <form onSubmit={handleInvite} className="space-y-4">

          <input
            type="email"
            placeholder="Enter collaborator email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 rounded-xl bg-black/40 border border-white/10"
          />

          <button
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500"
          >
            {loading ? "Inviting..." : "Invite"}
          </button>

        </form>

      </div>
    </div>
  );
}
