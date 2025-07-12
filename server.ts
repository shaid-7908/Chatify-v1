import express from 'express'
import cookieParser from 'cookie-parser'
import path from 'path'
import { createServer } from 'http'
import { Server } from 'socket.io'
import { errorHandler } from './app/middelware/errorhandler.middleware'
import envConfig from './app/config/env.config'
import { connectDB } from './app/config/db.connection'
import basicRouter from './app/routes/basic.route'
import authRouter from './app/routes/auth.route'
import chatRouter from './app/routes/chat.route'
import uploadRouter from './app/routes/upload.route'
import pageRouter from './app/routes/page.route'
import { setupSocketIO } from './app/config/socket.config'
import morgan from 'morgan'

const app = express()
const httpServer = createServer(app)
const io = new Server(httpServer)

// Basic setup
app.use(express.json())
app.use(cookieParser())
app.use(express.urlencoded({ extended: true }))
app.use(morgan('dev'))

// Static files
app.use(express.static(path.join(__dirname, "public")))

// View engine setup
app.set("view engine", "ejs")
app.set("views", path.join(__dirname, "views"))
app.set('io',io)
// Routes
//app.use('/', basicRouter)
app.use('/', pageRouter)
app.use('/auth', authRouter)
app.use('/chats', chatRouter)
app.use('/upload', uploadRouter)

// Setup Socket.IO
setupSocketIO(io)

// Global error handler middleware
app.use(errorHandler)

// Start the server
const startServer = async () => {
  try {
    await connectDB() // Connect to MongoDB
    httpServer.listen(envConfig.PORT, () => {
      console.log(`✅ Server running on http://localhost:${envConfig.PORT}`)
    })
  } catch (err) {
    console.error("❌ Failed to connect to DB. Server not started.", err)
    process.exit(1) // Exit if DB fails
  }
}

startServer()
