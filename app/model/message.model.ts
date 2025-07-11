import mongoose, { Schema, model } from "mongoose";
import { MessageDocument } from "../types/chat.types";

const messageSchema = new Schema<MessageDocument>(
  {
    sender: { type: Schema.Types.ObjectId, ref: "User", required: true },
    roomId: { type: Schema.Types.ObjectId, ref: "ChatRoom", required: true },
    content: { type: String, required: true },
    messageType: { 
      type: String, 
      enum: ["text", "image", "video", "audio", "file"], 
      default: "text" 
    },
    mediaUrl: { type: String },
    fileName: { type: String },
    fileSize: { type: Number },
    isRead: { type: Boolean, default: false },
    readBy: [{ 
      userId: { type: Schema.Types.ObjectId, ref: "User" },
      readAt: { type: Date, default: Date.now }
    }],
    replyTo: { type: Schema.Types.ObjectId, ref: "Message" }
  },
  {
    timestamps: true,
  }
);

export const MessageModel = model<MessageDocument>("Message", messageSchema); 