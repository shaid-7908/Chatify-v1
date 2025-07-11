# Chatify

A real-time chat application built with Express.js, Socket.IO, MongoDB, and TypeScript.

## 🚀 Features

- **Real-time Messaging**: Instant message delivery using Socket.IO
- **Media Sharing**: Upload and share images, videos, audio, and files via AWS S3
- **Online Status**: See who's online and typing indicators
- **Message History**: Persistent chat history with MongoDB
- **Responsive Design**: Mobile-friendly UI with Bootstrap
- **Authentication**: JWT-based authentication with refresh tokens
- **File Upload**: Secure file uploads to AWS S3

## 🛠️ Tech Stack

- **Backend**: Express.js with TypeScript
- **Database**: MongoDB with Mongoose
- **Real-time**: Socket.IO
- **Frontend**: EJS templates with Bootstrap
- **Storage**: AWS S3 for file uploads
- **Authentication**: JWT with httpOnly cookies

## 📋 Prerequisites

- Node.js (v14 or higher)
- MongoDB
- AWS S3 bucket (for file uploads)

## 🚀 Installation

1. **Clone the repository**
       ```bash
    git clone <repository-url>
    cd chatify
    ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```env
   # Server Configuration
   PORT=3000
   NODE_ENV=development

   # MongoDB Configuration
   MONGODB_URL=mongodb://localhost:27017
       MONGODB_DB_NAME=chatify

   # JWT Configuration
   JWT_SECRET=your-super-secret-jwt-key-here
   JWT_REFRESH_SECRET=your-super-secret-refresh-key-here
   JWT_ACCESSTOKEN_TIME=15m
   JWT_REFRESHTOKEN_TIME=7d

   # AWS Configuration
   AWS_ACCESS_KEY_ID=your-aws-access-key
   AWS_SECRET_ACCESS_KEY=your-aws-secret-key
   AWS_REGION=us-east-1
   AWS_S3_BUCKET=your-s3-bucket-name

   # Email Configuration (Optional)
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-email-password

   # Google OAuth (Optional)
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   GOOGLE_REDIDERCT_URI=http://localhost:3000/auth/google/callback

   # Host Environment
   HOST_ENVIORMENT=development
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:3000`

## 📁 Project Structure

```
chatify/
├── app/
│   ├── config/           # Configuration files
│   ├── controller/       # Route controllers
│   ├── middleware/       # Custom middleware
│   ├── model/           # Database models
│   ├── repository/      # Database operations
│   ├── routes/          # Route definitions
│   ├── types/           # TypeScript interfaces
│   └── utils/           # Utility functions
├── public/              # Static files
│   ├── js/             # JavaScript files
│   └── images/         # Images
├── views/               # EJS templates
│   ├── auth/           # Authentication views
│   ├── chat/           # Chat views
│   └── partials/       # Reusable components
├── server.ts            # Main server file
└── package.json
```

## 🔧 API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user
- `POST /auth/logout` - Logout user
- `POST /auth/refresh-token` - Refresh access token
- `GET /auth/me` - Get current user

### Chat
- `GET /chats` - Get user's chat list
- `GET /chats/:roomId` - Get specific chat room
- `POST /chats/create` - Create new chat
- `POST /chats/message/send` - Send message
- `GET /chats/:roomId/messages` - Get message history
- `GET /chats/users` - Get users list

### File Upload
- `POST /upload/message-media` - Upload media for messages
- `POST /upload/profile-photo` - Upload profile photo

## 🎯 Features in Detail

### Real-time Messaging
- Instant message delivery using Socket.IO
- Typing indicators
- Message seen status
- Online/offline status

### Media Sharing
- Image, video, audio, and file uploads
- Secure storage on AWS S3
- File preview in chat
- Support for various file types

### User Management
- User registration and login
- Profile management
- Avatar uploads
- Online status tracking

### Chat Features
- One-on-one chats
- Message history
- Unread message counts
- Real-time notifications

## 🔒 Security Features

- JWT authentication with refresh tokens
- HttpOnly cookies for secure token storage
- Password hashing with bcrypt
- Input validation and sanitization
- CORS protection
- Rate limiting (can be added)

## 🎨 UI/UX Features

- Responsive design with Bootstrap
- Mobile-friendly interface
- Real-time updates without page refresh
- Intuitive chat interface
- Loading states and error handling

## 🚀 Deployment

### Prerequisites
- MongoDB database
- AWS S3 bucket
- Environment variables configured

### Steps
1. Build the project: `npm run build`
2. Start production server: `npm start`
3. Set up reverse proxy (nginx recommended)
4. Configure SSL certificate

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the ISC License.

## 🆘 Support

If you encounter any issues or have questions, please open an issue on GitHub.

## 🔮 Future Enhancements

- Group chat functionality
- Message reactions
- Voice and video calls
- Message encryption
- Push notifications
- Message search
- User blocking
- Message forwarding
- Status updates
- Dark mode 