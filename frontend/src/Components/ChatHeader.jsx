import { useChatStore } from "../Store/useChatStore";
import { useAuthStore } from "../Store/useAuthStore";
import avatar from "../assets/avatar.png";
import { Mic, MicOff, Video, VideoOff, PhoneOff, XCircle } from "lucide-react";
import clsx from "clsx";

const ChatHeader = () => {
  const {
    selectedUser,
    callStatus,
    toggleMuteAudio,
    toggleMuteVideo,
    endCall,
    isAudioMuted,
    isVideoMuted,
    localStream,
    setSelectedUser,
  } = useChatStore();
  const { onlineUsers } = useAuthStore();

  const isAudioActuallyMuted = isAudioMuted || (localStream && !localStream.getAudioTracks().some((track) => track.enabled));
  const isVideoActuallyMuted = isVideoMuted || (localStream && !localStream.getVideoTracks().some((track) => track.enabled));

  return (
    <div className="p-2.5 border-b border-base-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="avatar">
            <div className="size-12 rounded-full">
              <img src={selectedUser.profilePic || avatar} alt="profile pic" />
            </div>
          </div>
          <div>
            <h2 className="text-lg font-semibold">{selectedUser.fullName}</h2>
            <p className="text-sm text-base-content/70">
              {onlineUsers.includes(selectedUser?._id) ? "Online" : "Offline"}
            </p>
          </div>
        </div>
        {callStatus && (
          <div className="call-controls">
            <button
              onClick={toggleMuteAudio}
              className={clsx(
                "btn btn-sm m-2",
                isAudioActuallyMuted ? "btn-error" : "btn-primary"
              )}
              title={isAudioActuallyMuted ? "Unmute Audio" : "Mute Audio"}
            >
              {isAudioActuallyMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
            <button
              onClick={toggleMuteVideo}
              className={clsx(
                "btn btn-sm m-2",
                isVideoActuallyMuted ? "btn-error" : "btn-primary"
              )}
              title={isVideoActuallyMuted ? "Unmute Video" : "Mute Video"}
            >
              {isVideoActuallyMuted ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
            </button>
            <button
              onClick={endCall}
              className="btn btn-sm btn-error m-2"
              title="End Call"
            >
              <PhoneOff className="w-5 h-5" />
            </button>
          </div>
        )}
        <button onClick={() => setSelectedUser(null)}>
          <XCircle className="cursor-pointer" />
        </button>
      </div>
    </div>
  );
};

export default ChatHeader;