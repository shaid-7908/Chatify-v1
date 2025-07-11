import { Router } from 'express'
import { 
  renderHome, 
  renderLogin, 
  renderRegister, 
  renderChatList, 
  renderProfile 
} from '../controller/page.controller'
import { verifyJWT } from '../middelware/auth.middleware'

const pageRouter = Router()

// Public routes
pageRouter.get('/', renderHome)
pageRouter.get('/auth/login', renderLogin)
pageRouter.get('/auth/register', renderRegister)

// Protected routes
pageRouter.get('/chats', verifyJWT, renderChatList)
pageRouter.get('/profile', verifyJWT, renderProfile)

export default pageRouter 