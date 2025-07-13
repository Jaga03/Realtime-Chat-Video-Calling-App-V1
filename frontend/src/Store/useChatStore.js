import { create } from "zustand";
import toast from "react-hot-toast";
import { api } from "../lib/Axios";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
    messages: [],
    users: [],
    selectedUser: null,
    isUsersLoading: false,
    isMessagesLoading: false,
    isTypingMap: {},
    localStream: null,
    remoteStreams: [],
    peerConnection: null,
    callStatus: null,
    callType: null,
    incomingCall: null,
    isAudioMuted: false,
    isVideoMuted: false,
    callPartnerId: null,
    remoteMuteMap: {},
    remoteVideoMuteMap: {},

    getUsers: async () => {
        set({ isUsersLoading: true });
        try {
            const res = await api.get("/message/users")
            set({ users: res.data });
        } catch (error) {
            toast.error(error?.response?.data?.message || "Something went wrong");
            
        } finally {
            set({ isUsersLoading: false })
        }
    },

    getMessages: async (userId) => {
        set({ isMessagesLoading: true });
        try {
            const res = await api.get(`/message/${userId}`)
            set({ messages: res.data })
        } catch (error) {
            
                toast.error(error?.response?.data?.message || "Something went wrong");
            
        } finally {
            set({ isMessagesLoading: false })
        }
    },

    sendMessage: async (messageData) => {
        const { selectedUser, messages } = get()
        try {
            const res = await api.post(`/message/send/${selectedUser._id}`, messageData)
            set({ messages: [...messages, res.data] })
        } catch (error) {
            toast.error(error.response.data.message)
        }
    },

    deleteMessage: async (id) => {
    try {
      console.log("Calling delete API for:", id);
      await api.delete(`/message/delete/${id}`);
      console.log("✅ Backend responded");
      set((state) => ({
        messages: state.messages.filter((m) => m._id !== id),
      }));
    } catch (error) {
      toast.error("Failed to delete message");
      console.error("deleteMessage error:", error);
    }
  },
    subscribeToMessages: () => {
    const { selectedUser } = get();
    console.log("Subscribing to messages for user:", selectedUser?._id);
    if (!selectedUser) return;

    const socket = useAuthStore.getState().socket;
    console.log("🟢 Subscribed to socket events");

    socket.on("newMessage", (newMessage) => {
      const isMessageSentFromSelectedUser = newMessage.senderId === selectedUser._id;
      if (!isMessageSentFromSelectedUser) return;
      set({ messages: [...get().messages, newMessage] });
    });
    socket.on("messageDeleted", ({ messageId }) => {
      console.log("🧹 Message deleted via socket:", messageId);
      set((state) => ({
        messages: state.messages.filter((m) => m._id !== messageId),
      }));
    });
    socket.on("typing", ({ fromUserId }) => {
      set((state) => ({
        isTypingMap: { ...state.isTypingMap, [fromUserId]: true },
      }));
      setTimeout(() => {
        set((state) => ({
          isTypingMap: { ...state.isTypingMap, [fromUserId]: false },
        }));
      }, 5000);
    });
    socket.on("stopTyping", ({ fromUserId }) => {
      set((state) => ({
        isTypingMap: { ...state.isTypingMap, [fromUserId]: false },
      }));
    });

    socket.on("remote-audio-muted", ({ fromUserId, isMuted }) => {
      console.log("Received remote audio mute from:", fromUserId, "isMuted:", isMuted);
      set((state) => ({
        remoteMuteMap: {
          ...state.remoteMuteMap,
          [fromUserId]: isMuted,
        },
      }));
    });

    socket.on("remote-video-muted", ({ fromUserId, isMuted }) => {
      console.log("Received remote video mute from:", fromUserId, "isMuted:", isMuted);
      set((state) => ({
        remoteVideoMuteMap: {
          ...state.remoteVideoMuteMap,
          [fromUserId]: isMuted,
        },
      }));
    });

    socket.on("call-user", ({ fromUserId, callType }) => {
      console.log("Received call-user from:", fromUserId, "type:", callType);
      set({ callStatus: "incoming", callType, incomingCall: { fromUserId, callType }, callPartnerId: fromUserId });
    });

    socket.on("offer", async ({ fromUserId, offer }) => {
      const { peerConnection, localStream } = get();
      let newPeerConnection = peerConnection;
      let newLocalStream = localStream;

      if (!peerConnection || !localStream) {
        console.log("Initializing peerConnection for offer from:", fromUserId);
        newLocalStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true }).catch((error) => {
          console.error("Media access error:", error);
          toast.error("Failed to access camera/microphone");
          throw error;
        });
        newPeerConnection = new RTCPeerConnection({
          iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
        });

        newLocalStream.getTracks().forEach((track) => newPeerConnection.addTrack(track, newLocalStream));

        newPeerConnection.ontrack = (event) => {
          console.log("Received remote track:", event.streams, event.track);
          set({ remoteStreams: event.streams });
        };

        newPeerConnection.onicecandidate = (event) => {
          if (event.candidate) {
            socket.emit("ice-candidate", { toUserId: fromUserId, candidate: event.candidate });
          }
        };

        set({ peerConnection: newPeerConnection, localStream: newLocalStream });
      }

      try {
        console.log("Received offer from:", fromUserId, "offer:", offer);
        await newPeerConnection.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await newPeerConnection.createAnswer();
        console.log("Created answer for:", fromUserId, "answer:", answer);
        await newPeerConnection.setLocalDescription(answer);
        socket.emit("answer", { toUserId: fromUserId, answer });
      } catch (error) {
        console.error("Error handling offer:", error);
        toast.error("Failed to handle call offer");
        get().endCall();
      }
    });

    socket.on("answer", async ({ answer }) => {
      const { peerConnection } = get();
      if (!peerConnection) return;

      try {
        console.log("Received answer, setting remote description");
        await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
      } catch (error) {
        console.error("Error handling answer:", error);
        toast.error("Failed to handle call answer");
        get().endCall();
      }
    });

    socket.on("ice-candidate", async ({ candidate }) => {
      const { peerConnection } = get();
      if (!peerConnection) return;

      try {
        await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (error) {
        console.error("Error adding ICE candidate:", error);
      }
    });

    socket.on("end-call", () => {
      console.log("Received end-call event");
      get().endCall();
    });

    socket.on("accept-call", async ({ fromUserId }) => {
      const { peerConnection, localStream } = get();
      if (!peerConnection || !localStream) return;

      try {
        console.log("Call accepted by:", fromUserId);
        const { callStatus } = get();
        if (callStatus === "calling") {
          set({ callStatus: "active", callPartnerId: fromUserId });
        }
      } catch (error) {
        console.error("Error handling accept-call:", error);
        toast.error("Failed to handle call acceptance");
        get().endCall();
      }
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    socket.off("newMessage");
    socket.off("messageDeleted");
    socket.off("typing");
    socket.off("stopTyping");
    socket.off("call-user");
    socket.off("offer");
    socket.off("answer");
    socket.off("ice-candidate");
    socket.off("end-call");
    socket.off("remote-audio-muted");
    socket.off("remote-video-muted");
  },

  emitTyping: () => {
    const socket = useAuthStore.getState().socket;
    const { selectedUser } = get();
    if (selectedUser && socket) {
      socket.emit("typing", { toUserId: selectedUser._id });
    }
  },

  emitStopTyping: () => {
    const socket = useAuthStore.getState().socket;
    const { selectedUser } = get();
    if (selectedUser && socket) {
      socket.emit("stopTyping", { toUserId: selectedUser._id });
    }
  },

  setTyping: (userId, isTyping) => {
    set((state) => ({
      isTypingMap: {
        ...state.isTypingMap,
        [userId]: isTyping,
      },
    }));
  },

  setSelectedUser: (selectedUser) => {
    const { callPartnerId, callStatus } = get();
    if (selectedUser && callStatus && callPartnerId && selectedUser._id !== callPartnerId) {
      get().endCall();
    }
    set({ selectedUser });
  },

  initiateCall: async (toUserId, callType = "video") => {
    const socket = useAuthStore.getState().socket;
    const { selectedUser } = get();
    const { authUser } = useAuthStore.getState();

    if (!socket || !selectedUser || selectedUser._id !== toUserId || !authUser) {
      toast.error("Cannot initiate call", { id: "call-error" });
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: callType === "video",
        audio: true,
      });
      const peerConnection = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      });

      stream.getTracks().forEach((track) => peerConnection.addTrack(track, stream));

      peerConnection.ontrack = (event) => {
        console.log("Received remote track in initiateCall:", event.streams, event.track);
        set({ remoteStreams: event.streams });
      };

      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("ice-candidate", { toUserId, candidate: event.candidate });
        }
      };

      peerConnection.oniceconnectionstatechange = () => {
        console.log("ICE connection state:", peerConnection.iceConnectionState);
      };

      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      console.log("Offer created and set, sending to:", toUserId, "offer:", offer);
      socket.emit("call-user", { toUserId, callType, fromUserId: authUser._id });
      socket.emit("offer", { toUserId, offer });

      set({
        localStream: stream,
        peerConnection,
        callStatus: "calling",
        callType,
        isAudioMuted: false,
        isVideoMuted: false,
        callPartnerId: toUserId,
      });
    } catch (error) {
      console.error("Error initiating call:", error);
      toast.error("Failed to initiate call", { id: "call-error" });
      get().endCall();
    }
  },

  acceptCall: async () => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] Manually accepting call for user:`, get().incomingCall?.fromUserId, "Stack:", new Error().stack);
    const socket = useAuthStore.getState().socket;
    const { selectedUser, callType, incomingCall } = get();
    const { authUser } = useAuthStore.getState();

    if (!socket || !selectedUser || !incomingCall || selectedUser._id !== incomingCall.fromUserId || !authUser) {
      toast.error("Cannot accept call", { id: "call-error" });
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: callType === "video",
        audio: true,
      }).catch((error) => {
        console.error("Media access error:", error);
        toast.error("Failed to access camera/microphone");
        throw error;
      });
      const peerConnection = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      });

      stream.getTracks().forEach((track) => peerConnection.addTrack(track, stream));

      peerConnection.ontrack = (event) => {
        console.log("Received remote track in acceptCall:", event.streams, event.track);
        set({ remoteStreams: event.streams });
      };

      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("ice-candidate", { toUserId: incomingCall.fromUserId, candidate: event.candidate });
        }
      };

      peerConnection.oniceconnectionstatechange = () => {
        console.log("ICE connection state:", peerConnection.iceConnectionState);
      };

      set({
        localStream: stream,
        peerConnection,
        callStatus: "active",
        incomingCall: null,
        isAudioMuted: false,
        isVideoMuted: false,
        callPartnerId: incomingCall.fromUserId,
      });

      socket.emit("accept-call", { toUserId: incomingCall.fromUserId, fromUserId: authUser._id });
      console.log(`[${timestamp}] Call accepted, waiting for offer from:`, incomingCall.fromUserId);
    } catch (error) {
      console.error(`[${timestamp}] Error accepting call:`, error);
      toast.error("Failed to accept call", { id: "call-error" });
      get().endCall();
    }
  },

  declineCall: () => {
    const socket = useAuthStore.getState().socket;
    const { incomingCall } = get();

    if (socket && incomingCall) {
      socket.emit("end-call", { toUserId: incomingCall.fromUserId });
    }

    set({ callStatus: null, callType: null, incomingCall: null, callPartnerId: null });
    toast.success("Call declined", { id: "call-declined" });
  },

  endCall: () => {
    const socket = useAuthStore.getState().socket;
    const { localStream, peerConnection, selectedUser, callStatus } = get();

    if (!callStatus) return;

    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
    }
    if (peerConnection) {
      peerConnection.close();
    }
    if (selectedUser && socket) {
      socket.emit("end-call", { toUserId: selectedUser._id });
    }

    set({
      localStream: null,
      remoteStreams: [],
      peerConnection: null,
      callStatus: null,
      callType: null,
      incomingCall: null,
      isAudioMuted: false,
      isVideoMuted: false,
      callPartnerId: null,
    });

    toast.dismiss("call-ended");
    toast.success("Call ended", { id: "call-ended", duration: 3000 });
  },

  toggleMuteAudio: () => {
    const { localStream, isAudioMuted, callPartnerId, peerConnection } = get();
    const socket = useAuthStore.getState().socket;

    if (!localStream || !peerConnection) return;

    const newMuted = !isAudioMuted;

    // Toggle local audio tracks
    localStream.getAudioTracks().forEach((track) => {
      track.enabled = !newMuted;
    });

    // Update local state
    set({ isAudioMuted: newMuted });

    // Emit mute state to other peer
    if (socket && callPartnerId) {
      socket.emit("remote-audio-muted", {
        toUserId: callPartnerId,
        isMuted: newMuted,
      });
      console.log("Emitted audio mute update to:", callPartnerId, "isMuted:", newMuted);
    }

    // Optional: Renegotiate to ensure peer receives updated stream
    renegotiateConnection(peerConnection, localStream);
  },

  toggleMuteVideo: () => {
    const { localStream, isVideoMuted, callPartnerId, peerConnection } = get();
    const socket = useAuthStore.getState().socket;

    if (!localStream || !peerConnection) return;

    const newMuted = !isVideoMuted;

    // Toggle local video tracks
    localStream.getVideoTracks().forEach((track) => {
      track.enabled = !newMuted;
    });

    // Update local state
    set({ isVideoMuted: newMuted });

    // Emit mute state to other peer
    if (socket && callPartnerId) {
      socket.emit("remote-video-muted", {
        toUserId: callPartnerId,
        isMuted: newMuted,
      });
      console.log("Emitted video mute update to:", callPartnerId, "isMuted:", newMuted);
    }

    // Optional: Renegotiate to ensure peer receives updated stream
    renegotiateConnection(peerConnection, localStream);
  },
}));


async function renegotiateConnection(peerConnection, localStream) {
  try {
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    const { callPartnerId } = useChatStore.getState();
    const socket = useAuthStore.getState().socket;
    if (socket && callPartnerId) {
      socket.emit("offer", { toUserId: callPartnerId, offer });
      console.log("Renegotiated connection with offer sent to:", callPartnerId);
    }
  } catch (error) {
    console.error("Error renegotiating connection:", error);
  }
}