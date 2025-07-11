import { Router } from 'express'
import { chatController } from '../controller/chat.controller'
import { verifyJWT } from '../middelware/auth.middleware'

const chatRouter = Router()

// All chat routes require authentication
chatRouter.use(verifyJWT)

// Chat room routes
chatRouter.get('/chat-rooms', chatController.getChatList)
chatRouter.get('/users', chatController.getUsersList)
chatRouter.post('/create', chatController.createOneOnOneChat)
chatRouter.get('/:roomId', chatController.getChatRoom)
chatRouter.get('/:roomId/messages', chatController.getMessageHistory)
chatRouter.post('/:roomId/read', chatController.markMessagesAsRead)
chatRouter.get('/:roomId/unread', chatController.getUnreadCount)

// Message routes
chatRouter.post('/message/send', chatController.sendMessage)

export default chatRouter 