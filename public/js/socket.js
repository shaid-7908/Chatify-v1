// Socket.IO functionality
class SocketManager {
    constructor() {
        this.socket = null;
        this.connected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.init();
    }

    init() {
        this.connect();
        this.bindEvents();
    }

    connect() {
        try {
            this.socket = io({
                auth: {
                    token: this.getCookie('accessToken')
                },
                transports: ['websocket', 'polling'],
                reconnection: true,
                reconnectionAttempts: this.maxReconnectAttempts,
                reconnectionDelay: 1000,
                reconnectionDelayMax: 5000
            });

            this.setupEventListeners();
        } catch (error) {
            console.error('Failed to connect to Socket.IO:', error);
        }
    }

    setupEventListeners() {
        this.socket.on('connect', () => {
            console.log('Connected to Socket.IO server');
            this.connected = true;
            this.reconnectAttempts = 0;
            this.updateConnectionStatus(true);
        });

        this.socket.on('disconnect', (reason) => {
            console.log('Disconnected from Socket.IO server:', reason);
            this.connected = false;
            this.updateConnectionStatus(false);
        });

        this.socket.on('connect_error', (error) => {
            console.error('Socket.IO connection error:', error);
            this.reconnectAttempts++;
            
            if (this.reconnectAttempts >= this.maxReconnectAttempts) {
                console.error('Max reconnection attempts reached');
                this.showConnectionError();
            }
        });

        this.socket.on('reconnect', (attemptNumber) => {
            console.log('Reconnected to Socket.IO server after', attemptNumber, 'attempts');
            this.connected = true;
            this.reconnectAttempts = 0;
            this.updateConnectionStatus(true);
        });

        this.socket.on('reconnect_error', (error) => {
            console.error('Socket.IO reconnection error:', error);
        });

        this.socket.on('reconnect_failed', () => {
            console.error('Socket.IO reconnection failed');
            this.showConnectionError();
        });
    }

    bindEvents() {
        // Handle page visibility changes
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                this.reconnectIfNeeded();
            }
        });

        // Handle beforeunload
        window.addEventListener('beforeunload', () => {
            if (this.socket) {
                this.socket.disconnect();
            }
        });
    }

    reconnectIfNeeded() {
        if (!this.connected && this.socket) {
            console.log('Attempting to reconnect...');
            this.socket.connect();
        }
    }

    updateConnectionStatus(connected) {
        // Update UI to show connection status
        const statusElement = document.getElementById('connectionStatus');
        if (statusElement) {
            if (connected) {
                statusElement.innerHTML = '<span class="badge bg-success">Online</span>';
                statusElement.style.display = 'block';
            } else {
                statusElement.innerHTML = '<span class="badge bg-danger">Offline</span>';
                statusElement.style.display = 'block';
            }
        }
    }

    showConnectionError() {
        // Show user-friendly error message
        const errorHtml = `
            <div class="alert alert-warning alert-dismissible fade show" role="alert">
                <i class="bi bi-exclamation-triangle"></i>
                Connection lost. Trying to reconnect...
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;
        
        // Insert at the top of the page
        const container = document.querySelector('.container-fluid');
        if (container) {
            container.insertAdjacentHTML('afterbegin', errorHtml);
        }
    }

    emit(event, data) {
        if (this.socket && this.connected) {
            this.socket.emit(event, data);
        } else {
            console.warn('Socket not connected, cannot emit event:', event);
        }
    }

    on(event, callback) {
        if (this.socket) {
            this.socket.on(event, callback);
        }
    }

    off(event, callback) {
        if (this.socket) {
            this.socket.off(event, callback);
        }
    }

    joinRoom(roomId) {
        this.emit('joinRoom', roomId);
    }

    leaveRoom(roomId) {
        this.emit('leaveRoom', roomId);
    }

    sendMessage(messageData) {
        this.emit('sendMessage', messageData);
    }

    startTyping(roomId) {
        this.emit('typing', roomId);
    }

    stopTyping(roomId) {
        this.emit('stopTyping', roomId);
    }

    markMessageAsSeen(messageId, roomId) {
        this.emit('messageSeen', { messageId, roomId });
    }

    getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
    }

    // Utility methods for chat functionality
    setupChatEvents() {
        // New message received
        this.on('newMessage', (message) => {
            this.handleNewMessage(message);
        });

        // User typing
        this.on('userTyping', (data) => {
            this.handleUserTyping(data);
        });

        // User stopped typing
        this.on('userStopTyping', (data) => {
            this.handleUserStopTyping(data);
        });

        // Message seen update
        this.on('messageSeenUpdate', (data) => {
            this.handleMessageSeenUpdate(data);
        });

        // User online/offline
        this.on('userOnline', (data) => {
            this.handleUserOnline(data);
        });

        this.on('userOffline', (data) => {
            this.handleUserOffline(data);
        });
    }

    handleNewMessage(message) {
        // This will be handled by the ChatManager
        if (window.chatManager) {
            window.chatManager.handleNewMessage(message);
        }
    }

    handleUserTyping(data) {
        if (window.chatManager) {
            window.chatManager.showTypingIndicator(data);
        }
    }

    handleUserStopTyping(data) {
        if (window.chatManager) {
            window.chatManager.hideTypingIndicator();
        }
    }

    handleMessageSeenUpdate(data) {
        // Update message seen status in UI
        const messageElement = document.querySelector(`[data-message-id="${data.messageId}"]`);
        if (messageElement) {
            messageElement.classList.add('seen');
        }
    }

    handleUserOnline(data) {
        // Update user online status in chat list
        const userElement = document.querySelector(`[data-user-id="${data.userId}"]`);
        if (userElement) {
            const statusElement = userElement.querySelector('.user-status');
            if (statusElement) {
                statusElement.innerHTML = '<span class="online-indicator"></span>online';
            }
        }
    }

    handleUserOffline(data) {
        // Update user offline status in chat list
        const userElement = document.querySelector(`[data-user-id="${data.userId}"]`);
        if (userElement) {
            const statusElement = userElement.querySelector('.user-status');
            if (statusElement) {
                statusElement.innerHTML = '<span class="offline-indicator"></span>offline';
            }
        }
    }
}

// Initialize socket manager when document is ready
$(document).ready(function() {
    window.socketManager = new SocketManager();
    
    // Setup chat events after a short delay to ensure chat manager is initialized
    setTimeout(() => {
        if (window.socketManager) {
            window.socketManager.setupChatEvents();
        }
    }, 100);
}); 