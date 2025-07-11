import { Document } from "mongoose";

// ChatRoom Document interface
export interface ChatRoomDocument extends Document {
  participants: string[];
  isGroup: boolean;
  name?: string;
  createdBy?: string;
  lastMessage?: {
    content: string;
    sender: string;
    timestamp: Date;
    messageType: "text" | "image" | "video" | "audio" | "file";
  };
  unreadCount: number;
}

// Message Document interface
export interface MessageDocument extends Document {
  sender: string;
  roomId: string;
  content: string;
  messageType: "text" | "image" | "video" | "audio" | "file";
  mediaUrl?: string;
  fileName?: string;
  fileSize?: number;
  isRead: boolean;
  readBy: Array<{
    userId: string;
    readAt: Date;
  }>;
  replyTo?: string;
}

// Chat room with populated data
export interface ChatRoomWithParticipants {
  _id: string;
  participants: Array<{
    _id: string;
    username: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
    isOnline: boolean;
    lastSeen: Date;
  }>;
  isGroup: boolean;
  name?: string;
  createdBy?: string;
  lastMessage?: {
    content: string;
    sender: {
      _id: string;
      username: string;
      firstName: string;
      lastName: string;
    };
    timestamp: Date;
    messageType: "text" | "image" | "video" | "audio" | "file";
  };
  unreadCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// Message with populated sender data
export interface MessageWithSender {
  _id: string;
  sender: {
    _id: string;
    username: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
  };
  roomId: string;
  content: string;
  messageType: "text" | "image" | "video" | "audio" | "file";
  mediaUrl?: string;
  fileName?: string;
  fileSize?: number;
  isRead: boolean;
  readBy: Array<{
    userId: string;
    readAt: Date;
  }>;
  replyTo?: string;
  createdAt: Date;
  updatedAt: Date;
} 