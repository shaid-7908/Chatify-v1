// Chat functionality
class ChatManager {
    constructor() {
        this.currentChatId = null;
        this.socket = null;
        this.typingTimeout = null;
        this.init();
    }

    init() {
        console.log('Initializing ChatManager...');
        console.log('Current user ID on init:', window.currentUserId);
        this.initSocket();
        this.bindEvents();
        this.loadChatList();
        this.loadUsers();
    }

    initSocket() {
        this.socket = io({
            auth: {
                token: this.getCookie('accessToken')
            }
        });

        this.socket.on('newMessage', (message) => {
            this.handleNewMessage(message);
        });

        this.socket.on('userTyping', (data) => {
            this.showTypingIndicator(data);
        });

        this.socket.on('userStopTyping', (data) => {
            this.hideTypingIndicator();
        });

        this.socket.on('messageSeenUpdate', (data) => {
            this.updateMessageSeen(data);
        });
    }

    bindEvents() {
        $('#sendBtn').click(() => this.sendMessage());
        $('#messageText').keypress((e) => {
            if (e.which === 13) {
                this.sendMessage();
            } else {
                this.handleTyping();
            }
        });

        $('#attachBtn').click(() => $('#fileInput').click());
        $('#fileInput').change((e) => {
            const file = e.target.files[0];
            if (file) {
                this.uploadFile(file);
            }
        });

        $('#userSearch').on('input', (e) => {
            this.filterUsers(e.target.value);
        });
    }

    loadChatList() {
        $.ajax({
            url: '/chats/chat-rooms',
            method: 'GET',
            success: (response) => {
                if (response.success) {
                    this.displayChatList(response.data);
                } else {
                    console.error('Failed to load chats:', response);
                }
            },
            error: (xhr) => {
                console.error('Error loading chats:', xhr.responseJSON || xhr.responseText);
            }
        });
    }

    displayChatList(chats) {
        const chatList = $('#chatList');
        chatList.empty();

        chats.forEach(chat => {
            const chatItem = this.createChatItem(chat);
            chatList.append(chatItem);
        });
    }

    createChatItem(chat) {
        const isGroup = chat.isGroup;
        const participants = chat.participants;
        const otherParticipants = participants.filter(p => p._id !== this.getCurrentUserId());

        let chatName, avatarUrl;
        if (isGroup) {
            chatName = chat.name || 'Group Chat';
            avatarUrl = '/images/group-avatar.png';
        } else {
            const otherUser = otherParticipants[0];
            chatName = `${otherUser.firstName} ${otherUser.lastName}`;
            avatarUrl = otherUser.avatarUrl || '/images/default-avatar.png';
        }

        const lastMessage = chat.lastMessage ? chat.lastMessage.content : 'No messages yet';
        const unreadCount = chat.unreadCount || 0;

        return `
            <div class="chat-item" data-chat-id="${chat._id}" onclick="chatManager.selectChat('${chat._id}')">
                <div class="d-flex align-items-center">
                    <img src="${avatarUrl}" alt="Avatar" class="avatar me-3">
                    <div class="flex-grow-1">
                        <div class="d-flex justify-content-between align-items-center">
                            <h6 class="mb-0">${chatName}</h6>
                            ${unreadCount > 0 ? `<span class="unread-badge">${unreadCount}</span>` : ''}
                        </div>
                        <small class="text-muted">${lastMessage}</small>
                    </div>
                </div>
            </div>
        `;
    }

    selectChat(chatId) {
        this.currentChatId = chatId;
        console.log('on select chat', chatId)
        // Update active state
        $('.chat-item').removeClass('active');
        $(`.chat-item[data-chat-id="${chatId}"]`).addClass('active');

        // Load chat details and messages
        this.loadChatDetails(chatId);
        this.loadMessages(chatId);

        // Join room via Socket.IO
        this.socket.emit('joinRoom', chatId);

        // Show message input
        $('#messageInput').show();
    }

    loadChatDetails(chatId) {
        $.ajax({
            url: `/chats/${chatId}`,
            method: 'GET',
            success: (response) => {
                if (response.success) {
                    this.displayChatDetails(response.data);
                }
            }
        });
    }

    displayChatDetails(chat) {
        const isGroup = chat.isGroup;
        const participants = chat.participants;
        const otherParticipants = participants.filter(p => p._id !== this.getCurrentUserId());

        let chatName, status;
        if (isGroup) {
            chatName = chat.name || 'Group Chat';
            status = `${participants.length} participants`;
        } else {
            const otherUser = otherParticipants[0];
            chatName = `${otherUser.firstName} ${otherUser.lastName}`;
            status = otherUser.isOnline ? 'online' : 'last seen recently';
        }
        console.log('on display chat details', chatName, status)        
        $('#currentChatName').html(`<i class="bi bi-chat"></i> ${chatName}`);
        $('#currentChatStatus').html(`<small>${status}</small>`);
    }

    loadMessages(chatId) {
        $.ajax({
            url: `/chats/${chatId}/messages`,
            method: 'GET',
            success: (response) => {
                if (response.success) {
                    this.displayMessages(response.data);
                }
            }
        });
    }

    displayMessages(messages) {
        const container = $('#messageContainer');
        container.empty();

        messages.forEach(message => {
            const messageElement = this.createMessageElement(message);
            container.append(messageElement);
        });

        // Scroll to bottom
        container.scrollTop(container[0].scrollHeight);
    }

    createMessageElement(message) {
        const isOutgoing = message.sender._id === this.getCurrentUserId();
        const messageClass = isOutgoing ? 'outgoing' : 'incoming';

        let content = `<div class="message-content">${message.content}</div>`;

        if (message.mediaUrl) {
            if (message.messageType === 'image') {
                content += `<img src="${message.mediaUrl}" class="media-preview" alt="Image">`;
            } else if (message.messageType === 'video') {
                content += `<video src="${message.mediaUrl}" class="media-preview" controls></video>`;
            } else if (message.messageType === 'audio') {
                content += `<audio src="${message.mediaUrl}" controls></audio>`;
            } else {
                content += `<div class="file-preview">
                    <i class="bi bi-file-earmark"></i> ${message.fileName || 'File'}
                </div>`;
            }
        }

        return `
            <div class="message ${messageClass}" data-message-id="${message._id}">
                ${content}
                <small class="text-muted">${new Date(message.createdAt).toLocaleTimeString()}</small>
            </div>
        `;
    }

    sendMessage() {
        const content = $('#messageText').val().trim();
        if (!content || !this.currentChatId) return;

        const messageData = {
            roomId: this.currentChatId,
            content: content,
            messageType: 'text'
        };

        $.ajax({
            url: '/chats/message/send',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(messageData),
            success: (response) => {
                if (response.success) {
                    $('#messageText').val('');
                    // Message will be added via Socket.IO
                }
            }
        });
    }

    handleNewMessage(message) {
        if (message.roomId === this.currentChatId) {
            const messageElement = this.createMessageElement(message);
            $('#messageContainer').append(messageElement);
            $('#messageContainer').scrollTop($('#messageContainer')[0].scrollHeight);
        }
        // Update chat list to show new message
        this.loadChatList();
    }

    handleTyping() {
        if (this.typingTimeout) {
            clearTimeout(this.typingTimeout);
        }

        this.socket.emit('typing', this.currentChatId);

        this.typingTimeout = setTimeout(() => {
            this.socket.emit('stopTyping', this.currentChatId);
        }, 1000);
    }

    showTypingIndicator(data) {
        if (data.roomId === this.currentChatId) {
            $('#typingIndicator').text(`${data.username} is typing...`).show();
        }
    }

    hideTypingIndicator() {
        $('#typingIndicator').hide();
    }

    uploadFile(file) {
        const formData = new FormData();
        formData.append('file', file);

        $.ajax({
            url: '/upload/message-media',
            method: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            success: (response) => {
                if (response.success) {
                    const messageData = {
                        roomId: this.currentChatId,
                        content: response.data.fileName,
                        messageType: response.data.messageType,
                        mediaUrl: response.data.mediaUrl,
                        fileName: response.data.fileName,
                        fileSize: response.data.fileSize
                    };

                    $.ajax({
                        url: '/chats/message/send',
                        method: 'POST',
                        contentType: 'application/json',
                        data: JSON.stringify(messageData)
                    });
                }
            }
        });
    }

    loadUsers() {
        $.ajax({
            url: '/chats/users',
            method: 'GET',
            success: (response) => {
                if (response.success) {
                    this.displayUsers(response.data);
                } else {
                    console.error('Failed to load users:', response);
                }
            },
            error: (xhr) => {
                console.error('Error loading users:', xhr.responseJSON || xhr.responseText);
            }
        });
    }

    displayUsers(users) {
        const userList = $('#userList');
        userList.empty();

        users.forEach(user => {
            const userItem = `
                <div class="user-item d-flex align-items-center p-2 border-bottom" onclick="chatManager.createChat('${user.id}')">
                    <img src="${user.avatarUrl || '/images/default-avatar.png'}" alt="Avatar" class="avatar me-3">
                    <div>
                        <div class="username">${user.username}</div>
                        <small class="text-muted">${user.firstName} ${user.lastName}</small>
                    </div>
                </div>
            `;
            userList.append(userItem);
        });
    }

    filterUsers(searchTerm) {
        const term = searchTerm.toLowerCase();
        $('#userList .user-item').each(function() {
            const username = $(this).find('.username').text().toLowerCase();
            if (username.includes(term)) {
                $(this).show();
            } else {
                $(this).hide();
            }
        });
    }

    createChat(userId) {
        console.log('Creating chat with user:', userId);
        
        $.ajax({
            url: '/chats/create',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ participantId: userId }),
            success: (response) => {
                console.log('Create chat response:', response);
                if (response.success) {
                    $('#newChatModal').modal('hide');
                    this.loadChatList();
                    this.selectChat(response.data._id);
                } else {
                    console.error('Failed to create chat:', response);
                }
            },
            error: (xhr) => {
                console.error('Error creating chat:', xhr.responseJSON || xhr.responseText);
                alert('Failed to create chat. Please try again.');
            }
        });
    }

    getCurrentUserId() {
        console.log('Current user ID:', window.currentUserId);
        return window.currentUserId;
    }

    getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
    }
}

// Initialize chat manager when document is ready
$(document).ready(function() {
    window.chatManager = new ChatManager();
}); 