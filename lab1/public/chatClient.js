// public/js/chatClient.js
document.addEventListener('DOMContentLoaded', () => {
    if (typeof window.chatAppData === 'undefined' || !window.chatAppData.currentUserId) {
        console.log("User not logged in. Chat functionality disabled.");
        // ... (rest of the initial check)
        return;
    }

    const socket = io('http://localhost:4000');

    const chatListUl = document.getElementById('chatList');
    const chatMessagesDiv = document.getElementById('chatMessages');
    const messageInput = document.getElementById('messageInput');
    const sendMessageBtn = document.getElementById('sendMessageBtn');
    const newChatBtn = document.getElementById('addBtn');

    // Modal elements - define them carefully
    const studentSelectModal = document.getElementById('studentSelectModal');
    let studentsListForModalUl, studentSearchModalInput, closeStudentSelectModalBtn; // Use these consistently

    if (studentSelectModal) {
        studentsListForModalUl = studentSelectModal.querySelector('#studentsListForModal'); // Correct ID from PHP
        studentSearchModalInput = studentSelectModal.querySelector('#studentSearchInputModal'); // Correct ID from PHP
        closeStudentSelectModalBtn = studentSelectModal.querySelector('#closeStudentModal');
    } else {
        console.error("FATAL: studentSelectModal not found in the DOM!");
        // If the modal isn't found, much of the new chat/add member functionality will fail.
        // Ensure the modal HTML is present in messages/index.php with id="studentSelectModal"
    }

    const chatInputContainer = document.getElementById('chatInputContainer');
    const chatMainHeader = document.getElementById('chatMainHeader');
    const chatTitleH3 = document.getElementById('chatTitle');
    // const currentChatMembersDiv = document.getElementById('currentChatMembers'); // This ID was a placeholder, header is built dynamically

    let currentOpenChatId = null;
    let currentChatParticipants = [];
    let allStudents = [];
    let localUserMongoId = null;

    // --- Socket event handlers ('connect', 'disconnect', 'userIdentified', etc.) ---
    // (Keep your existing socket event handlers as they were, I'm omitting them here for brevity if unchanged from my previous correct version)
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
        if (targetChatIdFromUrl) {
            const tryOpenChatFromUrl = (chatIdToOpen) => {
                const chatListItem = chatListUl.querySelector(`li[data-chat-id="${chatIdToOpen}"]`);
                if (chatListItem) {
                    const chatName = chatListItem.querySelector('.chat-item-name').textContent || 'Chat';
                    const participants = chatListItem.dataset.participants ? JSON.parse(chatListItem.dataset.participants) : [];
                    openChat(chatIdToOpen, chatName, participants);
                } else {
                    console.warn(`Chat ${chatIdToOpen} from URL not found in list.`);
                }
            };
            if (chatListUl.children.length > 0 && chatListUl.children[0].tagName === 'LI') {
                tryOpenChatFromUrl(targetChatIdFromUrl);
            } else {
                socket.once('myChatsLoaded', () => {
                    setTimeout(() => tryOpenChatFromUrl(targetChatIdFromUrl), 100);
                });
            }
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
        chatListUl.innerHTML = '';
        if (chats && chats.length > 0) {
            chats.forEach(chat => addChatToList(chat));
        } else {
            chatListUl.innerHTML = '<li class="no-chats-message">No chats yet. Start a new one!</li>';
        }
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
            const participants = JSON.parse(chatItem.dataset.participants || '[]');
            const otherUser = participants.find(p => p.mysqlUserId === mysqlUserId);
            if (otherUser) {
                const statusDot = chatItem.querySelector('.chat-item-avatar .status-dot');
                if (statusDot) {
                    statusDot.className = `status-dot ${getStatusIndicatorClass(status)}`;
                    statusDot.title = status;
                }
            }
        });
        if (currentOpenChatId) {
            const participantInCurrentChat = currentChatParticipants.find(p => p.mysqlUserId === mysqlUserId);
            if (participantInCurrentChat) {
                participantInCurrentChat.status = status;
                const headerAvatars = chatMainHeader.querySelectorAll('.member-avatar-header');
                headerAvatars.forEach(avatar => {
                    if (avatar.title && avatar.title.includes(`${participantInCurrentChat.firstname} ${participantInCurrentChat.lastname}`)) {
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

    // (Keep addChatToList, openChat, updateChatMainHeader, openAddMembersModal, getStatusIndicatorClass - ensure they use corrected modal element vars if needed)
    // For example, in openAddMembersModal:
    // studentSearchModalInput.value = ''; studentSearchModalInput.focus();

    // --- MODIFIED New Chat Modal Logic ---
    if (newChatBtn && studentSelectModal && closeStudentSelectModalBtn && studentsListForModalUl && studentSearchModalInput) {
        newChatBtn.addEventListener('click', () => {
            console.log("New Chat button clicked. Modal should open.");
            studentSelectModal.dataset.mode = 'newChat';
            const modalTitle = studentSelectModal.querySelector('.modal-header h2');
            if (modalTitle) modalTitle.textContent = 'Start a New Chat';

            // Змінено на 'flex' для правильного центрування згідно з оновленим CSS
            studentSelectModal.style.display = 'flex';

            // ... (решта логіки завантаження студентів) ...
            if (allStudents.length === 0) {
                fetchStudentsForNewChat(() => {
                    renderStudentListInModal(allStudents.filter(s => s.id !== window.chatAppData.currentUserId), 'newChat');
                });
            } else {
                renderStudentListInModal(allStudents.filter(s => s.id !== window.chatAppData.currentUserId), 'newChat');
            }
            if (studentSearchModalInput) {
                studentSearchModalInput.value = '';
                studentSearchModalInput.focus();
            }
        });

        closeStudentSelectModalBtn.addEventListener('click', () => {
            studentSelectModal.style.display = 'none'; // Ховаємо назад
        });

        window.addEventListener('click', (e) => {
            if (e.target === studentSelectModal) {
                studentSelectModal.style.display = 'none'; // Ховаємо назад
            }
        });
    } else {
        console.error("Crucial elements for new chat modal are missing. Check IDs: newChatBtn (addBtn), studentSelectModal, closeStudentModal, studentsListForModal, or studentSearchInputModal.");
        // Log which specific element is missing if some are found
        if (!newChatBtn) console.error("newChatBtn (id='addBtn') not found.");
        if (!studentSelectModal) console.error("studentSelectModal not found.");
        if (studentSelectModal && !closeStudentSelectModalBtn) console.error("closeStudentModal in studentSelectModal not found.");
        if (studentSelectModal && !studentsListForModalUl) console.error("studentsListForModal in studentSelectModal not found.");
        if (studentSelectModal && !studentSearchModalInput) console.error("studentSearchInputModal in studentSelectModal not found.");
    }

    async function fetchStudentsForNewChat(callback) {
        try {
            const response = await fetch('/lab1/index.php?url=student/getStudentsAjax&all=true');
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();
            if (data.success && data.students) {
                allStudents = data.students;
                if (callback) callback();
            } else {
                console.error('Failed to load students for new chat.');
                if (studentsListForModalUl) studentsListForModalUl.innerHTML = '<li>Failed to load students.</li>';
            }
        } catch (error) {
            console.error("Error fetching students:", error);
            if (studentsListForModalUl) studentsListForModalUl.innerHTML = '<li>Error loading students.</li>';
        }
    }

    // MODIFIED: renderStudentListInModal (was renderStudentList)
    function renderStudentListInModal(studentsToRender, mode) {
        // studentsListForModalUl should already be defined from the top
        if (!studentsListForModalUl) {
            console.error("studentsListForModalUl (UL element in modal) is not defined. Cannot render student list.");
            return;
        }
        studentsListForModalUl.innerHTML = ''; // Clear previous list

        if (studentsToRender.length === 0) {
            studentsListForModalUl.innerHTML = '<li class="student-item-none">No students available.</li>';
            return;
        }

        studentsToRender.forEach(student => {
            const li = document.createElement('li');
            li.className = 'student-item';
            li.dataset.studentMysqlId = student.id;

            const initials = (student.firstname.charAt(0) + student.lastname.charAt(0)).toUpperCase();
            li.innerHTML = `
                <div class="student-avatar">${initials}</div>
                <div class="student-info">
                    <div class="student-name">${student.firstname} ${student.lastname}</div>
                    <div class="student-details">${student.student_group || 'N/A'}</div>
                </div>
            `;

            li.addEventListener('click', () => {
                if (studentSelectModal) studentSelectModal.style.display = 'none';
                const targetMysqlId = parseInt(student.id);
                const currentMode = studentSelectModal ? studentSelectModal.dataset.mode : mode; // Fallback to passed mode

                if (currentMode === 'newChat') {
                    socket.emit('initiateChat', { targetMysqlUserId: targetMysqlId });
                } else if (currentMode === 'addMembers') {
                    const chatIdForAdding = studentSelectModal ? studentSelectModal.dataset.chatId : null;
                    if (chatIdForAdding) {
                        socket.emit('addMembersToChat', {
                            chatId: chatIdForAdding,
                            newMemberMysqlUserIds: [targetMysqlId]
                        });
                    } else {
                        console.error("Chat ID for adding members is missing.");
                    }
                }
            });
            studentsListForModalUl.appendChild(li);
        });
    }

    // MODIFIED: Event listener for modal search input
    if (studentSearchModalInput) {
        let searchTimeoutModal;
        studentSearchModalInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeoutModal);
            searchTimeoutModal = setTimeout(() => {
                const searchTerm = e.target.value.toLowerCase().trim();
                const currentMode = studentSelectModal ? studentSelectModal.dataset.mode : 'newChat';
                let currentParticipantsMysqlIds = [];

                if (currentMode === 'addMembers' && currentOpenChatId) {
                    // Re-fetch current participants if necessary, or use stored 'currentChatParticipants'
                    currentParticipantsMysqlIds = currentChatParticipants.map(p => p.mysqlUserId);
                }

                const filteredStudents = allStudents.filter(student => {
                    const studentMysqlId = parseInt(student.id); // Ensure comparison with numbers
                    const isCurrentUser = studentMysqlId === window.chatAppData.currentUserId;
                    const isAlreadyMember = currentMode === 'addMembers' && currentParticipantsMysqlIds.includes(studentMysqlId);
                    const matchesSearch = `${student.firstname} ${student.lastname} ${student.student_group || ''}`.toLowerCase().includes(searchTerm);
                    return !isCurrentUser && !isAlreadyMember && matchesSearch;
                });
                renderStudentListInModal(filteredStudents, currentMode);
            }, 150);
        });
    } else {
        // This will also be caught by the console.error in the newChatBtn logic if studentSelectModal itself is the issue
        console.warn("studentSearchModalInput (for modal search) not found.");
    }

    // --- Other functions (displayMessage, handleNotification, etc.) ---
    // (Keep your existing functions like displayMessage, handleNotification, addChatToList, openChat, updateChatMainHeader, openAddMembersModal, getStatusIndicatorClass)
    // Ensure they are defined correctly and use the updated variable names for modal elements if they interact with them.
    // For example, openAddMembersModal should use 'studentsListForModalUl' and 'studentSearchModalInput'

    function addChatToList(chat, replace = false) {
        const existingLi = chatListUl.querySelector(`li[data-chat-id="${chat._id}"]`);
        if (replace && existingLi) {
            existingLi.remove();
        } else if (existingLi && !replace) {
            const lastMsgSpan = existingLi.querySelector('.chat-item-info span');
            if (chat.lastMessage && lastMsgSpan) {
                lastMsgSpan.textContent = chat.lastMessage.content.length > 20 ? chat.lastMessage.content.substring(0, 20) + '...' : chat.lastMessage.content;
            }
            // Also update status dot if needed here for private chats in list
            if (chat.type === 'private') {
                const otherParticipant = chat.participants.find(p => p.mysqlUserId !== window.chatAppData.currentUserId);
                if (otherParticipant) {
                    const statusDot = existingLi.querySelector('.chat-item-avatar .status-dot');
                    if (statusDot) {
                        statusDot.className = `status-dot ${getStatusIndicatorClass(otherParticipant.status)}`;
                        statusDot.title = otherParticipant.status;
                    }
                }
            }
            return;
        }

        const noChatsMsg = chatListUl.querySelector('.no-chats-message');
        if (noChatsMsg) noChatsMsg.remove();

        let chatName = 'Group Chat';
        let avatarIconClass = "fa-users";
        let firstParticipantForStatus;

        if (chat.type === 'private') {
            const otherParticipant = chat.participants.find(p => p.mysqlUserId !== window.chatAppData.currentUserId);
            if (otherParticipant) {
                chatName = `${otherParticipant.firstname} ${otherParticipant.lastname}`;
                avatarIconClass = "fa-user";
                firstParticipantForStatus = otherParticipant;
            } else {
                chatName = "Unknown Private Chat";
                avatarIconClass = "fa-question-circle";
            }
        } else {
            chatName = chat.name || 'Unnamed Group';
        }

        const lastMsgContent = chat.lastMessage ? (chat.lastMessage.content.length > 25 ? chat.lastMessage.content.substring(0, 25) + '...' : chat.lastMessage.content) : 'No messages yet';

        const listItem = document.createElement('li');
        listItem.classList.add('chat-item');
        listItem.dataset.chatId = chat._id;
        listItem.dataset.chatType = chat.type;
        listItem.dataset.participants = JSON.stringify(chat.participants.map(p => ({ mysqlUserId: p.mysqlUserId, firstname: p.firstname, lastname: p.lastname, status: p.status })));

        let statusDotHtml = '';
        if (chat.type === 'private' && firstParticipantForStatus) {
            statusDotHtml = `<span class="status-dot ${getStatusIndicatorClass(firstParticipantForStatus.status)}" title="${firstParticipantForStatus.status}"></span>`;
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
        listItem.addEventListener('click', () => openChat(chat._id, chatName, chat.participants));
        chatListUl.prepend(listItem);
    }

    function openChat(chatId, chatName, participants) {
        currentOpenChatId = chatId;
        currentChatParticipants = participants || [];
        if (chatMessagesDiv) chatMessagesDiv.innerHTML = '';
        if (chatTitleH3) chatTitleH3.textContent = chatName;
        if (chatInputContainer) chatInputContainer.style.display = 'flex';

        updateChatMainHeader(chatName, participants, chatId);

        socket.emit('joinChatRoom', chatId);
        socket.emit('loadMessagesForChat', chatId);

        document.querySelectorAll('#chatList .chat-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.chatId === chatId) item.classList.add('active');
        });
    }

    function updateChatMainHeader(chatName, participants, chatId) {
        if (!chatMainHeader) return;
        chatMainHeader.innerHTML = '';

        const titleElement = document.createElement('h3');
        titleElement.className = 'chat-title';
        titleElement.id = 'chatTitle'; // Re-assign id if needed, though direct reference is better
        titleElement.textContent = chatName;
        chatMainHeader.appendChild(titleElement);

        const membersContainer = document.createElement('div');
        membersContainer.className = 'chat-members-display';

        (participants || []).forEach(p => {
            const memberAvatar = document.createElement('div');
            memberAvatar.className = 'member-avatar-header';
            memberAvatar.title = `${p.firstname} ${p.lastname} (${p.status || 'offline'})`;
            memberAvatar.innerHTML = `${(p.firstname || '?').charAt(0)}${(p.lastname || '').charAt(0)}`;
            const statusIndicator = document.createElement('span');
            statusIndicator.className = `status-dot-small ${getStatusIndicatorClass(p.status)}`;
            memberAvatar.appendChild(statusIndicator);
            membersContainer.appendChild(memberAvatar);
        });
        chatMainHeader.appendChild(membersContainer);

        const chatItem = chatListUl.querySelector(`.chat-item[data-chat-id="${chatId}"]`);
        const chatType = chatItem ? chatItem.dataset.chatType : ((participants && participants.length > 2) ? 'group' : 'private'); // Infer type if not on chatItem

        if (chatType === 'group' || (chatType === 'private' && (participants || []).length < 10)) {
            const addMemberBtnHeader = document.createElement('button');
            addMemberBtnHeader.className = 'add-member-btn-header';
            addMemberBtnHeader.innerHTML = '<i class="fa-solid fa-user-plus"></i> Add';
            addMemberBtnHeader.title = 'Add members to this chat';
            addMemberBtnHeader.onclick = () => openAddMembersModal(chatId, participants || []);
            chatMainHeader.appendChild(addMemberBtnHeader);
        }
    }

    function openAddMembersModal(chatId, currentParticipants) {
        studentSelectModal.style.display = 'flex'; // Змінено на 'flex'

        if (!studentSelectModal || !studentSearchModalInput) {
            console.error("Modal for adding members not properly initialized.");
            return;
        }
        console.log("Request to add members to chat:", chatId);
        studentSelectModal.dataset.mode = 'addMembers';
        studentSelectModal.dataset.chatId = chatId;

        const modalTitle = studentSelectModal.querySelector('.modal-header h2');
        if (modalTitle) modalTitle.textContent = 'Add Members to Chat';

        const currentParticipantMysqlIds = (currentParticipants || []).map(p => p.mysqlUserId);

        const renderFilteredList = () => {
            renderStudentListInModal(
                allStudents.filter(s => {
                    const studentMysqlId = parseInt(s.id);
                    return studentMysqlId !== window.chatAppData.currentUserId && !currentParticipantMysqlIds.includes(studentMysqlId);
                }),
                'addMembers'
            );
        };

        if (allStudents.length === 0) {
            fetchStudentsForNewChat(renderFilteredList);
        } else {
            renderFilteredList();
        }
        studentSelectModal.style.display = 'block';
        studentSearchModalInput.value = '';
        studentSearchModalInput.focus();
    }


    function displayMessage(msgData, isSender) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', isSender ? 'message-sent' : 'message-received');

        const sender = msgData.senderId;
        const senderName = isSender ? 'Me' : `${sender.firstname || 'Unknown'} ${sender.lastname || ''}`;

        const avatarInitial = sender ? `${(sender.firstname || '?').charAt(0)}${(sender.lastname || '').charAt(0)}`.toUpperCase() : '??';
        const userStatus = sender ? sender.status : 'offline';

        let avatarHtml;
        // Use sender._id for data-user-id as sender is the populated User object from MongoDB
        const senderMongoId = sender ? sender._id : 'unknown';

        if (isSender) {
            avatarHtml = `
                <div class="message-avatar self-avatar" data-user-id="${senderMongoId}">
                    <img src="/lab1/public/images/user-icon.jpg" alt="Me">
                    <span class="status-dot-message ${getStatusIndicatorClass(userStatus)}" title="${userStatus}"></span>
                </div>`;
        } else {
            avatarHtml = `
                <div class="message-avatar other-avatar" data-user-id="${senderMongoId}" title="${senderName} (${userStatus})">
                    ${avatarInitial}
                    <span class="status-dot-message ${getStatusIndicatorClass(userStatus)}" title="${userStatus}"></span>
                </div>`;
        }

        const time = msgData.timestamp ? new Date(msgData.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

        messageDiv.innerHTML = `
            ${!isSender ? avatarHtml : ''}
            <div class="message-bubble">
                ${!isSender ? `<div class="message-sender">${senderName}</div>` : ''}
                <div class="message-content">${msgData.content}</div>
                <div class="message-time">${time}</div>
            </div>
            ${isSender ? avatarHtml : ''}
        `;
        if (chatMessagesDiv) chatMessagesDiv.appendChild(messageDiv);
    }

    function scrollToBottom(element) {
        if (element) element.scrollTop = element.scrollHeight;
    }

    function getStatusIndicatorClass(status) {
        if (status === 'online') return 'status-online';
        if (status === 'away') return 'status-away';
        return 'status-offline';
    }

    function handleNotification(message) {
        const isChatPageActive = window.location.pathname.includes('messages/index');
        if (isChatPageActive && !document.hidden && message.chatId === currentOpenChatId) {
            return;
        }

        const badge = document.querySelector('.icon-button-badge');
        if (badge) {
            const currentCount = parseInt(badge.textContent || '0');
            badge.textContent = currentCount + 1;
            badge.style.display = 'flex';
        }

        const notifyContent = document.querySelector('.notify-content');
        if (notifyContent) {
            const notificationItem = document.createElement('div');
            notificationItem.className = 'notification-item';
            notificationItem.innerHTML = `
                <div class="notification-message">
                    New message from ${message.senderId.firstname || 'User'}: ${message.content.substring(0, 30)}...
                </div>
            `;
            notificationItem.addEventListener('click', () => {
                window.location.href = `/lab1/index.php?url=messages/index&chat=${message.chatId}`;
            });
            notifyContent.insertBefore(notificationItem, notifyContent.firstChild);
        }

        const bellIcon = document.querySelector('#bellIcon');
        if (bellIcon) {
            bellIcon.classList.add('bell-animation');
            setTimeout(() => bellIcon.classList.remove('bell-animation'), 1000);
        }
    }

}); // End of DOMContentLoaded