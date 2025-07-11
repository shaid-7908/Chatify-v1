import { UserModel } from '../model/user.model'
import { PublicUserData } from '../types/user.types'
import mongoose from 'mongoose'

export class UserRepository {
  // Create new user
  static async createUser(userData: {
    username: string
    firstName: string
    lastName: string
    email: string
    phone: string
    password: string
    avatarUrl?: string
  }) {
    return await UserModel.create(userData)
  }

  // Find user by email
  static async findByEmail(email: string) {
    return await UserModel.findOne({ email })
  }

  // Find user by username
  static async findByUsername(username: string) {
    return await UserModel.findOne({ username })
  }

  // Find user by ID with public data
  static async findByIdPublic(userId: string): Promise<PublicUserData | null> {
    const user = await UserModel.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(userId) } },
      {
        $project: {
          id: '$_id',
          username: 1,
          firstName: 1,
          lastName: 1,
          email: 1,
          avatarUrl: 1,
          isOnline: 1,
          lastSeen: 1
        }
      }
    ])
    
    return user[0] || null
  }

  // Find all users except current user
  static async findAllExceptCurrent(currentUserId: string) {
    return await UserModel.aggregate([
      { $match: { _id: { $ne: new mongoose.Types.ObjectId(currentUserId) } } },
      {
        $project: {
          id: '$_id',
          username: 1,
          firstName: 1,
          lastName: 1,
          email: 1,
          avatarUrl: 1,
          isOnline: 1,
          lastSeen: 1
        }
      },
      { $sort: { username: 1 } }
    ])
  }

  // Update user online status
  static async updateOnlineStatus(userId: string, isOnline: boolean) {
    return await UserModel.findByIdAndUpdate(
      userId,
      { 
        isOnline, 
        lastSeen: new Date() 
      },
      { new: true }
    )
  }

  // Update user profile
  static async updateProfile(userId: string, updateData: {
    firstName?: string
    lastName?: string
    avatarUrl?: string
    phone?: string
  }) {
    return await UserModel.findByIdAndUpdate(
      userId,
      updateData,
      { new: true }
    )
  }

  // Update refresh token
  static async updateRefreshToken(userId: string, refreshToken: string) {
    return await UserModel.findByIdAndUpdate(
      userId,
      { refreshToken },
      { new: true }
    )
  }

  // Find user by ID (for internal use)
  static async findById(userId: string) {
    return await UserModel.findById(userId)
  }
} 