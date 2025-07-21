import { Request, Response } from 'express'
import AWS from 'aws-sdk'
import { asyncHandler } from '../utils/async.hadler'
//import { ApiResponse } from '../utils/unified.response'
import { sendError } from '../utils/unified.response'
import envConfig from '../config/env.config'
import STATUS_CODES from '../utils/status.codes'

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
    return sendError(res,"User not authenticated" ,null,STATUS_CODES.UNAUTHORIZED)
  }

  if (!req.file) {
    return sendError(res,"No file uploaded" ,null,STATUS_CODES.BAD_REQUEST)
  }

  const file = req.file
  const fileType = file.mimetype.split('/')[0] // image, video, audio, application
  console.log(file)
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
    return sendError(res,"Failed to upload file" ,null,STATUS_CODES.INTERNAL_SERVER_ERROR)
  }
})

export const uploadProfilePhoto = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.userId

  if (!userId) {
    return sendError(res,"User not authenticated" ,null,STATUS_CODES.UNAUTHORIZED)
  }

  if (!req.file) {
    return sendError(res,"No file uploaded" ,null,STATUS_CODES.BAD_REQUEST)
  }

  const file = req.file

  // Validate file type (only images allowed for profile photos)
  if (!file.mimetype.startsWith('image/')) {
    return sendError(res,"Only image files are allowed for profile photos" ,null,STATUS_CODES.BAD_REQUEST)
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
    return sendError(res,"Failed to upload profile photo" ,null,STATUS_CODES.INTERNAL_SERVER_ERROR)
  }
}) 