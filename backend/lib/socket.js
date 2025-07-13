import { Server } from 'socket.io';
import http from 'http';
import express from 'express';

const app = express();
const server = http.createServer(app);

const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(",").map(o => o.trim())
  : ["http://localhost:5173"];

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
});





export function getReceiverSocketId(userId) {
  return userSocketMap[userId];
}

const userSocketMap = {};

io.on("connection", (socket) => {
  console.log("A user connected", socket.id);

  const userId = socket.handshake.query.userId;
  console.log("Mapping userId:", userId, "to socketId:", socket.id);
  if (userId) userSocketMap[userId] = socket.id;
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

   socket.on("disconnect", () => {
    console.log(`❌ User disconnected: ${userId}`);
    delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });

  socket.on("newMessage", ({ toUserId, message }) => {
    const receiverSocketId = userSocketMap[toUserId];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", message);
    }
  });

  socket.on("messageDeleted", ({ toUserId, messageId }) => {
    const receiverSocketId = userSocketMap[toUserId];
    const senderSocketId = userSocketMap[userId];

    if (receiverSocketId && receiverSocketId !== socket.id) {
      io.to(receiverSocketId).emit("messageDeleted", { messageId });
    }

    if (senderSocketId) {
      io.to(senderSocketId).emit("messageDeleted", { messageId });
    }
  });

  socket.on("typing", ({ toUserId }) => {
    const receiverSocketId = userSocketMap[toUserId];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("typing", { fromUserId: userId });
    }
  });

  socket.on("stopTyping", ({ toUserId }) => {
    const receiverSocketId = userSocketMap[toUserId];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("stopTyping", { fromUserId: userId });
    }
  });

  socket.on("call-user", ({ toUserId, callType, fromUserId }) => {
    const receiverSocketId = userSocketMap[toUserId];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("call-user", { fromUserId, callType });
    } else {
      io.to(socket.id).emit("end-call");
    }
  });

  socket.on("offer", ({ toUserId, offer }) => {
    const receiverSocketId = userSocketMap[toUserId];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("offer", { fromUserId: userId, offer });
    }
  });

  socket.on("answer", ({ toUserId, answer }) => {
    const receiverSocketId = userSocketMap[toUserId];
    console.log("Received answer for:", toUserId, "receiverSocketId:", receiverSocketId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("answer", { answer });
    }
  });

  socket.on("ice-candidate", ({ toUserId, candidate }) => {
    const receiverSocketId = userSocketMap[toUserId];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("ice-candidate", { candidate });
    }
  });

  socket.on("accept-call", ({ toUserId, fromUserId }) => {
    const receiverSocketId = userSocketMap[toUserId];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("accept-call", { fromUserId });
    }
  });

  socket.on("end-call", ({ toUserId }) => {
    const receiverSocketId = userSocketMap[toUserId];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("end-call");
    }
  });

 
});


export { io, server, app };
