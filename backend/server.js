import express from 'express'
import dotenv from "dotenv"
import cookieParser from 'cookie-parser'
import cors from 'cors'
import authRoutes from './routes/auth.route.js'
import messageRoutes from './routes/message.route.js'
import { connectDB } from './lib/db.js'
import {app,server} from './lib/socket.js'
import path from 'path';
import { fileURLToPath } from 'url';
import fs from "fs";


dotenv.config()

const port = process.env.PORT || 5000;


app.use(express.json({ limit: "10mb" }));

app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use(cookieParser());

app.use(cors({ origin: ['http://localhost:5173'], credentials: true }))

app.use('/api/auth',authRoutes)
app.use('/api/message',messageRoutes)

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientPath = path.join(__dirname, '../frontend/dist');
app.use(express.static(clientPath));

app.get("/*splat", (req, res) => {
  const indexFile = path.join(clientPath, "index.html");
  if (fs.existsSync(indexFile)) {
    res.sendFile(indexFile);
  } else {
    res.status(500).send("Frontend build not found.");
  }
});



server.listen(port,()=>{
    console.log(`Server is running on port ${port}`)
    connectDB()
})