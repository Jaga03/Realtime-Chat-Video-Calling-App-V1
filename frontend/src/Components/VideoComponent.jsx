import { useEffect, useRef } from "react";
import { useChatStore } from "../Store/useChatStore";

const VideoComponent = () => {
  const {
    localStream,
    remoteStreams,
    selectedUser,
    callPartnerId,
    remoteVideoMuteMap,
    remoteMuteMap,
    isAudioMuted,
    isVideoMuted,
  } = useChatStore();

  const localVideoRef = useRef(null);
  const remoteVideoRefs = useRef({});

  // Set local stream
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Set remote streams
  useEffect(() => {
    remoteStreams.forEach((stream, index) => {
      if (remoteVideoRefs.current[index] && stream) {
        remoteVideoRefs.current[index].srcObject = stream;
      }
    });
  }, [remoteStreams]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = null;
      }
      Object.values(remoteVideoRefs.current).forEach((video) => {
        if (video) video.srcObject = null;
      });
    };
  }, []);

  if (!localStream && remoteStreams.length === 0) return null;
  if (!selectedUser || !callPartnerId || selectedUser._id !== callPartnerId) return null;

  const isRemoteCameraOff = remoteVideoMuteMap?.[selectedUser._id] || false;
  const isRemoteAudioMuted = remoteMuteMap?.[selectedUser._id] || false;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
      {/* Local Video */}
      {localStream && (
        <div className="relative w-full rounded-lg border border-base-300 overflow-hidden bg-black">
          <video ref={localVideoRef} autoPlay muted className="w-full" />
          <div className="absolute bottom-2 left-2 text-white bg-black bg-opacity-50 px-2 py-1 rounded">
            You
            {(isAudioMuted || !localStream.getAudioTracks().some((track) => track.enabled)) && (
              <span className="ml-2 text-red-400">(Audio Muted)</span>
            )}
            {(isVideoMuted || !localStream.getVideoTracks().some((track) => track.enabled)) && (
              <span className="ml-2 text-red-400">(Video Muted)</span>
            )}
          </div>
        </div>
      )}

      {/* Remote Video */}
      <div className="relative w-full rounded-lg border border-base-300 overflow-hidden bg-black">
        {isRemoteCameraOff || (remoteStreams[0] && !remoteStreams[0].getVideoTracks().some((track) => track.enabled)) ? (
          <div className="w-full h-64 flex items-center justify-center text-white text-lg">
            Camera Off
          </div>
        ) : (
          <video
            ref={(el) => (remoteVideoRefs.current[0] = el)}
            autoPlay
            className="w-full"
          />
        )}
        <div className="absolute bottom-2 left-2 text-white bg-black bg-opacity-50 px-2 py-1 rounded">
          {selectedUser?.fullName || "Remote User"}
          {isRemoteAudioMuted || (remoteStreams[0] && !remoteStreams[0].getAudioTracks().some((track) => track.enabled)) && (
            <span className="ml-2 text-red-400">(Audio Muted)</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoComponent;