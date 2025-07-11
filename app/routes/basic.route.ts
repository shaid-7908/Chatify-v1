import express from 'express'
import basicController from '../controller/basic.controller'
import pageRouter from './page.route'
import { upload } from '../middelware/multer.middleware'

const basicRouter = express.Router()

// Page routes
basicRouter.use('/', pageRouter)

// API routes
basicRouter.get('/success-response', basicController.exampleSuccessControllerFunction)
basicRouter.get('/error-response', basicController.eaxmpleErrorControllerFunction)

// File uploads 
// Multi file upload
basicRouter.post('/multi-image', upload.fields([
  { name: 'one-image', maxCount: 1 }, 
  { name: 'two-image', maxCount: 2 }
]), basicController.exampleMultiFileUploda)

export default basicRouter