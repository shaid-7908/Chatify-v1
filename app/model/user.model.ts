import mongoose, { Schema, model } from "mongoose";
import { UserDocument } from "../types/user.types";

const userSchema = new Schema<UserDocument>(
  {
    username: { type: String, required: true, unique: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    avatarUrl: { type: String },
    profileImage: { type: String },
    dateOfBirth: { type: Date },
    password: { type: String, required: true },
    refreshToken: { type: String },
    googleId: { type: String },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    isVerified: { type: Boolean, default: false },
    isOnline: { type: Boolean, default: false },
    lastSeen: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

export const UserModel = model<UserDocument>("User", userSchema);

