import { Router } from 'express'
import { authController } from '../controller/auth.controller'
import { verifyJWT, verifyRefreshToken } from '../middelware/auth.middleware'

const authRouter = Router()

// Public routes
authRouter.post('/register', authController.registerUser)
authRouter.post('/login', authController.loginUser)

// Protected routes
authRouter.post('/logout', verifyJWT, authController.logoutUser)
authRouter.post('/refresh-token', verifyRefreshToken, authController.refreshAccessToken)
authRouter.get('/me', verifyJWT, authController.getCurrentUser)

export default authRouter 