// public/chatClient.js
document.addEventListener('DOMContentLoaded', () => {
    if (typeof window.chatAppData === 'undefined' || !window.chatAppData.currentUserId) {
        console.log("User not logged in. Chat functionality disabled.");
        return;
    }

    const initialUrlParams = new URLSearchParams(window.location.search);
    const isOnMessagesView = initialUrlParams.get('url') === 'messages/index';

    const bellIcon = document.getElementById('bellIcon');
    const badge = document.querySelector('.icon-button-badge');
    const notifyContentElement = document.querySelector('.notify-content');

    const NOTIFICATIONS_LS_KEY = 'chatNotifications';

    function createNotificationElement(message) {
        if (!message || !message.senderId || !message.content || !message.chatId) return null;

        const item = document.createElement('a');
        item.href = `/lab1/index.php?url=messages/index&chat=${message.chatId}`;
        item.classList.add('notification-item');
        item.dataset.messageId = message._id;
        item.dataset.chatId = message.chatId;

        const senderName = (message.senderId && message.senderId.firstname) ? `${message.senderId.firstname} ${message.senderId.lastname || ''}`.trim() : 'Someone';
        const shortContent = message.content.length > 50 ? message.content.substring(0, 47) + '...' : message.content;

        item.innerHTML = `
            
            <div>
                <strong><i class="fa-solid fa-comment-dots"></i>  ${senderName}</strong>
                <p>${shortContent}</p>
            </div>
        `;
        item.addEventListener('click', (e) => {
            removeNotificationFromStorage(message._id);
        });
        return item;
    }

    function addNotificationToStorage(newMessage) {
        if (!newMessage || !newMessage._id) return;

        const storedNotifications = localStorage.getItem(NOTIFICATIONS_LS_KEY);
        let notifications = [];
        if (storedNotifications) {
            try {
                notifications = JSON.parse(storedNotifications);
            } catch (e) {
                console.error("Error parsing stored notifications for adding:", e);
                notifications = [];
            }
        }
        if (!notifications.find(n => n._id === newMessage._id)) {
            notifications.unshift(newMessage);
        }
        localStorage.setItem(NOTIFICATIONS_LS_KEY, JSON.stringify(notifications));
    }

    function removeNotificationFromStorage(messageId) {
        const storedNotifications = localStorage.getItem(NOTIFICATIONS_LS_KEY);
        let notifications = [];
        if (storedNotifications) {
            try {
                notifications = JSON.parse(storedNotifications);
            } catch (e) { return; }
        }
        notifications = notifications.filter(n => n._id !== messageId);
        localStorage.setItem(NOTIFICATIONS_LS_KEY, JSON.stringify(notifications));
    }
    function clearAllNotificationsFromStorage() {
        localStorage.removeItem(NOTIFICATIONS_LS_KEY);
        if (notifyContentElement) {
            notifyContentElement.innerHTML = '<p class="no-notifications-placeholder">No new notifications.</p>';
        }
        updateNotificationBadgeCount();
        if (bellIcon) {
            bellIcon.classList.remove('bell-ringing');
        }
    }
    function loadAndRenderNotifications() {
        if (!notifyContentElement) return;
        const storedNotifications = localStorage.getItem(NOTIFICATIONS_LS_KEY);
        let notifications = [];
        if (storedNotifications) {
            try {
                notifications = JSON.parse(storedNotifications);
            } catch (e) {
                console.error("Error parsing stored notifications:", e);
                localStorage.removeItem(NOTIFICATIONS_LS_KEY);
            }
        }

        notifyContentElement.innerHTML = '';
        if (notifications.length === 0) {
            notifyContentElement.innerHTML = '<p class="no-notifications-placeholder">No new notifications.</p>';
        } else {
            notifications.forEach(msg => {
                const notificationItem = createNotificationElement(msg);
                if (notificationItem) {
                    notifyContentElement.appendChild(notificationItem);
                }
            });
        }
        updateNotificationBadgeCount();
        
        if (notifications.length > 0 && bellIcon) {
            bellIcon.classList.remove('bell-ringing'); 
            void bellIcon.offsetWidth; 
            bellIcon.classList.add('bell-ringing');
        } else if (bellIcon) {
            bellIcon.classList.remove('bell-ringing');
        }
    }
    loadAndRenderNotifications();
    if (isOnMessagesView) {
        console.log("Navigated to messages view. Clearing all notifications from storage and UI.");
        clearAllNotificationsFromStorage();
    }

    const socket = io('http://localhost:4000');

    const chatListUl = document.getElementById('chatList');
    const chatMessagesDiv = document.getElementById('chatMessages');
    const messageInput = document.getElementById('messageInput');
    const sendMessageBtn = document.getElementById('sendMessageBtn');
    const newChatBtn = document.getElementById('initiateNewChatBtn');

    const studentSelectModal = document.getElementById('studentSelectModal');
    let studentsListForModalUl, studentSearchModalInput, closeStudentSelectModalBtn;

    if (studentSelectModal) {
        studentsListForModalUl = studentSelectModal.querySelector('#studentsListForModal');
        studentSearchModalInput = studentSelectModal.querySelector('#studentSearchInputModal');
        closeStudentSelectModalBtn = studentSelectModal.querySelector('#closeStudentModal');
    } else {
        console.error("FATAL: studentSelectModal not found in the DOM!");
    }

    const chatInputContainer = document.getElementById('chatInputContainer');
    const chatMainHeader = document.getElementById('chatMainHeader');
    const chatTitleH3 = document.getElementById('chatTitle');

    const groupNameInputModal = document.getElementById('groupNameInputModal');
    const confirmStudentSelectionBtnModal = document.getElementById('confirmStudentSelectionBtnModal');

    let currentOpenChatId = null;
    let currentChatParticipants = [];
    let allStudents = [];
    let localUserMongoId = null;
    let selectedStudentsForModal = new Set();

    socket.on('connect', () => {
        console.log('Connected to chat server:', socket.id);
        socket.emit('identifyUser', {
            mysqlUserId: window.chatAppData.currentUserId,
            email: window.chatAppData.currentUserEmail,
            firstname: window.chatAppData.currentUserFirstname,
            lastname: window.chatAppData.currentUserLastname,
        });
    });

    socket.on('disconnect', () => {
        console.log('Disconnected from chat server');
    });

    socket.on('userIdentified', (data) => {
        console.log('User identified on server:', data);
        localUserMongoId = data.mongoUserId;
        socket.emit('loadMyChats');
        const urlParams = new URLSearchParams(window.location.search);
        const targetChatIdFromUrl = urlParams.get('chat');
        
        if (targetChatIdFromUrl && isOnMessagesView) {
            console.log(`Requesting to open chat from URL parameter: ${targetChatIdFromUrl} on messages view.`);
            socket.emit('requestOpenChat', { chatId: targetChatIdFromUrl });
        } else {
            if (targetChatIdFromUrl && !isOnMessagesView) {
            }
            loadAndRenderNotifications();
        }
    });

    socket.on('openThisChat', (chatData) => {
        if (chatData && chatData._id) {
            console.log("Server instructed to open chat:", chatData);
            
            const existingLi = chatListUl ? chatListUl.querySelector(`li[data-chat-id="${chatData._id}"]`) : null;
            if (!existingLi && chatListUl) {
                 console.log(`Chat item for ${chatData._id} not found in list, adding it.`);
                 addChatToList(chatData, false); 
            }
            let chatName;
            if (chatData.type === 'private') {
                const otherParticipant = chatData.participants.find(p => p._id.toString() !== localUserMongoId && p.mysqlUserId !== window.chatAppData.currentUserId);
                chatName = otherParticipant ? `${otherParticipant.firstname || ''} ${otherParticipant.lastname || ''}`.trim() : "Chat";
                if (!chatName && otherParticipant) chatName = otherParticipant.email || "Private Chat";
                if (!otherParticipant) { 
                     const self = chatData.participants.find(p => p._id.toString() === localUserMongoId);
                     chatName = self ? `${self.firstname || ''} ${self.lastname || ''}`.trim() : "My Notes";
                }
            } else {
                chatName = chatData.name || "Group Chat";
            }
            openChat(chatData._id, chatName, chatData.participants);

            if (window.history.replaceState) {
                const currentUrl = new URL(window.location.href);
                currentUrl.searchParams.delete('chat');
                window.history.replaceState({ path: currentUrl.href }, '', currentUrl.href);
            }
        } else {
            console.warn("Received 'openThisChat' but chatData is invalid or missing ID.", chatData);
        }
    });

    socket.on('error', (errorData) => {
        console.error('Server error:', errorData.message);
        alert(`Chat Error: ${errorData.message}`);
    });

    socket.on('info', (infoData) => {
        console.log('Server info:', infoData.message);
    });
    socket.on('myChatsLoaded', (chats) => {
        if (chatListUl) {
            chatListUl.innerHTML = '';
        } else {
            console.warn("chatListUl not found. Skipping chat list update.");
        }
        if (chats && chats.length > 0) {
            chats.forEach(chat => addChatToList(chat));
        } else {
            chatListUl.innerHTML = '<li class="no-chats-message">No chats yet. Start a new one!</li>';
        }
    });

    socket.on('chatInitiated', (chatData) => {
        console.log('Chat initiated (or existing one focused):', chatData);
        addChatToList(chatData, true);
        studentSelectModal.style.display = 'none';
        let chatName;
        if (chatData.type === 'private') {
            const otherParticipant = chatData.participants.find(p => p.mysqlUserId !== window.chatAppData.currentUserId);
            chatName = (otherParticipant ? (`${otherParticipant.firstname || ''} ${otherParticipant.lastname || ''}`.trim() || 'Private Chat') : 'Private Chat');
            if (!chatName && otherParticipant) chatName = otherParticipant.email || 'Private Chat';
        } else {
            chatName = chatData.name || 'Group Chat';
        }
        openChat(chatData._id, chatName, chatData.participants);
    });

    socket.on('newChatStarted', (chatData) => {
        console.log('New chat started by another user:', chatData);
        const existingLi = chatListUl.querySelector(`li[data-chat-id="${chatData._id}"]`);
        if (!existingLi) {
            addChatToList(chatData);
        }
    });

    socket.on('chatUpdated', (updatedChatData) => {
        console.log('Chat updated:', updatedChatData);
        addChatToList(updatedChatData, true);
        if (currentOpenChatId === updatedChatData._id) {
            const otherParticipant = updatedChatData.participants.find(p => p.mysqlUserId !== window.chatAppData.currentUserId && updatedChatData.type === 'private');
            const chatName = updatedChatData.type === 'group' ? updatedChatData.name : (otherParticipant ? `${otherParticipant.firstname} ${otherParticipant.lastname}` : 'Chat');
            openChat(updatedChatData._id, chatName, updatedChatData.participants);
        }
    });

    socket.on('userStatusChanged', ({ userId, mysqlUserId, status, lastSeen }) => {
        console.log(`Status changed: User ${mysqlUserId} (mongoId: ${userId}) is now ${status}`);
        document.querySelectorAll(`.chat-item[data-chat-type="private"]`).forEach(chatItem => {
            const participantsAttr = chatItem.dataset.participants;
            if (participantsAttr) {
                try {
                    const participants = JSON.parse(participantsAttr);
                    const otherUser = participants.find(p => p.mysqlUserId === mysqlUserId);
                    if (otherUser) {
                        const statusDot = chatItem.querySelector('.chat-item-avatar .status-dot');
                        if (statusDot) {
                            statusDot.className = `status-dot ${getStatusIndicatorClass(status)}`;
                            statusDot.title = status;
                        }
                    }
                } catch (e) {
                    console.error("Failed to parse participants for status update in chat list:", e, participantsAttr);
                }
            }
        });

        if (currentOpenChatId && currentChatParticipants) {
            const participantInCurrentChat = currentChatParticipants.find(p => p.mysqlUserId === mysqlUserId);
            if (participantInCurrentChat) {
                participantInCurrentChat.status = status;
                const headerAvatars = chatMainHeader.querySelectorAll('.member-avatar-header');
                headerAvatars.forEach(avatar => {
                    if (avatar.title && avatar.title.toLowerCase().includes(`${participantInCurrentChat.firstname.toLowerCase()} ${participantInCurrentChat.lastname.toLowerCase()}`)) {
                        const dot = avatar.querySelector('.status-dot-small');
                        if (dot) dot.className = `status-dot-small ${getStatusIndicatorClass(status)}`;
                        avatar.title = `${participantInCurrentChat.firstname} ${participantInCurrentChat.lastname} (${status})`;
                    }
                });
            }
        }
        document.querySelectorAll(`.message-avatar[data-user-id="${userId}"] .status-dot-message`).forEach(dot => {
            dot.className = `status-dot-message ${getStatusIndicatorClass(status)}`;
            dot.title = status;
        });
    });

    socket.on('messagesLoaded', ({ chatId, messages }) => {
        if (chatId !== currentOpenChatId) {
            console.log(`Messages loaded for chat ${chatId}, but current open chat is ${currentOpenChatId}. Ignoring.`);
            return;
        }
        if (chatMessagesDiv) {
            chatMessagesDiv.innerHTML = '';
            if (messages && messages.length > 0) {
                console.log(`Loading ${messages.length} messages for chat ${chatId}`);
                messages.forEach(msg => {
                    if (!msg.senderId) {
                        console.warn("Message received without senderId, cannot determine if sender:", msg);
                        return;
                    }
                    const isSender = msg.senderId.mysqlUserId === window.chatAppData.currentUserId;
                    displayMessage(msg, isSender);
                });
                scrollToBottom(chatMessagesDiv);
            } else {
                chatMessagesDiv.innerHTML = '<div class="no-messages" style="text-align: center; padding: 20px; color: #888;">No messages in this chat yet.</div>';
                console.log(`No messages to load for chat ${chatId}`);
            }
        } else {
            console.error("chatMessagesDiv is null, cannot display loaded messages.");
        }
    });
    socket.on('newMessage', (msgData) => {
        console.log("New message received from server:", msgData);

        if (!msgData.senderId) {
            console.warn("New message received without senderId:", msgData);
            return;
        }
        if (chatListUl) {
            const chatListItem = chatListUl.querySelector(`li[data-chat-id="${msgData.chatId}"]`);
            if (chatListItem) {
                const lastMsgSpan = chatListItem.querySelector('.chat-item-info span');
                if (lastMsgSpan) {
                    lastMsgSpan.textContent = msgData.content.length > 25 ? msgData.content.substring(0, 25) + '...' : msgData.content;
                }
                chatListUl.prepend(chatListItem);
            }
        }

        if (msgData.chatId === currentOpenChatId && isOnMessagesView) {
            const isSender = msgData.senderId.mysqlUserId === window.chatAppData.currentUserId;
            const noMessagesPlaceholder = chatMessagesDiv ? chatMessagesDiv.querySelector('.no-messages') : null;
            if (noMessagesPlaceholder) {
                noMessagesPlaceholder.remove();
            }
            displayMessage(msgData, isSender);
            scrollToBottom(chatMessagesDiv);
        } else {
            console.log(`New message for chat ${msgData.chatId}, but current open chat is ${currentOpenChatId} or not on messages view.`);
        }
    });

    socket.on('notification', (data) => {
        console.log("Client: Received 'notification' event:", JSON.stringify(data));
        const { chatId, message } = data;
        if (localUserMongoId && message.senderId && message.senderId._id && message.senderId._id.toString() === localUserMongoId) {
            console.log("Notification for self message. Suppressing.");
            return;
        }
        if (isOnMessagesView && currentOpenChatId === chatId) {
            console.log(`Notification for chat ${chatId} suppressed as it's the active chat on the messages view.`);
            return;
        }

        addNotificationToStorage(message);
        loadAndRenderNotifications(); 

        if (chatListUl) {
            const chatListItem = chatListUl.querySelector(`li[data-chat-id="${chatId}"]`);
            if (chatListItem) {
                if (!chatListItem.classList.contains('new-message-indicator')) {
                    chatListItem.classList.add('new-message-indicator');
                }
                // Update last message preview in chat list
                const lastMsgSpan = chatListItem.querySelector('.chat-item-info span');
                if (lastMsgSpan) {
                    lastMsgSpan.textContent = message.content.length > 25 ? message.content.substring(0, 25) + '...' : message.content;
                }
                 chatListUl.prepend(chatListItem); // Move to top
            } else {
                console.warn(`Notification for chat ${chatId}, but chat item not in list.`);
            }
        }
    });

    if (newChatBtn && studentSelectModal && closeStudentSelectModalBtn && studentsListForModalUl && studentSearchModalInput && groupNameInputModal && confirmStudentSelectionBtnModal) {
        newChatBtn.addEventListener('click', () => {
            console.log("New Chat button clicked.");
            studentSelectModal.dataset.mode = 'newChat';
            selectedStudentsForModal.clear(); // Clear previous selections
            if (groupNameInputModal) groupNameInputModal.value = '';
            if (groupNameInputModal) groupNameInputModal.style.display = 'none';
            if (studentSearchModalInput) studentSearchModalInput.value = '';

            const modalTitle = studentSelectModal.querySelector('.modal-header h2');
            if (modalTitle) modalTitle.textContent = 'Start a New Chat / Create Group';
            
            studentSelectModal.style.display = 'flex';
            setTimeout(() => studentSearchModalInput.focus(), 50);

            if (allStudents.length === 0) {
                fetchStudentsForNewChat((students) => {
                    allStudents = students.filter(s => s.id !== window.chatAppData.currentUserId); // Exclude self
                    renderStudentListInModal(allStudents, 'newChat');
                });
            } else {
                renderStudentListInModal(allStudents.filter(s => s.id !== window.chatAppData.currentUserId), 'newChat');
            }
        });

        closeStudentSelectModalBtn.addEventListener('click', () => {
            studentSelectModal.style.display = 'none';
        });

        confirmStudentSelectionBtnModal.addEventListener('click', () => {
            const mode = studentSelectModal.dataset.mode;
            const currentChatId = studentSelectModal.dataset.chatId;

            if (mode === 'newChat') {
                if (selectedStudentsForModal.size === 0) {
                    alert('Please select at least one student.');
                    return;
                }
                if (selectedStudentsForModal.size === 1) {
                    const targetMysqlUserId = selectedStudentsForModal.values().next().value;
                    socket.emit('initiateChat', { targetMysqlUserId });
                } else {
                    const groupName = groupNameInputModal.value.trim();
                    if (!groupName) {
                        alert('Please enter a name for the group.');
                        groupNameInputModal.focus();
                        return;
                    }
                    socket.emit('createGroupChat', { 
                        memberMysqlUserIds: Array.from(selectedStudentsForModal), 
                        groupName 
                    });
                }
            } else if (mode === 'addMembers' && currentChatId) {
                if (selectedStudentsForModal.size === 0) {
                    alert('Please select students to add.');
                    return;
                }
                socket.emit('addMembersToChat', {
                    chatId: currentChatId,
                    newMemberMysqlUserIds: Array.from(selectedStudentsForModal)
                });
            }
        });

        window.addEventListener('click', (e) => {
            if (e.target === studentSelectModal) {
                studentSelectModal.style.display = 'none';
                console.log("Debug: Student select modal closed by clicking outside.");
            }
        });
    } else {
        console.error("Crucial elements for new chat modal are missing. Check IDs: newChatBtn (initiateNewChatBtn), studentSelectModal, closeStudentModal, studentsListForModal, or studentSearchInputModal.");
        if (!newChatBtn) console.warn("Debug: newChatBtn (expected ID 'initiateNewChatBtn') is missing.");
        if (!studentSelectModal) console.warn("Debug: studentSelectModal is missing.");
        if (studentSelectModal && !closeStudentSelectModalBtn) console.warn("Debug: closeStudentSelectModalBtn (expected ID 'closeStudentModal') is missing within studentSelectModal.");
        if (studentSelectModal && !studentsListForModalUl) console.warn("Debug: studentsListForModalUl (expected ID 'studentsListForModal') is missing within studentSelectModal.");
        if (studentSelectModal && !studentSearchModalInput) console.warn("Debug: studentSearchModalInput (expected ID 'studentSearchInputModal') is missing within studentSelectModal.");
    }

    if (sendMessageBtn && messageInput) {
        sendMessageBtn.addEventListener('click', () => {
            const messageText = messageInput.value.trim();
            if (messageText && currentOpenChatId) {
                console.log(`Attempting to send message: "${messageText}" to chat ID: ${currentOpenChatId}`);
                socket.emit('sendMessage', {
                    chatId: currentOpenChatId,
                    content: messageText
                });
                messageInput.value = '';
                messageInput.focus();
            } else {
                if (!currentOpenChatId) console.warn("Cannot send message: No chat is currently open (currentOpenChatId is null).");
                if (!messageText) console.warn("Cannot send message: Message text is empty.");
            }
        });

        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessageBtn.click();
            }
        });
    } else {
        if (!sendMessageBtn) console.error("sendMessageBtn element not found. Message sending disabled.");
        if (!messageInput) console.error("messageInput element not found. Message sending disabled.");
    }

    async function fetchStudentsForNewChat(callback) {
        console.log("Debug: fetchStudentsForNewChat called.");
        try {
            const response = await fetch('/lab1/index.php?url=student/getStudentsAjax&all=true');
            console.log("Debug: fetchStudentsForNewChat - Response status:", response.status);
            if (!response.ok) {
                console.error(`Debug: Error fetching students - HTTP status: ${response.status} ${response.statusText}`);
                const errorText = await response.text();
                console.error("Debug: Error response body:", errorText);
                if (studentsListForModalUl) studentsListForModalUl.innerHTML = `<li class="student-item-none">Error loading students (HTTP ${response.status}).</li>`;
                callback([]);
                return;
            }
            const data = await response.json();
            console.log("Debug: fetchStudentsForNewChat - Response data:", data);
            if (data.success && data.students && Array.isArray(data.students)) {
                callback(data.students);
            } else {
                console.error("Debug: Failed to fetch students or data format incorrect. Success:", data.success, "Students:", data.students, "Message:", data.message);
                if (studentsListForModalUl) studentsListForModalUl.innerHTML = `<li class="student-item-none">${data.message || 'Could not load students list.'}</li>`;
                callback([]);
            }
        } catch (error) {
            console.error("Debug: Exception in fetchStudentsForNewChat:", error);
            if (studentsListForModalUl) studentsListForModalUl.innerHTML = '<li class="student-item-none">Network error or server issue fetching students.</li>';
            callback([]);
        }
    }

    function renderStudentListInModal(studentsToRender, mode) {
        console.log("Debug: renderStudentListInModal called. Mode:", mode, "Students to render count:", studentsToRender ? studentsToRender.length : 'null/undefined');
        if (!studentsListForModalUl) {
            console.error("Debug: studentsListForModalUl (UL element in modal) is not defined. Cannot render student list.");
            return;
        }
        studentsListForModalUl.innerHTML = '';

        if (!Array.isArray(studentsToRender) || studentsToRender.length === 0) {
            studentsListForModalUl.innerHTML = `<li class="student-item-none">No students available${mode === 'addMembers' ? ' to add' : ''}.</li>`;
            return;
        }

        studentsToRender.forEach((student) => {
            const li = document.createElement('li');
            li.className = 'student-item';
            li.dataset.studentMysqlId = student.id;
            if (selectedStudentsForModal.has(student.id.toString())) {
                li.classList.add('selected');
            }

            const avatarInitial = `${student.firstname ? student.firstname.charAt(0) : ''}${student.lastname ? student.lastname.charAt(0) : ''}`.toUpperCase();
            li.innerHTML = `
                <div class="student-avatar">${avatarInitial || '??'}</div>
                <div class="student-info">
                    <div class="student-name">${student.firstname || 'N/A'} ${student.lastname || ''}</div>
                    <div class="student-details">ID: ${student.id} | Group: ${student.student_group || 'N/A'}</div>
                </div>
            `;

            li.addEventListener('click', () => {
                const studentIdStr = student.id.toString();
                if (mode === 'newChat') {
                    if (selectedStudentsForModal.has(studentIdStr)) {
                        selectedStudentsForModal.delete(studentIdStr);
                        li.classList.remove('selected');
                    } else {
                        selectedStudentsForModal.add(studentIdStr);
                        li.classList.add('selected');
                    }
                    // Show/hide group name input based on selection count
                    if (groupNameInputModal) {
                        groupNameInputModal.style.display = selectedStudentsForModal.size > 1 ? 'block' : 'none';
                        if (selectedStudentsForModal.size <= 1) groupNameInputModal.value = '';
                    }
                } else if (mode === 'addMembers') {
                    if (selectedStudentsForModal.has(studentIdStr)) {
                        selectedStudentsForModal.delete(studentIdStr);
                        li.classList.remove('selected');
                    } else {
                        selectedStudentsForModal.add(studentIdStr);
                        li.classList.add('selected');
                    }
                }
            });
            studentsListForModalUl.appendChild(li);
        });
    }

    if (studentSearchModalInput) {
        let searchTimeoutModal;
        studentSearchModalInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeoutModal);
            searchTimeoutModal = setTimeout(() => {
                const searchTerm = e.target.value.toLowerCase().trim();
                const currentMode = studentSelectModal ? studentSelectModal.dataset.mode : 'newChat';
                let currentParticipantsMysqlIds = [];

                if (currentMode === 'addMembers' && currentOpenChatId) {
                    currentParticipantsMysqlIds = currentChatParticipants.map(p => p.mysqlUserId);
                }

                const filteredStudents = allStudents.filter(student => {
                    const studentMysqlId = parseInt(student.id);
                    const isCurrentUser = studentMysqlId === window.chatAppData.currentUserId;
                    const isAlreadyMember = currentMode === 'addMembers' && currentParticipantsMysqlIds.includes(studentMysqlId);
                    const matchesSearch = `${student.firstname} ${student.lastname} ${student.student_group || ''}`.toLowerCase().includes(searchTerm);
                    return !isCurrentUser && !isAlreadyMember && matchesSearch;
                });
                renderStudentListInModal(filteredStudents, currentMode);
            }, 150);
        });
    } else {
        console.warn("studentSearchModalInput (for modal search) not found.");
    }

    function addChatToList(chat, replace = false) {
        if (!chatListUl) {
            console.warn('addChatToList: chatListUl element not found. Skipping DOM update for chat:', chat ? chat._id : 'unknown chat');
            return;
        }
        
        const existingLi = chatListUl.querySelector(`li[data-chat-id="${chat._id}"]`);
        
        if (existingLi) { // If exists, remove to re-add at top, effectively updating it
            existingLi.remove();
        }

        const noChatsMsg = chatListUl.querySelector('.no-chats-message');
        if (noChatsMsg) {
            noChatsMsg.remove();
        }

        let chatName = 'Group Chat';
        let avatarIconClass = "fa-users";
        let firstParticipantForStatus = null;

        if (chat.type === 'private') {
            const otherParticipant = chat.participants.find(p => p.mysqlUserId !== window.chatAppData.currentUserId);
            if (otherParticipant) {
                chatName = `${otherParticipant.firstname || ''} ${otherParticipant.lastname || ''}`.trim() || 'Private Chat';
                if (!chatName && otherParticipant.email) chatName = otherParticipant.email;
                avatarIconClass = "fa-user";
                firstParticipantForStatus = otherParticipant;
            } else {
                const selfParticipant = chat.participants.find(p => p.mysqlUserId === window.chatAppData.currentUserId);
                if (selfParticipant && chat.participants.length === 1) {
                    chatName = "My Notes (Self)"; // Or similar
                } else {
                    chatName = "Private Chat";
                }
                avatarIconClass = "fa-user-secret";
            }
        } else {
            chatName = chat.name || 'Group Chat';
        }

        const lastMsgContent = chat.lastMessage ? (chat.lastMessage.content.length > 25 ? chat.lastMessage.content.substring(0, 25) + '...' : chat.lastMessage.content) : 'No messages yet';

        const listItem = document.createElement('li');
        listItem.classList.add('chat-item');
        if (chat._id === currentOpenChatId) { // ADDED: Check if this chat is the currently open one
            listItem.classList.add('active');
        }
        listItem.dataset.chatId = chat._id;
        listItem.dataset.chatType = chat.type;
        listItem.dataset.participants = JSON.stringify(chat.participants.map(p => ({
            _id: p._id,
            mysqlUserId: p.mysqlUserId,
            firstname: p.firstname,
            lastname: p.lastname,
            status: p.status
        })));

        let statusDotHtml = '';
        if (chat.type === 'private' && firstParticipantForStatus) {
            const statusClass = getStatusIndicatorClass(firstParticipantForStatus.status);
            statusDotHtml = `<span class="status-dot ${statusClass}" title="${firstParticipantForStatus.status || 'offline'}"></span>`;
        }

        listItem.innerHTML = `
            <div class="chat-item-avatar">
                <i class="fa-solid ${avatarIconClass}"></i>
                ${statusDotHtml}
            </div>
            <div class="chat-item-info">
                <div class="chat-item-name">${chatName}</div>
                <span>${lastMsgContent}</span>
            </div>
        `;
        listItem.addEventListener('click', () => {
            const participantsFromData = JSON.parse(listItem.dataset.participants || "[]");
            let nameForOpenChat = chatName;
            if (chat.type === 'private') {
                const otherP = chat.participants.find(p => p.mysqlUserId !== window.chatAppData.currentUserId);
                if (otherP) {
                    nameForOpenChat = `${otherP.firstname || ''} ${otherP.lastname || ''}`.trim() || otherP.email || 'Private Chat';
                } else if (chat.participants.length === 1 && chat.participants[0].mysqlUserId === window.chatAppData.currentUserId) {
                    nameForOpenChat = "My Notes (Self)";
                }
            } else {
                nameForOpenChat = chat.name || 'Group Chat';
            }
            openChat(chat._id, nameForOpenChat, participantsFromData);
        });
        chatListUl.prepend(listItem);
    }

    function openChat(chatId, chatName, participants) {
        console.log(`Opening chat: ID=${chatId}, Name=${chatName}, Participants:`, participants);
        currentOpenChatId = chatId;
        currentChatParticipants = participants || [];

        if (chatMessagesDiv) {
            chatMessagesDiv.innerHTML = '<p class="no-messages">Loading messages...</p>';
        } else {
            console.error("chatMessagesDiv is null. Cannot display messages.");
        }
        
        if (chatInputContainer) {
            chatInputContainer.style.display = 'flex';
        } else {
            console.error("chatInputContainer is null. Cannot enable message input.");
        }

        updateChatMainHeader(chatName, participants, chatId);

        socket.emit('joinChatRoom', chatId); // Client joins the socket.io room
        socket.emit('loadMessagesForChat', chatId);

        if (chatListUl) {
            document.querySelectorAll('.chat-item.active').forEach(item => item.classList.remove('active'));
            const currentChatItem = chatListUl.querySelector(`li[data-chat-id="${chatId}"]`);
            if (currentChatItem) {
                currentChatItem.classList.add('active');
                currentChatItem.classList.remove('new-message-indicator');
            }
        }
        if (isOnMessagesView) {
            const storedNotifications = localStorage.getItem(NOTIFICATIONS_LS_KEY);
            let notifications = [];
            if (storedNotifications) {
                try {
                    notifications = JSON.parse(storedNotifications);
                } catch (e) { /* ignore */ }
            }
            const remainingNotifications = notifications.filter(n => n.chatId !== chatId);
            localStorage.setItem(NOTIFICATIONS_LS_KEY, JSON.stringify(remainingNotifications));
            loadAndRenderNotifications();
        }
    }

    function updateChatMainHeader(chatName, participants, chatId) {
        if (!chatMainHeader) {
            console.error("chatMainHeader is null. Cannot update.");
            return;
        }
        chatMainHeader.innerHTML = '';

        const titleElement = document.createElement('h3');
        titleElement.className = 'chat-title';
        titleElement.id = 'chatTitle';
        titleElement.textContent = chatName;
        chatMainHeader.appendChild(titleElement);

        const membersContainer = document.createElement('div');
        membersContainer.className = 'chat-members-display';

        (participants || []).forEach(p => {
            if (p.mysqlUserId !== window.chatAppData.currentUserId) {
                const avatar = document.createElement('div');
                avatar.className = 'member-avatar-header';
                const initials = `${(p.firstname || '?').charAt(0)}${(p.lastname || '?').charAt(0)}`.toUpperCase();
                avatar.textContent = initials;
                avatar.title = `${p.firstname || ''} ${p.lastname || ''} (${p.status || 'offline'})`;

                const statusDot = document.createElement('span');
                statusDot.className = `status-dot-small ${getStatusIndicatorClass(p.status)}`;
                avatar.appendChild(statusDot);

                membersContainer.appendChild(avatar);
            }
        });
        chatMainHeader.appendChild(membersContainer);

        const chatData = chatListUl.querySelector(`.chat-item[data-chat-id="${chatId}"]`);
        const chatType = chatData ? chatData.dataset.chatType : ((participants && participants.length > 2) ? 'group' : 'private');

        if (chatType === 'group') {
            const addMemberBtn = document.createElement('button');
            addMemberBtn.className = 'add-member-btn-header';
            addMemberBtn.innerHTML = '<i class="fa-solid fa-user-plus"></i> Add Member';
            addMemberBtn.addEventListener('click', () => openAddMembersModal(chatId, currentChatParticipants));
            chatMainHeader.appendChild(addMemberBtn);
        }
    }

    function openAddMembersModal(chatId, currentParticipants) {
        if (!studentSelectModal || !studentsListForModalUl || !studentSearchModalInput || !closeStudentSelectModalBtn || !confirmStudentSelectionBtnModal) {
            console.error("One or more modal elements for 'add members' are missing.");
            return;
        }
        console.log("Request to add members to chat:", chatId, "Current Participants:", currentParticipants);
        studentSelectModal.dataset.mode = 'addMembers';
        studentSelectModal.dataset.chatId = chatId;
        selectedStudentsForModal.clear(); // Clear previous selections
        if (groupNameInputModal) groupNameInputModal.style.display = 'none'; // Not needed for add members
        if (studentSearchModalInput) studentSearchModalInput.value = '';

        const modalTitle = studentSelectModal.querySelector('.modal-header h2');
        if (modalTitle) {
            modalTitle.textContent = 'Add Members to Chat';
        }

        const currentParticipantMysqlIds = (currentParticipants || []).map(p => p.mysqlUserId);
        console.log("Current participant MySQL IDs:", currentParticipantMysqlIds);

        const renderFilteredList = (searchTerm = '') => {
            const filteredStudents = allStudents.filter(student => {
                const isAlreadyMember = currentParticipantMysqlIds.includes(student.id);
                if (isAlreadyMember) return false; // Don't show current members
                const nameMatch = `${student.firstname} ${student.lastname}`.toLowerCase().includes(searchTerm.toLowerCase());
                const idMatch = student.id.toString().includes(searchTerm);
                return nameMatch || idMatch;
            });
            console.log("Filtered students for adding:", filteredStudents.length, "from total:", allStudents.length);
            renderStudentListInModal(filteredStudents, 'addMembers');
        };

        if (allStudents.length === 0) {
            fetchStudentsForNewChat((students) => {
                allStudents = students.filter(s => s.id !== window.chatAppData.currentUserId); // Exclude self
                renderFilteredList();
            });
        } else {
            renderFilteredList();
        }
        studentSelectModal.style.display = 'flex';
        studentSearchModalInput.value = '';
        setTimeout(() => studentSearchModalInput.focus(), 50);
    }

    function displayMessage(msgData, isSender) {
        if (!chatMessagesDiv) {
            console.error("CRITICAL: chatMessagesDiv is null in displayMessage. Cannot append message.");
            return;
        }
        if (!msgData || !msgData.senderId || !msgData.content) {
            console.error("displayMessage: msgData, msgData.senderId, or msgData.content is missing.", msgData);
            return;
        }

        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', isSender ? 'message-sent' : 'message-received');
        messageDiv.dataset.messageId = msgData._id;

        const sender = msgData.senderId;
        let senderName = 'Unknown User';

        if (isSender) {
            senderName = 'You';
        } else if (sender && sender.firstname) {
            senderName = `${sender.firstname || ''} ${sender.lastname || ''}`.trim();
            if (!senderName) senderName = sender.email || 'User';
        } else if (sender && sender.email) {
            senderName = sender.email;
        }

        const avatarInitial = sender ? `${(sender.firstname || '?').charAt(0)}${(sender.lastname || '?').charAt(0)}`.toUpperCase() : '??';
        const userStatus = sender ? (sender.status || 'offline') : 'offline';
        const senderMongoId = sender && sender._id ? sender._id.toString() : (sender ? 'unknown-mongo-id' : 'unknown-sender');

        const statusIndicatorClass = getStatusIndicatorClass(userStatus);
        let avatarHtml = '';

        const avatarClass = isSender ? 'message-avatar-sent' : 'message-avatar-received';
        avatarHtml = `
            <div class="message-avatar ${avatarClass}" data-user-id="${senderMongoId}" title="${senderName} (${userStatus})">
                <span>${avatarInitial}</span>
                <span class="status-dot-message ${statusIndicatorClass}" title="${userStatus}"></span>
            </div>`;

        const time = msgData.timestamp ? new Date(msgData.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

        const messageContentHtml = msgData.content.replace(/\n/g, '<br>');

        messageDiv.innerHTML = `
            ${!isSender ? avatarHtml : ''}
            <div class="message-bubble">
                ${!isSender ? `<div class="message-sender">${senderName}</div>` : ''}
                <div class="message-content">${messageContentHtml}</div>
                <div class="message-time">${time}</div>
            </div>
            ${isSender ? avatarHtml : ''}
        `;
        chatMessagesDiv.appendChild(messageDiv);
    }

    function scrollToBottom(element) {
        if (element) {
            element.scrollTop = element.scrollHeight;
        } else {
            console.warn("Attempted to scroll a null element.");
        }
    }

    function getStatusIndicatorClass(status) {
        if (status === 'online') return 'status-online';
        if (status === 'away') return 'status-away';
        return 'status-offline';
    }

    function updateNotificationBadgeCount() {
        if (!badge || !notifyContentElement) {
            return;
        }

        const storedNotifications = localStorage.getItem(NOTIFICATIONS_LS_KEY);
        let count = 0;
        if (storedNotifications) {
            try {
                const notifications = JSON.parse(storedNotifications);
                count = notifications.filter(n => !(isOnMessagesView && n.chatId === currentOpenChatId)).length;
            } catch (e) {
                count = 0;
            }
        }
        badge.textContent = count > 0 ? count : '';
        badge.classList.toggle('show', count > 0);

        const placeholder = notifyContentElement.querySelector('.no-notifications-placeholder');
        if (notifyContentElement.children.length === 0 || (notifyContentElement.children.length === 1 && placeholder)) {
            if (!placeholder) {
                notifyContentElement.innerHTML = '<p class="no-notifications-placeholder">No new notifications.</p>';
            }
        } else if (placeholder && notifyContentElement.children.length > 1) {
            placeholder.remove();
        }
    }
});