import { Request, Response } from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { UserRepository } from '../repository/user.repository'
import { generateAccessToken, generateRefreshToken } from '../utils/generate.token'
import envConfig from '../config/env.config'
import { asyncHandler } from '../utils/async.hadler'
import { sendError, sendSuccess } from '../utils/unified.response'
import { JwtPayload } from '../types/auth.types'
import STATUS_CODES from '../utils/status.codes'

export class AuthController {
  /**
   * Register a new user
   */
  public registerUser = asyncHandler(async (req: Request, res: Response) => {
    const { username, firstName, lastName, email, phone, password } = req.body

    // Check if user already exists
    const existingUser = await UserRepository.findByEmail(email)
    if (existingUser) {
      sendError(res, "User with this email already exists", null, STATUS_CODES.CONFLICT)
      return
    }

    const existingUsername = await UserRepository.findByUsername(username)
    if (existingUsername) {
      sendError(res, "Username already taken", null, STATUS_CODES.CONFLICT)
      return
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user
    const user = await UserRepository.createUser({
      username,
      firstName,
      lastName,
      email,
      phone,
      password: hashedPassword
    })

    const jwtPayloadUser: JwtPayload = {
      email: user.email,
      id: user._id as string,
      role: user.role
    }

    // Generate tokens
    const accessToken = generateAccessToken(jwtPayloadUser)
    const refreshToken = generateRefreshToken(jwtPayloadUser)

    // Update user with refresh token
    await UserRepository.updateRefreshToken(user._id as string, refreshToken)

    // Set cookies
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: envConfig.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 15 * 60 * 1000 // 15 minutes
    })

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: envConfig.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    })

    // Return user data (without password)
    const userData = {
      id: user._id,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      avatarUrl: user.avatarUrl
    }

    sendSuccess(res, "User registered successfully", userData, STATUS_CODES.CREATED)
  })

  /**
   * Login user
   */
  public loginUser = asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body

    // Find user
    const user = await UserRepository.findByEmail(email)
    if (!user) {
      sendError(res, "Email is not registered", null, STATUS_CODES.UNAUTHORIZED)
      return
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      sendError(res, "Invalid email or password", null, STATUS_CODES.UNAUTHORIZED)
      return
    }

    // Generate tokens
    const jwtPayloadUser: JwtPayload = {
      email: user.email,
      id: user._id as string,
      role: user.role
    }

    const accessToken = generateAccessToken(jwtPayloadUser)
    const refreshToken = generateRefreshToken(jwtPayloadUser)

    // Update user with refresh token and online status
    await UserRepository.updateRefreshToken(user._id as string, refreshToken)
    await UserRepository.updateOnlineStatus(user._id as string, true)

    // Set cookies
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: envConfig.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 15 * 60 * 1000 // 15 minutes
    })

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: envConfig.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    })

    // Return user data
    const userData = {
      id: user._id,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      avatarUrl: user.avatarUrl
    }

    sendSuccess(res, "Login successful", userData)
  })

  /**
   * Logout user
   */
  public logoutUser = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId

    if (userId) {
      // Update user offline status
      await UserRepository.updateOnlineStatus(userId, false)
    }

    // Clear cookies
    res.clearCookie("accessToken")
    res.clearCookie("refreshToken")

    sendSuccess(res, "Logged out successfully")
  })

  /**
   * Refresh access token
   */
  public refreshAccessToken = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId
    const email = req.user?.email

    if (!userId || !email) {
      sendError(res, "Invalid refresh token", null, STATUS_CODES.UNAUTHORIZED)
      return
    }

    // Generate new access token
    const jwtPayloadUser: JwtPayload = {
      email,
      id: userId,
      role: req.user?.role || "user"
    }

    const accessToken = generateAccessToken(jwtPayloadUser)

    // Set new access token cookie
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: envConfig.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 15 * 60 * 1000 // 15 minutes
    })

    sendSuccess(res, "Access token refreshed")
  })

  /**
   * Get current user
   */
  public getCurrentUser = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId

    if (!userId) {
      sendError(res, "User not authenticated", null, STATUS_CODES.UNAUTHORIZED)
      return
    }

    const user = await UserRepository.findByIdPublic(userId)
    if (!user) {
      sendError(res, "User not found", null, STATUS_CODES.NOT_FOUND)
      return
    }

    sendSuccess(res, "User retrieved successfully", user)
  })
}

// Export singleton instance
export const authController = new AuthController() 