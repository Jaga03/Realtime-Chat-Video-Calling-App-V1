import { useEffect, useRef, useState } from "react";
import { useChatStore } from "../Store/useChatStore";
import { Image, Send, XCircle, Smile } from "lucide-react"; 
import toast from "react-hot-toast";
import imageCompression from "browser-image-compression";
import debounce from "lodash/debounce";
import Picker from "emoji-picker-react"; 

const MessageInput = () => {
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [compressedFile, setCompressedFile] = useState(null);
  const fileInputRef = useRef(null);
  const { sendMessage, emitTyping, emitStopTyping } = useChatStore();
  const [isSending, setIsSending] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false); 
  const emojiPickerRef = useRef(null)

  useEffect(() => {
    if (!text.trim()) {
      emitStopTyping();
      return;
    }

    emitTyping();

    const stopTypingDebounced = debounce(() => {
      emitStopTyping();
    }, 1000);

    stopTypingDebounced();

    return () => stopTypingDebounced.cancel();
  }, [text]);

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file || !file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    try {
      const compressed = await imageCompression(file, {
        maxSizeMB: 1,
        maxWidthOrHeight: 1024,
        useWebWorker: true,
      });

      setCompressedFile(compressed);

      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(compressed);
    } catch (err) {
      console.error("Image compression failed:", err);
      toast.error("Failed to compress image");
    }
  };

  const removeImage = () => {
    setImagePreview(null);
    setCompressedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() && !imagePreview) return;

    setIsSending(true);
    setUploadProgress(0);

    try {
      let base64Image = null;

      if (compressedFile) {
        const reader = new FileReader();
        reader.readAsDataURL(compressedFile);

        reader.onprogress = (event) => {
          if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 100);
            setUploadProgress(percent);
          }
        };

        base64Image = await new Promise((resolve, reject) => {
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = reject;
        });
      }

      await sendMessage({ text: text.trim(), image: base64Image });

      setText("");
      setImagePreview(null);
      setCompressedFile(null);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsSending(false);
    }
  };

  const handleEmojiClick = (emojiData) => {
    setText((prev) => prev + emojiData.emoji);
    setShowEmojiPicker(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="p-4 w-full text-base sm:text-lg text-base-content">
      {imagePreview && (
        <div className="mb-3 flex items-center gap-2">
          <div className="relative">
            <img
              src={imagePreview}
              alt="Preview"
              className={`w-20 h-20 object-cover rounded-lg border border-base-300 ${
                isSending ? "opacity-60" : ""
              }`}
            />

            {!isSending && (
              <button
                onClick={removeImage}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-base-200 flex items-center justify-center"
                type="button"
              >
                <XCircle className="size-3" />
              </button>
            )}

            {isSending && (
              <div className="absolute inset-0 bg-black bg-opacity-30 flex flex-col items-center justify-center rounded-lg">
                <span className="loading loading-spinner text-primary" />
                <span className="text-xs mt-2 text-white">
                  {uploadProgress}%
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      <form onSubmit={handleSendMessage} className="flex items-center gap-2">
        <div className="flex-1 flex gap-2 relative"> {/* Added relative for positioning picker */}
          <input
            type="text"
            className="w-full input input-bordered rounded-lg input-sm text-base-content border-base-content sm:input-lg placeholder:text-base-content text-lg"
            placeholder="Type a message..."
            value={text}
            disabled={isSending}
            onChange={(e) => setText(e.target.value)}
          />
          <input
            type="file"
            accept="image/*"
            className="hidden"
            ref={fileInputRef}
            onChange={handleImageChange}
          />
          <button
            type="button"
            className={`hidden sm:flex btn btn-circle bg-base-200 ${
              imagePreview ? "text-emerald-500" : "text-zinc-400"
            }`}
            onClick={() => fileInputRef.current?.click()}
            disabled={isSending}
          >
            <Image size={20} className="text-base-content" />
          </button>
          <button
            type="button"
            className={`btn btn-circle bg-base-200 ${
              isSending ? "text-zinc-400" : "text-base-content"
            }`}
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            disabled={isSending}
            title="Add Emoji"
          >
            <Smile size={20} />
          </button>
          {showEmojiPicker && (
            <div ref={emojiPickerRef} className="absolute bottom-12 right-0 z-10">
              <Picker
                onEmojiClick={handleEmojiClick}
                emojiStyle="twitter,native, google, facebook, apple" 
                skinTonesDisabled={false}
              />
            </div>
          )}
        </div>
        <button
          type="submit"
          className="btn btn-sm btn-circle p-1.5 bg-base-200 cursor-pointer"
          disabled={!text.trim() && !imagePreview || isSending}
        >
          {isSending ? (
            <span className="loading loading-spinner text-primary w-5 h-5" />
          ) : (
            <Send size={24} className="text-base-content" />
          )}
        </button>
      </form>
    </div>
  );
};

export default MessageInput;