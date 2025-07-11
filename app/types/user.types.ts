import { Document } from "mongoose";

// MongoDB User Schema interface
export interface UserDocument extends Document {
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  avatarUrl?: string;
  profileImage?: string;
  dateOfBirth?: Date;
  password: string;
  refreshToken?: string;
  googleId?: string;
  role: "user" | "admin" | string;
  isVerified: boolean;
  isOnline: boolean;
  lastSeen: Date;
}

// JWT Payload (used for signing JWT tokens)
export interface JWTPayload {
  userId: string;
  email: string;
  username: string;
}

// Data to send back to frontend after login/registration (safe fields)
export interface PublicUserData {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl?: string;
  isOnline: boolean;
  lastSeen: Date;
}

// OTP document used for storing verification codes
export interface OtpDocument extends Document {
  userId: string;
  emailOtp: string;
  createdAt?: Date;
}
