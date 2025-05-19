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
                    console.warn(`Chat ${chatIdToOpen} from URL not found in list. Will try after chats load if not already.`);
                    // If chats haven't loaded yet, this might be called too early.
                    // The 'myChatsLoaded' event might also try to open it.
                }
            };
            // Attempt to open immediately if chat list might already be populated (e.g. from cache or quick load)
            if (chatListUl && chatListUl.children.length > 0 && chatListUl.children[0].tagName === 'LI') {
                tryOpenChatFromUrl(targetChatIdFromUrl);
            }
            // Always set up a listener for when chats are loaded, as the list might be empty initially.
            socket.once('myChatsLoaded', (chats) => { // Use once to avoid multiple bindings if re-identified
                // Small delay to ensure DOM updates from myChatsLoaded are processed
                setTimeout(() => tryOpenChatFromUrl(targetChatIdFromUrl), 100);
            });
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

    // +++ ADD THIS EVENT HANDLER +++
    socket.on('chatInitiated', (chatData) => {
        console.log('Chat initiated (or existing one focused):', chatData);
        addChatToList(chatData, true); // Додає або оновлює чат у списку та переміщує вгору

        let chatName;
        if (chatData.type === 'private') {
            const otherParticipant = chatData.participants.find(p => p.mysqlUserId !== window.chatAppData.currentUserId);
            chatName = (otherParticipant ? (`${otherParticipant.firstname || ''} ${otherParticipant.lastname || ''}`.trim() || 'Private Chat') : 'Private Chat');
            if (!chatName && otherParticipant) chatName = otherParticipant.email || 'Private Chat'; // Fallback if names are empty
        } else {
            chatName = chatData.name || 'Group Chat';
        }
        openChat(chatData._id, chatName, chatData.participants); // Відкриває чат
    });
    // +++ END OF ADDED EVENT HANDLER +++

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
        // Update status in chat list
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

        // Update status in currently open chat header
        if (currentOpenChatId && currentChatParticipants) {
            const participantInCurrentChat = currentChatParticipants.find(p => p.mysqlUserId === mysqlUserId);
            if (participantInCurrentChat) {
                participantInCurrentChat.status = status; // Update local cache
                const headerAvatars = chatMainHeader.querySelectorAll('.member-avatar-header');
                headerAvatars.forEach(avatar => {
                    // Assuming title is like "Firstname Lastname (status)"
                    if (avatar.title && avatar.title.toLowerCase().includes(`${participantInCurrentChat.firstname.toLowerCase()} ${participantInCurrentChat.lastname.toLowerCase()}`)) {
                        const dot = avatar.querySelector('.status-dot-small');
                        if (dot) dot.className = `status-dot-small ${getStatusIndicatorClass(status)}`;
                        avatar.title = `${participantInCurrentChat.firstname} ${participantInCurrentChat.lastname} (${status})`;
                    }
                });
            }
        }
        // Update status in message avatars
        document.querySelectorAll(`.message-avatar[data-user-id="${userId}"] .status-dot-message`).forEach(dot => {
            dot.className = `status-dot-message ${getStatusIndicatorClass(status)}`;
            dot.title = status;
        });
    });


    // +++ ADD THESE HANDLERS +++
    socket.on('messagesLoaded', ({ chatId, messages }) => {
        if (chatId !== currentOpenChatId) {
            console.log(`Messages loaded for chat ${chatId}, but current open chat is ${currentOpenChatId}. Ignoring.`);
            return;
        }

        if (chatMessagesDiv) {
            chatMessagesDiv.innerHTML = ''; // Clear previous messages
            if (messages && messages.length > 0) {
                console.log(`Loading ${messages.length} messages for chat ${chatId}`);
                messages.forEach(msg => {
                    if (!msg.senderId) {
                        console.warn("Message received without senderId, cannot determine if sender:", msg);
                        // Decide how to handle this - skip, or display with a generic "Unknown"
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
        if (msgData.chatId === currentOpenChatId) {
            if (!msgData.senderId) {
                console.warn("New message received without senderId:", msgData);
                return; // Or handle as an error message
            }
            const isSender = msgData.senderId.mysqlUserId === window.chatAppData.currentUserId;
            
            const noMessagesPlaceholder = chatMessagesDiv ? chatMessagesDiv.querySelector('.no-messages') : null;
            if (noMessagesPlaceholder) {
                noMessagesPlaceholder.remove();
            }

            displayMessage(msgData, isSender);
            scrollToBottom(chatMessagesDiv);
        } else {
            console.log(`New message for chat ${msgData.chatId}, but current open chat is ${currentOpenChatId}. Not displaying immediately.`);
            // Update chat list item with last message preview (if addChatToList handles this)
            // And trigger notification
        }
        // Potentially update the last message in the chat list for the specific chat
        const chatListItem = chatListUl.querySelector(`li[data-chat-id="${msgData.chatId}"]`);
        if (chatListItem) {
            const lastMsgSpan = chatListItem.querySelector('.chat-item-info span');
            if (lastMsgSpan) {
                lastMsgSpan.textContent = msgData.content.length > 25 ? msgData.content.substring(0, 25) + '...' : msgData.content;
            }
            // Move chat to top
            chatListUl.prepend(chatListItem);
        }

        handleNotification(msgData); // Assuming you have this function defined elsewhere
    });
    // +++ END OF ADDED HANDLERS +++


    // (Keep addChatToList, openChat, updateChatMainHeader, openAddMembersModal, getStatusIndicatorClass - ensure they use corrected modal element vars if needed)
    // For example, in openAddMembersModal:
    // studentSearchModalInput.value = ''; studentSearchModalInput.focus();

    // --- MODIFIED New Chat Modal Logic ---
    if (newChatBtn && studentSelectModal && closeStudentSelectModalBtn && studentsListForModalUl && studentSearchModalInput) {
        newChatBtn.addEventListener('click', () => {
            console.log("New Chat button clicked. Modal should open."); 
            
            if (!studentSelectModal) {
                console.error("CRITICAL: studentSelectModal is null right before trying to use it in newChatBtn listener!");
                return;
            }
            console.log("Debug: studentSelectModal is:", studentSelectModal);

            studentSelectModal.dataset.mode = 'newChat';
            console.log("Debug: Modal mode set to 'newChat'.");

            const modalTitle = studentSelectModal.querySelector('.modal-header h2');
            if (modalTitle) {
                modalTitle.textContent = 'Start a New Chat';
                console.log("Debug: Modal title set to 'Start a New Chat'.");
            } else {
                console.warn("Debug: Modal title element (.modal-header h2) not found.");
            }

            try {
                studentSelectModal.style.display = 'flex';
                console.log("Debug: Modal display style set to 'flex'. It should be visible now.");

                // Check computed style shortly after to confirm
                setTimeout(() => {
                    if (studentSelectModal) {
                        const styles = window.getComputedStyle(studentSelectModal);
                        console.log("Debug: Computed modal display style after 0ms timeout:", styles.display);
                        if (styles.display !== 'flex') {
                            console.warn("Debug: Modal display is NOT 'flex'. Current display is:", styles.display, ". Something might have overridden it or it failed to apply.");
                        }
                    } else {
                        console.error("Debug: studentSelectModal became null in setTimeout check.");
                    }
                }, 0);

            } catch (e) {
                console.error("Debug: Error setting modal display style:", e);
                return; // Stop if we can't even show the modal
            }

            if (allStudents.length === 0) {
                console.log("Debug: No cached students (allStudents is empty). Fetching new list...");
                fetchStudentsForNewChat((students) => {
                    console.log("Debug: Callback from fetchStudentsForNewChat received. Students count:", students ? students.length : 'null/undefined');
                    if (students && Array.isArray(students)) {
                        allStudents = students;
                        renderStudentListInModal(allStudents, 'newChat');
                    } else {
                        console.error("Debug: Students data from fetch is not an array or is null/undefined. Received:", students);
                        allStudents = []; // Reset to empty array
                        renderStudentListInModal(allStudents, 'newChat'); // Will show "No students available"
                    }
                });
            } else {
                console.log("Debug: Using cached students. Count:", allStudents.length);
                renderStudentListInModal(allStudents, 'newChat');
            }

            if (studentSearchModalInput) {
                studentSearchModalInput.value = '';
                // Defer focus slightly to ensure modal is rendered
                setTimeout(() => {
                    if (studentSelectModal.style.display === 'flex') { // Only focus if modal is intended to be visible
                         studentSearchModalInput.focus();
                         console.log("Debug: Search input cleared and focused.");
                    } else {
                        console.log("Debug: Search input cleared, but not focusing as modal is not displayed as flex.");
                    }
                }, 50);
            } else {
                console.warn("Debug: studentSearchModalInput not found, cannot clear or focus.");
            }
        });

        closeStudentSelectModalBtn.addEventListener('click', () => {
            studentSelectModal.style.display = 'none';
            console.log("Debug: Student select modal closed by close button.");
        });

        window.addEventListener('click', (e) => {
            if (e.target === studentSelectModal) {
                studentSelectModal.style.display = 'none';
                console.log("Debug: Student select modal closed by clicking outside.");
            }
        });
    } else {
        console.error("Crucial elements for new chat modal are missing. Check IDs: newChatBtn (addBtn), studentSelectModal, closeStudentModal, studentsListForModal, or studentSearchInputModal.");
        // Log which specific element is missing if some are found
        if (!newChatBtn) console.error("Debug: newChatBtn (addBtn) is missing.");
        if (!studentSelectModal) console.error("Debug: studentSelectModal is missing.");
        if (studentSelectModal && !closeStudentSelectModalBtn) console.error("Debug: closeStudentSelectModalBtn (closeStudentModal) is missing within studentSelectModal.");
        if (studentSelectModal && !studentsListForModalUl) console.error("Debug: studentsListForModalUl (studentsListForModal) is missing within studentSelectModal.");
        if (studentSelectModal && !studentSearchModalInput) console.error("Debug: studentSearchModalInput (studentSearchInputModal) is missing within studentSelectModal.");
    }

    // +++ ADD SEND MESSAGE LISTENER +++
    if (sendMessageBtn && messageInput) {
        sendMessageBtn.addEventListener('click', () => {
            const messageText = messageInput.value.trim();
            if (messageText && currentOpenChatId) {
                console.log(`Attempting to send message: "${messageText}" to chat ID: ${currentOpenChatId}`);
                socket.emit('sendMessage', {
                    chatId: currentOpenChatId,
                    content: messageText
                });
                messageInput.value = ''; // Clear input after sending
                messageInput.focus();
            } else {
                if (!currentOpenChatId) console.warn("Cannot send message: No chat is currently open (currentOpenChatId is null).");
                if (!messageText) console.warn("Cannot send message: Message text is empty.");
            }
        });

        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) { // Send on Enter, allow Shift+Enter for newline
                e.preventDefault(); 
                sendMessageBtn.click(); 
            }
        });
    } else {
        if (!sendMessageBtn) console.error("sendMessageBtn element not found. Message sending disabled.");
        if (!messageInput) console.error("messageInput element not found. Message sending disabled.");
    }
    // +++ END OF SEND MESSAGE LISTENER +++


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
        studentsListForModalUl.innerHTML = ''; // Clear previous list

        if (!Array.isArray(studentsToRender) || studentsToRender.length === 0) {
            console.log("Debug: No students to render or not an array. Displaying 'No students available'.");
            studentsListForModalUl.innerHTML = '<li class="student-item-none">No students available.</li>';
            return;
        }

        console.log("Debug: Rendering student list items...");
        studentsToRender.forEach((student, index) => {
            const li = document.createElement('li');
            li.className = 'student-item';
            li.dataset.studentMysqlId = student.id;

            const avatarInitial = `${student.firstname ? student.firstname.charAt(0) : ''}${student.lastname ? student.lastname.charAt(0) : ''}`.toUpperCase();
            li.innerHTML = `
                <div class="student-avatar">${avatarInitial || '??'}</div>
                <div class="student-info">
                    <div class="student-name">${student.firstname || 'N/A'} ${student.lastname || ''}</div>
                    <div class="student-details">ID: ${student.id} | Group: ${student.student_group || 'N/A'}</div>
                </div>
            `;

            li.addEventListener('click', () => {
                const selectedStudentMysqlId = li.dataset.studentMysqlId;
                console.log(`Debug: Student item clicked. MySQL ID: ${selectedStudentMysqlId}, Modal mode: ${studentSelectModal.dataset.mode}`);
                if (studentSelectModal.dataset.mode === 'newChat') {
                    socket.emit('initiateChat', { targetMysqlUserId: selectedStudentMysqlId });
                } else if (studentSelectModal.dataset.mode === 'addMembers') {
                    const chatId = studentSelectModal.dataset.chatId;
                    socket.emit('addMembersToChat', { chatId: chatId, newMemberMysqlUserIds: [selectedStudentMysqlId] });
                }
                studentSelectModal.style.display = 'none';
            });
            studentsListForModalUl.appendChild(li);
        });
        console.log("Debug: Finished rendering student list items.");
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
            // If it exists and we are not replacing, maybe just update last message and move to top
            const lastMsgSpan = existingLi.querySelector('.chat-item-info span');
            if (lastMsgSpan && chat.lastMessage) {
                 lastMsgSpan.textContent = chat.lastMessage.content.length > 25 ? chat.lastMessage.content.substring(0, 25) + '...' : chat.lastMessage.content;
            }
            chatListUl.prepend(existingLi); // Move to top
            return; // Don't re-add
        }


        const noChatsMsg = chatListUl.querySelector('.no-chats-message');
        if (noChatsMsg) {
            noChatsMsg.remove();
        }

        let chatName = 'Group Chat';
        let avatarIconClass = "fa-users"; // Default for group
        let firstParticipantForStatus = null; // For private chat status dot

        if (chat.type === 'private') {
            const otherParticipant = chat.participants.find(p => p.mysqlUserId !== window.chatAppData.currentUserId);
            if (otherParticipant) {
                chatName = `${otherParticipant.firstname || ''} ${otherParticipant.lastname || ''}`.trim() || 'Private Chat';
                avatarIconClass = "fa-user"; // Icon for private chat
                firstParticipantForStatus = otherParticipant;
            } else {
                // This case might happen if the chat participants don't include the other user somehow, or it's a chat with self (if allowed)
                chatName = "Private Chat"; // Fallback
                avatarIconClass = "fa-user-secret"; 
            }
        } else { // Group chat
            chatName = chat.name || 'Group Chat';
        }

        const lastMsgContent = chat.lastMessage ? (chat.lastMessage.content.length > 25 ? chat.lastMessage.content.substring(0, 25) + '...' : chat.lastMessage.content) : 'No messages yet';

        const listItem = document.createElement('li');
        listItem.classList.add('chat-item');
        listItem.dataset.chatId = chat._id;
        listItem.dataset.chatType = chat.type;
        // Store essential participant info for status updates and opening chat
        listItem.dataset.participants = JSON.stringify(chat.participants.map(p => ({ 
            _id: p._id, // Mongo ID
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
            // Reparse participants from dataset when opening to ensure fresh data if list item wasn't fully re-rendered
            const participantsFromData = JSON.parse(listItem.dataset.participants || "[]");
            openChat(chat._id, chatName, participantsFromData);
        });
        chatListUl.prepend(listItem); // Add new/updated chats to the top
    }

    function openChat(chatId, chatName, participants) {
        console.log(`Opening chat: ID=${chatId}, Name=${chatName}, Participants:`, participants);
        currentOpenChatId = chatId;
        currentChatParticipants = participants || []; // Ensure it's an array

        if (chatMessagesDiv) {
            chatMessagesDiv.innerHTML = '<div style="text-align:center; padding:20px; color:#888;">Loading messages...</div>'; // Placeholder
        } else {
            console.error("chatMessagesDiv is null. Cannot clear for new chat.");
        }
        if (chatTitleH3) {
            chatTitleH3.textContent = chatName;
        }
        if (chatInputContainer) {
            chatInputContainer.style.display = 'flex'; // Show input field
        } else {
            console.error("chatInputContainer is null. Cannot show.");
        }


        updateChatMainHeader(chatName, participants, chatId); // Pass chatId here

        socket.emit('joinChatRoom', chatId); // Tell server we are focusing on this chat
        socket.emit('loadMessagesForChat', chatId); // Request messages for this chat

        document.querySelectorAll('#chatList .chat-item').forEach(item => {
            item.classList.remove('active');
        });
        const currentChatListItem = chatListUl.querySelector(`li[data-chat-id="${chatId}"]`);
        if (currentChatListItem) {
            currentChatListItem.classList.add('active');
        }
    }

    function updateChatMainHeader(chatName, participants, chatId) { // Added chatId
        if (!chatMainHeader) {
            console.error("chatMainHeader is null. Cannot update.");
            return;
        }
        chatMainHeader.innerHTML = ''; // Clear previous header content

        const titleElement = document.createElement('h3');
        titleElement.className = 'chat-title';
        titleElement.id = 'chatTitle'; // Keep ID if CSS targets it
        titleElement.textContent = chatName;
        chatMainHeader.appendChild(titleElement);

        const membersContainer = document.createElement('div');
        membersContainer.className = 'chat-members-display';

        (participants || []).forEach(p => {
            if (p.mysqlUserId !== window.chatAppData.currentUserId) { // Don't show self in members list here
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

        if (chatType === 'group') { // Only show "Add Member" for group chats for now
            const addMemberBtn = document.createElement('button');
            addMemberBtn.className = 'add-member-btn-header';
            addMemberBtn.innerHTML = '<i class="fa-solid fa-user-plus"></i> Add Member';
            addMemberBtn.addEventListener('click', () => openAddMembersModal(chatId, currentChatParticipants));
            chatMainHeader.appendChild(addMemberBtn);
        }
    }

    function openAddMembersModal(chatId, currentParticipants) {
        if (!studentSelectModal || !studentsListForModalUl || !studentSearchModalInput || !closeStudentSelectModalBtn) {
            console.error("One or more modal elements for 'add members' are missing.");
            return;
        }
        console.log("Request to add members to chat:", chatId, "Current Participants:", currentParticipants);
        studentSelectModal.dataset.mode = 'addMembers';
        studentSelectModal.dataset.chatId = chatId;

        const modalTitle = studentSelectModal.querySelector('.modal-header h2');
        if (modalTitle) {
            modalTitle.textContent = 'Add Members to Chat';
        }

        const currentParticipantMysqlIds = (currentParticipants || []).map(p => p.mysqlUserId);
        console.log("Current participant MySQL IDs:", currentParticipantMysqlIds);


        const renderFilteredList = (searchTerm = '') => {
            const filteredStudents = allStudents.filter(student => {
                const isNotCurrentUser = student.id !== window.chatAppData.currentUserId;
                const isNotAlreadyParticipant = !currentParticipantMysqlIds.includes(student.id);
                const nameMatches = `${student.firstname} ${student.lastname}`.toLowerCase().includes(searchTerm.toLowerCase());
                return isNotCurrentUser && isNotAlreadyParticipant && nameMatches;
            });
            console.log("Filtered students for adding:", filteredStudents.length, "from total:", allStudents.length);
            renderStudentListInModal(filteredStudents, 'addMembers');
        };


        if (allStudents.length === 0) {
            fetchStudentsForNewChat((students) => { // Assuming this fetches ALL students excluding self
                if (students && Array.isArray(students)) {
                    allStudents = students; // Cache them
                    renderFilteredList();
                } else {
                    allStudents = [];
                    renderStudentListInModal([], 'addMembers'); // Show "No students" or error
                }
            });
        } else {
            renderFilteredList();
        }
        studentSelectModal.style.display = 'flex'; // Use flex as per your CSS for modals
        studentSearchModalInput.value = '';
        setTimeout(() => studentSearchModalInput.focus(), 50); // Delay focus slightly
    }


    function displayMessage(msgData, isSender) {
        if (!chatMessagesDiv) {
            console.error("CRITICAL: chatMessagesDiv is null in displayMessage. Cannot append message.");
            return;
        }
        if (!msgData || !msgData.senderId || !msgData.content) { // Added check for content
            console.error("displayMessage: msgData, msgData.senderId, or msgData.content is missing.", msgData);
            return;
        }

        // console.log("Displaying message:", JSON.stringify(msgData, null, 2), "Is sender:", isSender);

        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', isSender ? 'message-sent' : 'message-received');
        messageDiv.dataset.messageId = msgData._id; // Store MongoDB message ID

        const sender = msgData.senderId; // This should be the populated User object
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
        // Ensure sender._id is available and a string for data-user-id
        const senderMongoId = sender && sender._id ? sender._id.toString() : (sender ? 'unknown-mongo-id' : 'unknown-sender');
        
        const statusIndicatorClass = getStatusIndicatorClass(userStatus);
        let avatarHtml = '';

        const avatarClass = isSender ? 'message-avatar-sent' : 'message-avatar-received';
        // Ensure data-user-id is correctly set
        avatarHtml = `
            <div class="message-avatar ${avatarClass}" data-user-id="${senderMongoId}" title="${senderName} (${userStatus})">
                <span>${avatarInitial}</span>
                <span class="status-dot-message ${statusIndicatorClass}" title="${userStatus}"></span>
            </div>`;
        
        const time = msgData.timestamp ? new Date(msgData.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

        // Sanitize content before injecting as HTML if it could ever contain user-input HTML
        // For plain text to HTML (like newlines to <br>), this is okay.
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
            // console.log("Scrolled to bottom of:", element.id || element.className);
        } else {
            console.warn("Attempted to scroll a null element.");
        }
    }

    function getStatusIndicatorClass(status) {
        if (status === 'online') return 'status-online';
        if (status === 'away') return 'status-away'; // Assuming you have 'away'
        return 'status-offline'; // Default
    }

    function handleNotification(message) { // Basic example
        console.log("Handling notification for message:", message);
        const isChatPageActive = window.location.pathname.includes('messages/index'); // Adjust if URL changes
        
        // Don't show browser notification if user is on chat page AND viewing the specific chat
        if (isChatPageActive && !document.hidden && message.chatId === currentOpenChatId) {
            console.log("User is active in the current chat. No browser notification needed.");
            return; 
        }

        // Update unread badge (example)
        const badge = document.querySelector('.icon-button-badge'); // Assuming this is your notification badge
        if (badge) {
            let count = parseInt(badge.textContent || '0');
            if (isNaN(count)) count = 0;
            badge.textContent = count + 1;
            badge.style.display = 'flex'; // Make it visible
            badge.classList.add('show'); // If you use a class to show
        }

        // Add to notification dropdown (example)
        const notifyContent = document.querySelector('.notify-content'); // Your notification dropdown
        if (notifyContent) {
            const newItem = document.createElement('a');
            newItem.href = `/lab1/index.php?url=messages/index&chat=${message.chatId}`; // Link to the chat
            const senderName = message.senderId ? `${message.senderId.firstname} ${message.senderId.lastname}` : 'Someone';
            newItem.textContent = `New message from ${senderName}: ${message.content.substring(0, 20)}...`;
            newItem.classList.add('notification-item'); // Add a class for styling
            notifyContent.prepend(newItem); // Add to top of list
        }

        // Browser notification (if permission granted)
        if (Notification.permission === "granted") {
            const senderName = message.senderId ? `${message.senderId.firstname} ${message.senderId.lastname}` : 'New message';
            const notification = new Notification(senderName, {
                body: message.content,
                icon: '/lab1/public/images/favicon-96x96.png' // Optional: path to an icon
            });
            notification.onclick = () => {
                window.open(`/lab1/index.php?url=messages/index&chat=${message.chatId}`); // Open chat on click
            };
        } else if (Notification.permission !== "denied") {
            Notification.requestPermission().then(permission => {
                if (permission === "granted") {
                    // Call handleNotification again or directly create notification
                    const senderName = message.senderId ? `${message.senderId.firstname} ${message.senderId.lastname}` : 'New message';
                    const notification = new Notification(senderName, { body: message.content });
                    notification.onclick = () => {
                        window.open(`/lab1/index.php?url=messages/index&chat=${message.chatId}`);
                    };
                }
            });
        }
        
        // Bell animation
        const bellIcon = document.querySelector('#bellIcon');
        if (bellIcon) {
            bellIcon.classList.add('bell-animation');
            setTimeout(() => bellIcon.classList.remove('bell-animation'), 1000); // Duration of animation
        }
    }

}); // End of DOMContentLoaded