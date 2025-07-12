import { Server, Socket } from 'socket.io'
import jwt from 'jsonwebtoken'
import envConfig from './env.config'
import { UserModel } from '../model/user.model'

interface AuthenticatedSocket extends Socket {
  userId?: string
  username?: string
}

// Helper to parse cookies from a string
function parseCookies(cookieHeader: string | undefined): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!cookieHeader) return cookies;
  cookieHeader.split(';').forEach(cookie => {
    const [name, ...rest] = cookie.trim().split('=');
    cookies[name] = decodeURIComponent(rest.join('='));
  });
  return cookies;
}

export const setupSocketIO = (io: Server) => {
  // Authentication middleware
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      // Parse cookies from the handshake headers
      const cookies = parseCookies(socket.handshake.headers.cookie);
      const token = cookies['accessToken'];

      if (!token) {
        return next(new Error('Authentication error: No access token in cookies'));
      }

      const decoded = jwt.verify(token, envConfig.JWT_SECRET) as any;
      const user = await UserModel.findById(decoded.id || decoded.userId).select('username');

      if (!user) {
        return next(new Error('User not found'));
      }

      socket.userId = decoded.id || decoded.userId;
      socket.username = user.username;
      next();
    } catch (error) {
      next(new Error('Authentication error: Invalid or expired token'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    console.log(`User connected: ${socket.username}`);

    // Update user online status
    UserModel.findByIdAndUpdate(socket.userId, {
      isOnline: true,
      lastSeen: new Date()
    }).exec();

    // Join user to their personal room
    socket.join(`user_${socket.userId}`);

    // Handle joining chat rooms
    socket.on('joinRoom', (roomId: string) => {
      console.log(`User ${socket.username} attempting to join room: ${roomId}`);
      
      // Leave all rooms except the user's personal room
      for (const room of socket.rooms) {
        if (room !== socket.id && room !== `user_${socket.userId}`) {
          socket.leave(room);
          console.log(`Left room: ${room}`);
        }
      }
      
      socket.join(`room_${roomId}`);
      socket.join(`user_${socket.userId}`);
      console.log(`User ${socket.username} joined room: ${roomId}`);
      console.log(`Current rooms for ${socket.username}:`, Array.from(socket.rooms));
    });

    // Handle sending messages
    socket.on('sendMessage', (data: {
      roomId: string;
      content: string;
      messageType: string;
      mediaUrl?: string;
    }) => {
      socket.to(`room_${data.roomId}`).emit('newMessage', {
        ...data,
        sender: socket.userId,
        senderName: socket.username,
        timestamp: new Date()
      });
    });

    // Handle typing indicators
    socket.on('typing', (roomId: string) => {
      console.log(`User ${socket.username} is typing in room: ${roomId}`);
      socket.to(`room_${roomId}`).emit('userTyping', {
        userId: socket.userId,
        username: socket.username,
        roomId
      });
    });

    socket.on('stopTyping', (roomId: string) => {
      console.log(`User ${socket.username} stopped typing in room: ${roomId}`);
      socket.to(`room_${roomId}`).emit('userStopTyping', {
        userId: socket.userId,
        username: socket.username,
        roomId
      });
    });

    // Handle message seen
    socket.on('messageSeen', (data: { messageId: string, roomId: string }) => {
      socket.to(`room_${data.roomId}`).emit('messageSeenUpdate', {
        messageId: data.messageId,
        seenBy: socket.userId,
        seenAt: new Date()
      });
    });

    // Handle disconnection
    socket.on('disconnect', async () => {
      console.log(`User disconnected: ${socket.username}`);

      // Update user offline status
      if (socket.userId) {
        await UserModel.findByIdAndUpdate(socket.userId, {
          isOnline: false,
          lastSeen: new Date()
        }).exec();
      }
    });
  });
} 