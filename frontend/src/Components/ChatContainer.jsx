import { useEffect, useState, useRef } from "react";
import { useChatStore } from "../Store/useChatStore";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import { useAuthStore } from "../Store/useAuthStore";
import VideoComponent from "./VideoComponent";
import avatar from "../assets/avatar.png";
import { formatMessageTime } from "../lib/utils.js";
import { safeLinkifyText } from "../lib/event.jsx";
import { Download, Trash2 } from "lucide-react";
import clsx from "clsx";
import toast from "react-hot-toast";

const ChatContainer = () => {
  const {
    messages,
    getMessages,
    isMessagesLoading,
    selectedUser,
    deleteMessage,
    subscribeToMessages,
    unsubscribeFromMessages,
    isTypingMap,
    localStream,
    remoteStreams,
    callStatus,
    incomingCall,
    acceptCall,
    declineCall,
    endCall,
  } = useChatStore();
  const { authUser, users } = useAuthStore();
  const messageEndRef = useRef(null);
  const [expandedMessages, setExpandedMessages] = useState({});
  const [pendingDeletions, setPendingDeletions] = useState({});

  const isTyping = isTypingMap[selectedUser?._id];

  useEffect(() => {
    if (selectedUser?._id) {
      getMessages(selectedUser._id);
      subscribeToMessages();
    }
    return () => {
      unsubscribeFromMessages();
      toast.dismiss("incoming-call");
    };
  }, [selectedUser?._id, getMessages, subscribeToMessages, unsubscribeFromMessages]);

  useEffect(() => {
    if (!messages || messages.length === 0) {
      if (localStream || remoteStreams.length > 0) {
        messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }
      return;
    }

    const lastMessage = messages[messages.length - 1];
    if (lastMessage.image) {
      const img = new Image();
      img.src = lastMessage.image;
      img.onload = () => messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
      img.onerror = () => {
        console.error("Failed to load image:", lastMessage.image);
        messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
      };
    } else {
      messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping, localStream, remoteStreams]);

 useEffect(() => {
  if (callStatus === "incoming" && incomingCall) {
    toast.dismiss("call-ended");
    const caller = users.find((user) => user._id === incomingCall.fromUserId)?.fullName || "Unknown";
    toast(
      (t) => (
        <div className="flex items-center gap-2">
          <span>Incoming {incomingCall.callType} call from {caller}</span>
          <button
            className="btn btn-sm btn-success"
            onClick={() => {
              console.log(`[${new Date().toISOString()}] User manually accepted call from:`, incomingCall.fromUserId);
              acceptCall();
              toast.dismiss(t.id);
            }}
          >
            Accept
          </button>
          <button
            className="btn btn-sm btn-error"
            onClick={() => {
              console.log(`[${new Date().toISOString()}] User declined call from:`, incomingCall.fromUserId);
              declineCall();
              toast.dismiss(t.id);
            }}
          >
            Decline
          </button>
        </div>
      ),
      { id: "incoming-call", duration: 30000 }
    );
  } else {
    toast.dismiss("incoming-call");
  }
}, [callStatus, incomingCall, acceptCall, declineCall, users]);

  const downloadImage = async (url) => {
    try {
      const response = await fetch(url, { mode: "cors" });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = url.split("/").pop() || "image.png";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error("Failed to download image:", err);
      toast.error("Failed to download image", { id: "image-download-error" });
    }
  };

  const toggleExpanded = (id) => {
    setExpandedMessages((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleDeleteMessage = (messageId) => {
    console.log("🧨 Delete clicked for:", messageId);
    setPendingDeletions((prev) => ({ ...prev, [messageId]: true }));
    let undo = false;

    const timeoutId = setTimeout(async () => {
      if (!undo) {
        console.log("🔥 Timeout complete, deleting message");
        await deleteMessage(messageId);
        setPendingDeletions((prev) => {
          const copy = { ...prev };
          delete copy[messageId];
          return copy;
        });
      }
    }, 3000);

    toast(
      (t) => (
        <div className="flex items-center gap-2">
          <span>Message deleted</span>
          <button
            className="btn btn-xs btn-link text-blue-600"
            onClick={() => {
              console.log("🧊 Undo clicked for:", messageId);
              undo = true;
              clearTimeout(timeoutId);
              toast.dismiss(t.id);
              setPendingDeletions((prev) => {
                const copy = { ...prev };
                delete copy[messageId];
                return copy;
              });
            }}
          >
            Undo
          </button>
        </div>
      ),
      { id: messageId, duration: 5000 }
    );
  };

  if (isMessagesLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-auto">
        <ChatHeader />
        <MessageSkeleton />
        <MessageInput />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-auto bg-base-100 text-base-content">
      <ChatHeader />
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages
          .filter((m) => !pendingDeletions[m._id])
          .map((message) => {
            const isSender = message.senderId === authUser._id;
            const isLong = message.text && message.text.length > 300;
            const isExpanded = expandedMessages[message._id];
            return (
              <div
                key={message._id}
                className={clsx(
                  `chat transition-all duration-300 ease-in-out transform`,
                  isSender ? "chat-end" : "chat-start"
                )}
              >
                <div className="chat-image avatar">
                  <div className="size-10 rounded-full border">
                    <img
                      src={
                        isSender
                          ? authUser.profilePic || avatar
                          : selectedUser.profilePic || avatar
                      }
                      alt="profile pic"
                    />
                  </div>
                </div>
                <div className="chat-header mb-1">
                  <time className="text-xs opacity-50 ml-1">
                    {formatMessageTime(message.createdAt)}
                  </time>
                </div>
                <div
                  className={clsx(
                    "chat-bubble relative group whitespace-pre-wrap break-words max-w-[90%] flex flex-col transition-all duration-300 ease-in-out",
                    isSender
                      ? "bg-primary text-primary-content"
                      : "bg-base-200 text-base-content"
                  )}
                >
                  {isSender && (
                    <button
                      onClick={() => handleDeleteMessage(message._id)}
                      className="absolute top-1 -left-10 opacity-0 group-hover:opacity-100 bg-base-300 text-error p-1 rounded-full shadow transition-opacity z-10"
                      title="Delete message"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                  {message.image && (
                    <div className="relative group w-fit">
                      {console.log("Rendering image:", message.image)}
                      <img
                        src={message.image}
                        alt="Attachment"
                        className="sm:max-w-[300px] max-w-[200px] rounded-lg"
                        onError={(e) => console.error("Image failed to load:", e.target.src)}
                      />
                      <button
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 bg-base-300 text-base-content p-1 rounded-full shadow transition-opacity"
                        onClick={() => downloadImage(message.image)}
                        title="Download image"
                      >
                        <Download className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                  {message.text && (
                    <div
                      className={clsx(
                        "w-full",
                        isLong && !isExpanded && "line-clamp-3"
                      )}
                    >
                      {safeLinkifyText(message.text)}
                    </div>
                  )}
                  {isLong && (
                    <button
                      className="text-sm text-base-content/70 hover:text-base-content mt-1"
                      onClick={() => toggleExpanded(message._id)}
                    >
                      {isExpanded ? "Show less" : "Show more"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        {isTyping && (
          <div className="chat chat-start">
            <div className="chat-bubble bg-base-200 text-base-content">
              <span className="loading loading-dots loading-sm"></span>
            </div>
          </div>
        )}
        <div ref={messageEndRef} />
        {callStatus === "active" && <VideoComponent />}
      </div>
      <MessageInput />
    </div>
  );
};

export default ChatContainer;