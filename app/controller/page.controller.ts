import { Request, Response } from 'express'
import { asyncHandler } from '../utils/async.hadler'

export const renderHome = asyncHandler(async (req: Request, res: Response) => {
  res.render('index', { 
    title: 'Home',
    user: req.user 
  })
})

export const renderLogin = asyncHandler(async (req: Request, res: Response) => {
  res.render('auth/login', { 
    title: 'Login',
    error: req.query.error 
  })
})

export const renderRegister = asyncHandler(async (req: Request, res: Response) => {
  res.render('auth/register', { 
    title: 'Register',
    error: req.query.error 
  })
})

export const renderChatList = asyncHandler(async (req: Request, res: Response) => {
  res.render('chat/list', { 
    title: 'Chats',
    user: req.user 
  })
})

export const renderProfile = asyncHandler(async (req: Request, res: Response) => {
  res.render('profile/index', { 
    title: 'Profile',
    user: req.user 
  })
}) 