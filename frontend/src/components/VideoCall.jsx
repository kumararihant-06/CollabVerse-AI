import { useState, useEffect, useRef, useCallback } from "react";
import { Mic, MicOff, Video, VideoOff, PhoneOff, Phone, Users, Minimize2, Maximize2 } from "lucide-react";

const VideoCall = ({ socket, projectId, currentUser, onClose }) => {
  const [localStream, setLocalStream] = useState(null);
  const [peers, setPeers] = useState({}); // { userId: { stream, username, videoOn, audioOn } }
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isJoined, setIsJoined] = useState(false);
  const [participantCount, setParticipantCount] = useState(0);

  const localVideoRef = useRef(null);
  const peerConnections = useRef({}); 
  const localStreamRef = useRef(null);

  const ICE_SERVERS = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
    ],
  };

  // ─── Start local media ───────────────────────────────────────────
  const startLocalStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = stream;
      setLocalStream(stream);
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      return stream;
    } catch (err) {
      console.error("Media error:", err);
      alert("Could not access camera/microphone. Please check permissions.");
      return null;
    }
  };

  // ─── Create peer connection ───────────────────────────────────────
  const createPeerConnection = useCallback((targetUserId, targetUsername) => {
    const pc = new RTCPeerConnection(ICE_SERVERS);

    // Add local tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current);
      });
    }

    // ICE candidates
    pc.onicecandidate = ({ candidate }) => {
      if (candidate) {
        socket.emit("ice-candidate", { projectId, candidate, targetUserId });
      }
    };

    // Remote stream
    pc.ontrack = ({ streams }) => {
      setPeers(prev => ({
        ...prev,
        [targetUserId]: {
          ...prev[targetUserId],
          stream: streams[0],
          username: targetUsername || "Collaborator",
        },
      }));
    };

    pc.onconnectionstatechange = () => {
      if (["disconnected", "failed", "closed"].includes(pc.connectionState)) {
        setPeers(prev => {
          const updated = { ...prev };
          delete updated[targetUserId];
          return updated;
        });
      }
    };

    peerConnections.current[targetUserId] = pc;
    return pc;
  }, [projectId, socket]);

  // ─── Join call ────────────────────────────────────────────────────
  const joinCall = async () => {
    const stream = await startLocalStream();
    if (!stream) return;

    setIsJoined(true);
    // Notify others we joined
    socket.emit("join-video-call", { projectId, username: currentUser.username });
  };

  // ─── Leave call ───────────────────────────────────────────────────
  const leaveCall = () => {
    // Stop all tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop());
      localStreamRef.current = null;
    }
    // Close all peer connections
    Object.values(peerConnections.current).forEach(pc => pc.close());
    peerConnections.current = {};

    socket.emit("leave-video-call", { projectId });
    setIsJoined(false);
    setLocalStream(null);
    setPeers({});
    onClose();
  };

  // ─── Toggle mic ───────────────────────────────────────────────────
  const toggleMic = () => {
    if (!localStreamRef.current) return;
    const enabled = !isMuted;
    localStreamRef.current.getAudioTracks().forEach(t => (t.enabled = enabled));
    setIsMuted(!isMuted);
    socket.emit("toggle-audio", { projectId, enabled });
  };

  // ─── Toggle video ─────────────────────────────────────────────────
  const toggleVideo = () => {
    if (!localStreamRef.current) return;
    const enabled = isVideoOff;
    localStreamRef.current.getVideoTracks().forEach(t => (t.enabled = enabled));
    setIsVideoOff(!isVideoOff);
    socket.emit("toggle-video", { projectId, enabled });
  };

  // ─── Socket events ────────────────────────────────────────────────
  useEffect(() => {
    if (!socket) return;

    // Someone joined → we create offer to them
    socket.on("user-joined-call", async ({ userId, username }) => {
      console.log(`📞 ${username} joined the call`);
      setPeers(prev => ({ ...prev, [userId]: { username, stream: null, videoOn: true, audioOn: true } }));
      setParticipantCount(prev => prev + 1);

      const pc = createPeerConnection(userId, username);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit("call-offer", { projectId, offer, targetUserId: userId });
    });

    // We receive an offer → send answer
    socket.on("call-offer", async ({ offer, fromUserId, fromUsername }) => {
      const pc = createPeerConnection(fromUserId, fromUsername);
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit("call-answer", { projectId, answer, targetUserId: fromUserId });
    });

    // We receive an answer
    socket.on("call-answer", async ({ answer, fromUserId }) => {
      const pc = peerConnections.current[fromUserId];
      if (pc) await pc.setRemoteDescription(new RTCSessionDescription(answer));
    });

    // ICE candidate
    socket.on("ice-candidate", async ({ candidate, fromUserId }) => {
      const pc = peerConnections.current[fromUserId];
      if (pc && candidate) {
        try { await pc.addIceCandidate(new RTCIceCandidate(candidate)); } catch (e) {}
      }
    });

    // Someone left
    socket.on("user-left-call", ({ userId, username }) => {
      console.log(`📴 ${username} left the call`);
      if (peerConnections.current[userId]) {
        peerConnections.current[userId].close();
        delete peerConnections.current[userId];
      }
      setPeers(prev => {
        const updated = { ...prev };
        delete updated[userId];
        return updated;
      });
      setParticipantCount(prev => Math.max(0, prev - 1));
    });

    socket.on("user-toggled-video", ({ userId, enabled }) => {
      setPeers(prev => ({
        ...prev,
        [userId]: { ...prev[userId], videoOn: enabled },
      }));
    });

    socket.on("user-toggled-audio", ({ userId, enabled }) => {
      setPeers(prev => ({
        ...prev,
        [userId]: { ...prev[userId], audioOn: enabled },
      }));
    });

    return () => {
      socket.off("user-joined-call");
      socket.off("call-offer");
      socket.off("call-answer");
      socket.off("ice-candidate");
      socket.off("user-left-call");
      socket.off("user-toggled-video");
      socket.off("user-toggled-audio");
    };
  }, [socket, createPeerConnection, projectId]);

  // Attach remote streams to video elements
  const RemoteVideo = ({ userId, peer }) => {
    const ref = useRef(null);
    useEffect(() => {
      if (ref.current && peer.stream) ref.current.srcObject = peer.stream;
    }, [peer.stream]);

    return (
      <div className="relative bg-gray-800 rounded-xl overflow-hidden aspect-video">
        {peer.stream ? (
          <video ref={ref} autoPlay playsInline className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-purple-600 flex items-center justify-center text-2xl font-bold text-white">
              {peer.username?.[0]?.toUpperCase() || "?"}
            </div>
          </div>
        )}
        <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-1 rounded text-xs text-white flex items-center gap-1">
          {!peer.audioOn && <MicOff size={10} className="text-red-400" />}
          {peer.username}
        </div>
      </div>
    );
  };

  const peerList = Object.entries(peers);
  const totalParticipants = peerList.length + 1; // +1 for self

  if (!isJoined) {
    return (
      <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center">
        <div className="bg-[#1a1a2e] rounded-2xl p-8 w-96 text-center border border-white/10 shadow-2xl">
          <div className="w-16 h-16 bg-purple-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Video size={32} className="text-purple-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Group Video Call</h2>
          <p className="text-gray-400 text-sm mb-6">
            Join the video call with your collaborators
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={leaveCall}
              className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition text-sm"
            >
              Cancel
            </button>
            <button
              onClick={joinCall}
              className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition flex items-center gap-2 text-sm"
            >
              <Phone size={16} />
              Join Call
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50 bg-[#1a1a2e] border border-white/20 rounded-2xl p-3 shadow-2xl flex items-center gap-3">
        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center animate-pulse">
          <Video size={14} className="text-white" />
        </div>
        <span className="text-white text-sm">{totalParticipants} in call</span>
        <button onClick={() => setIsMinimized(false)} className="p-1 hover:bg-white/10 rounded-lg transition">
          <Maximize2 size={14} className="text-white" />
        </button>
        <button onClick={leaveCall} className="p-1 hover:bg-red-500/20 rounded-lg transition">
          <PhoneOff size={14} className="text-red-400" />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <span className="text-white font-semibold">Group Call</span>
          <span className="text-gray-400 text-sm">{totalParticipants} participant{totalParticipants !== 1 ? "s" : ""}</span>
        </div>
        <button onClick={() => setIsMinimized(true)} className="p-2 hover:bg-white/10 rounded-lg transition">
          <Minimize2 size={18} className="text-white" />
        </button>
      </div>

      {/* Video Grid */}
      <div className="flex-1 p-6 overflow-auto">
        <div className={`grid gap-4 h-full ${
          totalParticipants === 1 ? "grid-cols-1 max-w-2xl mx-auto" :
          totalParticipants === 2 ? "grid-cols-2" :
          totalParticipants <= 4 ? "grid-cols-2" :
          "grid-cols-3"
        }`}>
          {/* Local video */}
          <div className="relative bg-gray-800 rounded-xl overflow-hidden aspect-video">
            {!isVideoOff ? (
              <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-full object-cover scale-x-[-1]" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-purple-600 flex items-center justify-center text-2xl font-bold text-white">
                  {currentUser?.username?.[0]?.toUpperCase() || "Y"}
                </div>
              </div>
            )}
            <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-1 rounded text-xs text-white flex items-center gap-1">
              {isMuted && <MicOff size={10} className="text-red-400" />}
              You
            </div>
          </div>

          {/* Remote videos */}
          {peerList.map(([userId, peer]) => (
            <RemoteVideo key={userId} userId={userId} peer={peer} />
          ))}

          {/* Empty slots hint */}
          {totalParticipants === 1 && (
            <div className="hidden md:flex bg-gray-800/40 rounded-xl aspect-video items-center justify-center border-2 border-dashed border-white/10">
              <div className="text-center text-gray-500">
                <Users size={32} className="mx-auto mb-2 opacity-40" />
                <p className="text-sm">Waiting for others to join...</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4 py-6 border-t border-white/10">
        <button
          onClick={toggleMic}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition ${
            isMuted ? "bg-red-500 hover:bg-red-600" : "bg-white/10 hover:bg-white/20"
          }`}
        >
          {isMuted ? <MicOff size={20} className="text-white" /> : <Mic size={20} className="text-white" />}
        </button>

        <button
          onClick={toggleVideo}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition ${
            isVideoOff ? "bg-red-500 hover:bg-red-600" : "bg-white/10 hover:bg-white/20"
          }`}
        >
          {isVideoOff ? <VideoOff size={20} className="text-white" /> : <Video size={20} className="text-white" />}
        </button>

        <button
          onClick={leaveCall}
          className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition shadow-lg"
        >
          <PhoneOff size={22} className="text-white" />
        </button>
      </div>
    </div>
  );
};

export default VideoCall;