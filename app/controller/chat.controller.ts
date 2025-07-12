import { Request, Response } from 'express'
import { ChatRepository } from '../repository/chat.repository'
import { UserRepository } from '../repository/user.repository'
import { asyncHandler } from '../utils/async.hadler'
import { sendError, sendSuccess } from '../utils/unified.response'
import STATUS_CODES from '../utils/status.codes'

export class ChatController {
  /**
   * Get user's chat list
   */
  public getChatList = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId
    if (!userId) {
      sendError(res, "User not authenticated", null, STATUS_CODES.UNAUTHORIZED)
      return
    }

    const chatRooms = await ChatRepository.findUserChatRooms(userId)
    sendSuccess(res, "Chat list retrieved successfully", chatRooms)
  })

  /**
   * Get specific chat room
   */
  public getChatRoom = asyncHandler(async (req: Request, res: Response) => {
    const { roomId } = req.params
    const userId = req.user?.userId

    if (!userId) {
      sendError(res, "User not authenticated", null, STATUS_CODES.UNAUTHORIZED)
      return
    }

    const chatRoom = await ChatRepository.findChatRoomById(roomId)
    if (!chatRoom) {
      sendError(res, "Chat room not found", null, STATUS_CODES.NOT_FOUND)
      return
    }
    // Check if user is participant
    const isParticipant = chatRoom.participants.some(p => p._id.toString() === userId)
    if (!isParticipant) {
      sendError(res, "Access denied", null, STATUS_CODES.FORBIDDEN)
      return
    }

    // Mark messages as read
    await ChatRepository.markMessagesAsRead(roomId, userId)

    sendSuccess(res, "Chat room retrieved successfully", chatRoom)
  })

  /**
   * Create one-on-one chat
   */
  public createOneOnOneChat = asyncHandler(async (req: Request, res: Response) => {
    const { participantId } = req.body
    const userId = req.user?.userId

    if (!userId) {
      sendError(res, "User not authenticated", null, STATUS_CODES.UNAUTHORIZED)
      return
    }

    if (!participantId) {
      sendError(res, "Participant ID is required", null, STATUS_CODES.BAD_REQUEST)
      return
    }

    // Check if participant exists
    const participant = await UserRepository.findById(participantId)
    if (!participant) {
      sendError(res, "Participant not found", null, STATUS_CODES.NOT_FOUND)
      return
    }

    // Find or create chat
    const chatRoom = await ChatRepository.findOrCreateOneOnOneChat(userId, participantId)

    sendSuccess(res, "Chat room created successfully", chatRoom)
  })

  /**
   * Send message
   */
  public sendMessage = asyncHandler(async (req: Request, res: Response) => {
    const { roomId, content, messageType = "text", mediaUrl, fileName, fileSize, replyTo } = req.body
    const userId = req.user?.userId

    if (!userId) {
      sendError(res, "User not authenticated", null, STATUS_CODES.UNAUTHORIZED)
      return
    }

    if (!roomId || !content) {
      sendError(res, "Room ID and content are required", null, STATUS_CODES.BAD_REQUEST)
      return
    }

    // Check if user is participant
    const chatRoom = await ChatRepository.findChatRoomById(roomId)
    if (!chatRoom) {
      sendError(res, "Chat room not found", null, STATUS_CODES.NOT_FOUND)
      return
    }

    const isParticipant = chatRoom.participants.some(p => p._id.toString() === userId)
    if (!isParticipant) {
      sendError(res, "Access denied", null, STATUS_CODES.FORBIDDEN)
      return
    }

    // Create message
    const message = await ChatRepository.createMessage({
      sender: userId,
      roomId,
      content,
      messageType,
      mediaUrl,
      fileName,
      fileSize,
      replyTo
    })

    // Update chat room's last message
    await ChatRepository.updateLastMessage(roomId, {
      content,
      sender: userId,
      messageType
    })

    // Get message with sender info
    const messages = await ChatRepository.getRoomMessages(roomId, 1, 0)
    const messageWithSender = messages[0]

    req.app.get('io')?.to(`room_${roomId}`).emit('newMessage', {
  ...messageWithSender,
  senderName: req.user?.username || 'Unknown',
});

    sendSuccess(res, "Message sent successfully", messageWithSender, STATUS_CODES.CREATED)
  })

  /**
   * Get message history
   */
  public getMessageHistory = asyncHandler(async (req: Request, res: Response) => {
    const { roomId } = req.params
    const { limit = 50, skip = 0 } = req.query
    const userId = req.user?.userId

    if (!userId) {
      sendError(res, "User not authenticated", null, STATUS_CODES.UNAUTHORIZED)
      return
    }

    // Check if user is participant
    const chatRoom = await ChatRepository.findChatRoomById(roomId)
    if (!chatRoom) {
      sendError(res, "Chat room not found", null, STATUS_CODES.NOT_FOUND)
      return
    }

    const isParticipant = chatRoom.participants.some(p => p._id.toString() === userId)
    if (!isParticipant) {
      sendError(res, "Access denied", null, STATUS_CODES.FORBIDDEN)
      return
    }

    // Get messages
    const messages = await ChatRepository.getRoomMessages(roomId, Number(limit), Number(skip))

    // Mark messages as read
    await ChatRepository.markMessagesAsRead(roomId, userId)

    sendSuccess(res, "Message history retrieved successfully", messages.reverse()) // Return in chronological order
  })

  /**
   * Get users list
   */
  public getUsersList = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId
    
    if (!userId) {
      sendError(res, "User not authenticated", null, STATUS_CODES.UNAUTHORIZED)
      return
    }

    const users = await UserRepository.findAllExceptCurrent(userId)

    sendSuccess(res, "Users list retrieved successfully", users)
  })

  /**
   * Mark messages as read
   */
  public markMessagesAsRead = asyncHandler(async (req: Request, res: Response) => {
    const { roomId } = req.params
    const userId = req.user?.userId

    if (!userId) {
      sendError(res, "User not authenticated", null, STATUS_CODES.UNAUTHORIZED)
      return
    }

    // Check if user is participant
    const chatRoom = await ChatRepository.findChatRoomById(roomId)
    if (!chatRoom) {
      sendError(res, "Chat room not found", null, STATUS_CODES.NOT_FOUND)
      return
    }

    const isParticipant = chatRoom.participants.some(p => p._id === userId)
    if (!isParticipant) {
      sendError(res, "Access denied", null, STATUS_CODES.FORBIDDEN)
      return
    }

    // Mark messages as read
    await ChatRepository.markMessagesAsRead(roomId, userId)

    sendSuccess(res, "Messages marked as read")
  })

  /**
   * Get unread count
   */
  public getUnreadCount = asyncHandler(async (req: Request, res: Response) => {
    const { roomId } = req.params
    const userId = req.user?.userId

    if (!userId) {
      sendError(res, "User not authenticated", null, STATUS_CODES.UNAUTHORIZED)
      return
    }

    const count = await ChatRepository.getUnreadCount(roomId, userId)

    sendSuccess(res, "Unread count retrieved successfully", { unreadCount: count })
  })
}

// Export singleton instance
export const chatController = new ChatController() 