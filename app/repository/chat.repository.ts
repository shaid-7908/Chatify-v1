import { ChatRoomModel } from '../model/chatRoom.model'
import { MessageModel } from '../model/message.model'
import { ChatRoomWithParticipants, MessageWithSender } from '../types/chat.types'
import mongoose from 'mongoose'

export class ChatRepository {
  // Create new chat room
  static async createChatRoom(roomData: {
    participants: string[]
    isGroup: boolean
    name?: string
    createdBy?: string
  }) {
    return await ChatRoomModel.create(roomData)
  }

  // Find chat room by ID with participants
  static async findChatRoomById(roomId: string): Promise<ChatRoomWithParticipants | null> {
    const rooms = await ChatRoomModel.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(roomId) } },
      {
        $lookup: {
          from: 'users',
          localField: 'participants',
          foreignField: '_id',
          as: 'participants'
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'lastMessage.sender',
          foreignField: '_id',
          as: 'lastMessageSender'
        }
      },
      {
        $addFields: {
          'lastMessage.sender': { $arrayElemAt: ['$lastMessageSender', 0] }
        }
      },
      {
        $project: {
          participants: {
            _id: 1,
            username: 1,
            firstName: 1,
            lastName: 1,
            avatarUrl: 1,
            isOnline: 1,
            lastSeen: 1
          },
          isGroup: 1,
          name: 1,
          createdBy: 1,
          lastMessage: 1,
          unreadCount: 1,
          createdAt: 1,
          updatedAt: 1
        }
      }
    ])
    
    return rooms[0] || null
  }

  // Find user's chat rooms
  static async findUserChatRooms(userId: string): Promise<ChatRoomWithParticipants[]> {
    return await ChatRoomModel.aggregate([
      { $match: { participants: new mongoose.Types.ObjectId(userId) } },
      {
        $lookup: {
          from: 'users',
          localField: 'participants',
          foreignField: '_id',
          as: 'participants'
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'lastMessage.sender',
          foreignField: '_id',
          as: 'lastMessageSender'
        }
      },
      {
        $addFields: {
          'lastMessage.sender': { $arrayElemAt: ['$lastMessageSender', 0] }
        }
      },
      {
        $project: {
          participants: {
            _id: 1,
            username: 1,
            firstName: 1,
            lastName: 1,
            avatarUrl: 1,
            isOnline: 1,
            lastSeen: 1
          },
          isGroup: 1,
          name: 1,
          createdBy: 1,
          lastMessage: 1,
          unreadCount: 1,
          createdAt: 1,
          updatedAt: 1
        }
      },
      { $sort: { updatedAt: -1 } }
    ])
  }

  // Find or create one-on-one chat
  static async findOrCreateOneOnOneChat(userId1: string, userId2: string) {
    // Check if chat already exists
    const existingChat = await ChatRoomModel.findOne({
      participants: { $all: [userId1, userId2] },
      isGroup: false
    })

    if (existingChat) {
      return await this.findChatRoomById(existingChat._id as string)
    }

    // Create new chat
    const newChat = await ChatRoomModel.create({
      participants: [userId1, userId2],
      isGroup: false
    })

    return await this.findChatRoomById(newChat._id as string)
  }

  // Create new message
  static async createMessage(messageData: {
    sender: string
    roomId: string
    content: string
    messageType: "text" | "image" | "video" | "audio" | "file"
    mediaUrl?: string
    fileName?: string
    fileSize?: number
    replyTo?: string
  }) {
    return await MessageModel.create(messageData)
  }

  // Get messages for a room with sender info
  static async getRoomMessages(roomId: string, limit: number = 50, skip: number = 0): Promise<MessageWithSender[]> {
    return await MessageModel.aggregate([
      { $match: { roomId: new mongoose.Types.ObjectId(roomId) } },
      {
        $lookup: {
          from: 'users',
          localField: 'sender',
          foreignField: '_id',
          as: 'sender'
        }
      },
      {
        $addFields: {
          sender: { $arrayElemAt: ['$sender', 0] }
        }
      },
      {
        $project: {
          sender: {
            _id: 1,
            username: 1,
            firstName: 1,
            lastName: 1,
            avatarUrl: 1
          },
          roomId: 1,
          content: 1,
          messageType: 1,
          mediaUrl: 1,
          fileName: 1,
          fileSize: 1,
          isRead: 1,
          readBy: 1,
          replyTo: 1,
          createdAt: 1,
          updatedAt: 1
        }
      },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit }
    ])
  }

  // Update chat room's last message
  static async updateLastMessage(roomId: string, messageData: {
    content: string
    sender: string
    messageType: "text" | "image" | "video" | "audio" | "file"
  }) {
    return await ChatRoomModel.findByIdAndUpdate(
      roomId,
      {
        lastMessage: {
          content: messageData.content,
          sender: messageData.sender,
          timestamp: new Date(),
          messageType: messageData.messageType
        }
      },
      { new: true }
    )
  }

  // Mark messages as read
  static async markMessagesAsRead(roomId: string, userId: string) {
    return await MessageModel.updateMany(
      {
        roomId,
        sender: { $ne: userId },
        'readBy.userId': { $ne: userId }
      },
      {
        $push: {
          readBy: {
            userId,
            readAt: new Date()
          }
        },
        $set: { isRead: true }
      }
    )
  }

  // Get unread message count for a room
  static async getUnreadCount(roomId: string, userId: string) {
    const result = await MessageModel.aggregate([
      {
        $match: {
          roomId: new mongoose.Types.ObjectId(roomId),
          sender: { $ne: new mongoose.Types.ObjectId(userId) },
          'readBy.userId': { $ne: new mongoose.Types.ObjectId(userId) }
        }
      },
      { $count: 'count' }
    ])
    
    return result[0]?.count || 0
  }
} 