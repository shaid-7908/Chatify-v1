import { Router } from 'express'
import { uploadMessageMedia, uploadProfilePhoto } from '../controller/upload.controller'
import { verifyJWT } from '../middelware/auth.middleware'
import { upload } from '../middelware/multer.middleware'

const router = Router()

// All upload routes require authentication
router.use(verifyJWT)

// Upload routes
router.post('/message-media', upload.single('file'), uploadMessageMedia)
router.post('/profile-photo', upload.single('file'), uploadProfilePhoto)

export default router 