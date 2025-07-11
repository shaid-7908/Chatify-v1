import mongoose, { Schema, model } from "mongoose";
import { ChatRoomDocument } from "../types/chat.types";

const chatRoomSchema = new Schema<ChatRoomDocument>(
  {
    participants: [{ type: Schema.Types.ObjectId, ref: "User", required: true }],
    isGroup: { type: Boolean, default: false },
    name: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    lastMessage: {
      content: String,
      sender: { type: Schema.Types.ObjectId, ref: "User" },
      timestamp: { type: Date, default: Date.now },
      messageType: { type: String, enum: ["text", "image", "video", "audio", "file"], default: "text" }
    },
    unreadCount: { type: Number, default: 0 }
  },
  {
    timestamps: true,
  }
);

export const ChatRoomModel = model<ChatRoomDocument>("ChatRoom", chatRoomSchema); 