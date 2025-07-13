import User from "../models/users.model.js";
import Message from "../models/message.model.js";
import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";


export const getUsersForSidebar  = async (req,res) =>{
    try {
       const loggedInUserId = req.user._id;
       const filteredUsers = await User.find({_id:{$ne:loggedInUserId}}).select("-password");
       res.status(200).json(filteredUsers)
    } catch (error) {
        console.log("Error in getUsersForSidebar controller",error.message)
        res.status(500).json({error:"Internal Server Error"})
    }
}
export const getMessages = async (req, res) => {
  try {
    const { id: UserToChatId } = req.params;
    const MyId = req.user._id;

    const messages = await Message.find({
      $or: [
        { senderId: MyId, receiverId: UserToChatId },
        { senderId: UserToChatId, receiverId: MyId }
      ]
    });

    res.status(200).json(messages);
  } catch (error) {
    console.log("Error in getMessages controller", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const sendMessages = async (req,res)=>{
    try {
        const {text,image} = req.body;
        const {id:receiverId} = req.params
        const senderId = req.user._id

        let imageUrl

        if(image){
            const uploadResponse = await cloudinary.uploader.upload(image);
            imageUrl = uploadResponse.secure_url;
        }

        const newMessage = new Message({
            senderId,
            receiverId,
            text,
            image:imageUrl,
        })

        await newMessage.save();

        const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }

        res.status(201).json(newMessage)
    } catch (error) {
        console.log("Error in sendMessages controller",error.message)
        res.status(500).json({error:"Internal Server Error"})
    }
}

export const deleteMessage = async (req, res) => {
  console.log("🔴 Incoming delete request for:", req.params.id);

  try {
    const { id: messageId } = req.params;
    const userId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    console.log("🟢 Found message in DB:", messageId);

    if (message.senderId.toString() !== userId.toString()) {
      return res.status(403).json({ error: "Not authorized to delete this message" });
    }

    // Delete from Cloudinary if image exists
    if (message.image) {
      try {
        const urlParts = message.image.split("/");
        const fileName = urlParts.pop();
        const folder = urlParts.slice(urlParts.indexOf("upload") + 1).join("/");
        const publicId = `${folder}/${fileName.split(".")[0]}`;

        await cloudinary.uploader.destroy(publicId);
      } catch (err) {
        console.warn(`⚠️ Failed to delete image from Cloudinary: ${message.image}`);
      }
    }

    await Message.findByIdAndDelete(messageId);

    const receiverSocketId = getReceiverSocketId(message.receiverId.toString());
    const senderSocketId = getReceiverSocketId(message.senderId.toString());

    const payload = { messageId };
    const notifiedSockets = new Set();

    [receiverSocketId, senderSocketId].forEach((socketId) => {
      if (socketId && !notifiedSockets.has(socketId)) {
        io.to(socketId).emit("messageDeleted", payload);
        notifiedSockets.add(socketId);
      }
    });

    res.status(200).json({ message: "Message permanently deleted" });
    console.log("🗑️ Permanently deleted message:", messageId);
  } catch (error) {
    console.error("Permanent delete error:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};


