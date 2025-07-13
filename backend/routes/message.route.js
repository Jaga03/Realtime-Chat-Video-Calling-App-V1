import express from 'express'
import { protectRoute } from '../middleware/auth.middleware.js'
import { getMessages, getUsersForSidebar, sendMessages,deleteMessage,} from '../controllers/message.controller.js'

const router = express.Router()

router.get("/users" ,protectRoute , getUsersForSidebar)
router.get("/:id",protectRoute, getMessages)

router.post("/send/:id",protectRoute, sendMessages)
router.delete("/delete/:id", protectRoute, deleteMessage);


export default router