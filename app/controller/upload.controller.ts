import { Request, Response } from 'express'
import AWS from 'aws-sdk'
import { asyncHandler } from '../utils/async.hadler'
import { ApiResponse } from '../utils/unified.response'
import envConfig from '../config/env.config'

// Configure AWS
AWS.config.update({
  accessKeyId: envConfig.AWS_ACCESS_KEY_ID,
  secretAccessKey: envConfig.AWS_SECRET_ACCESS_KEY,
  region: envConfig.AWS_REGION
})

const s3 = new AWS.S3()

export const uploadMessageMedia = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.userId

  if (!userId) {
    throw new ApiResponse(401, "User not authenticated")
  }

  if (!req.file) {
    throw new ApiResponse(400, "No file uploaded")
  }

  const file = req.file
  const fileType = file.mimetype.split('/')[0] // image, video, audio, application

  // Determine message type based on file type
  let messageType: "image" | "video" | "audio" | "file" = "file"
  if (fileType === "image") messageType = "image"
  else if (fileType === "video") messageType = "video"
  else if (fileType === "audio") messageType = "audio"

  // Generate unique filename
  const timestamp = Date.now()
  const fileName = `${userId}/${timestamp}-${file.originalname}`
  const key = `chat-media/${fileName}`

  // Upload to S3
  const uploadParams = {
    Bucket: envConfig.AWS_S3_BUCKET,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
    ACL: 'public-read'
  }

  try {
    const result = await s3.upload(uploadParams).promise()
    
    return res.status(200).json({
      success: true,
      message: "File uploaded successfully",
      data: {
        mediaUrl: result.Location,
        fileName: file.originalname,
        fileSize: file.size,
        messageType
      }
    })
  } catch (error) {
    console.error('S3 upload error:', error)
    throw new ApiResponse(500, "Failed to upload file")
  }
})

export const uploadProfilePhoto = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.userId

  if (!userId) {
    throw new ApiResponse(401, "User not authenticated")
  }

  if (!req.file) {
    throw new ApiResponse(400, "No file uploaded")
  }

  const file = req.file

  // Validate file type (only images allowed for profile photos)
  if (!file.mimetype.startsWith('image/')) {
    throw new ApiResponse(400, "Only image files are allowed for profile photos")
  }

  // Generate unique filename
  const timestamp = Date.now()
  const fileName = `${userId}/profile-${timestamp}-${file.originalname}`
  const key = `profile-photos/${fileName}`

  // Upload to S3
  const uploadParams = {
    Bucket: envConfig.AWS_S3_BUCKET,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
    ACL: 'public-read'
  }

  try {
    const result = await s3.upload(uploadParams).promise()
    
    return res.status(200).json({
      success: true,
      message: "Profile photo uploaded successfully",
      data: {
        avatarUrl: result.Location
      }
    })
  } catch (error) {
    console.error('S3 upload error:', error)
    throw new ApiResponse(500, "Failed to upload profile photo")
  }
}) 