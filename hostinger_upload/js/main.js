// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Show page loading indicator
    const pageLoader = document.createElement('div');
    pageLoader.className = 'page-loader';
    pageLoader.innerHTML = '<div class="loader-spinner"></div>';
    document.body.appendChild(pageLoader);
    
    // Get DOM elements
    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input');
    const chatMessages = document.querySelector('.chat-messages');
    const sendButton = document.getElementById('send-button');
    const newChatBtn = document.querySelector('.new-chat-btn');
    const hideToggleBtn = document.querySelector('.hide-toggle-btn');
    const chatItems = document.querySelectorAll('.chat-item');
    const welcomeScreen = document.getElementById('welcome-screen');
    const promptButtons = document.querySelectorAll('.prompt-btn');
    const languageButtons = document.querySelectorAll('.lang-btn');
    const themeButton = document.querySelector('.theme-btn');
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const sidebar = document.querySelector('.sidebar');
    const feedbackBtn = document.getElementById('feedback-btn');
    const loginModal = document.getElementById('login-modal');
    const closeLoginModalBtn = document.querySelector('.close-login-modal');
    const sendFeedbackBtn = document.querySelector('.send-feedback-btn');
    const sidebarToggleBtn = document.querySelector('.sidebar-toggle-btn');
    const showSidebarBtn = document.querySelector('.show-sidebar-btn');
    
    let currentLanguage = 'ur'; // Default language is Urdu
    let isProcessing = false;
    let conversationHistory = [];
    let currentChatId = generateChatId();
    
    // Define API base URL - change this to your API service URL when deployed
    const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
        ? '' // Empty for local development
        : 'https://urduai-pk.onrender.com'; // Updated to the new Render.com deployment URL
    
    // For debugging - log the API URL
    console.log('API Base URL:', API_BASE_URL);
    
    // Remove page loader after everything is loaded
    window.addEventListener('load', function() {
        setTimeout(() => {
            pageLoader.classList.add('fade-out');
            setTimeout(() => {
                pageLoader.remove();
            }, 500);
        }, 500);
    });
    
    // Load saved theme preference
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark-mode');
        const icon = themeButton.querySelector('i');
        icon.classList.remove('fa-moon');
        icon.classList.add('fa-sun');
    }
    
    // Load saved language preference
    if (localStorage.getItem('language')) {
        currentLanguage = localStorage.getItem('language');
        updateLanguageUI();
    }
    
    // Load conversation history from localStorage
    loadConversationHistory();
    
    // Hide toggle functionality
    if (hideToggleBtn) {
        hideToggleBtn.addEventListener('click', function() {
            // Instead of hiding, just collapse the sidebar
            document.body.classList.toggle('sidebar-collapsed');
            
            // Save sidebar state to localStorage
            localStorage.setItem('sidebarCollapsed', document.body.classList.contains('sidebar-collapsed'));
        });
        
        // Check if sidebar was collapsed in previous session
        if (localStorage.getItem('sidebarCollapsed') === 'true') {
            document.body.classList.add('sidebar-collapsed');
        }
        
        // Remove any existing 'sidebar-hidden' class
        document.body.classList.remove('sidebar-hidden');
        localStorage.removeItem('sidebarHidden');
    }
    
    // Show sidebar button functionality - modify to just expand the sidebar
    if (showSidebarBtn) {
        showSidebarBtn.addEventListener('click', function() {
            // Expand the sidebar
            document.body.classList.remove('sidebar-collapsed');
            
            // Save state to localStorage
            localStorage.setItem('sidebarCollapsed', 'false');
        });
    }
    
    // Sidebar toggle functionality
    if (sidebarToggleBtn) {
        sidebarToggleBtn.addEventListener('click', function() {
            document.body.classList.toggle('sidebar-collapsed');
            // Save sidebar state to localStorage
            localStorage.setItem('sidebarCollapsed', document.body.classList.contains('sidebar-collapsed'));
        });
        
        // Check if sidebar was collapsed in previous session
        if (localStorage.getItem('sidebarCollapsed') === 'true') {
            document.body.classList.add('sidebar-collapsed');
        }
    }
    
    // Feedback button click
    if (feedbackBtn) {
        feedbackBtn.addEventListener('click', function() {
            if (loginModal) {
                loginModal.style.display = 'flex';
            }
        });
    }
    
    // Send feedback button click
    if (sendFeedbackBtn) {
        sendFeedbackBtn.addEventListener('click', function() {
            const feedbackText = document.querySelector('.feedback-form textarea').value.trim();
            if (feedbackText) {
                alert(currentLanguage === 'ur' ? 'آپ کی رائے کے لیے شکریہ!' : 'Thank you for your feedback!');
                document.querySelector('.feedback-form textarea').value = '';
                loginModal.style.display = 'none';
            } else {
                alert(currentLanguage === 'ur' ? 'براہ کرم اپنی رائے درج کریں' : 'Please enter your feedback');
            }
        });
    }
    
    // Close login modal
    if (closeLoginModalBtn) {
        closeLoginModalBtn.addEventListener('click', function() {
            if (loginModal) {
                loginModal.style.display = 'none';
            }
        });
    }
    
    // Close modal when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target === loginModal) {
            loginModal.style.display = 'none';
        }
    });
    
    // Ensure chat messages container is visible
    if (chatMessages) {
        chatMessages.style.display = 'block';
    }
    
    // Auto-resize textarea as user types
    chatInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
        
        // Reset height if empty
        if (this.value === '') {
            this.style.height = 'auto';
        }
    });
    
    // Handle form submission
    chatForm.addEventListener('submit', function(event) {
        event.preventDefault();
        handleSendMessage();
    });
    
    // Send button click
    sendButton.addEventListener('click', function() {
        handleSendMessage();
    });
    
    // Example prompt buttons
    promptButtons.forEach(button => {
        button.addEventListener('click', function() {
            chatInput.value = this.textContent;
            chatInput.style.height = 'auto';
            chatInput.style.height = (chatInput.scrollHeight) + 'px';
            handleSendMessage();
            
            // Hide welcome screen
            if (welcomeScreen) {
                welcomeScreen.style.display = 'none';
            }
        });
    });
    
    // Function to handle sending messages
    async function handleSendMessage() {
        if (isProcessing) {
            console.log('Already processing a message, please wait...');
            return;
        }
        
        const message = chatInput.value.trim();
        if (!message) {
            console.log('Message is empty, not sending');
            return;
        }
        
        console.log('Sending message:', message);
        
        // Hide welcome screen if visible
        if (welcomeScreen && welcomeScreen.style.display !== 'none') {
            welcomeScreen.style.display = 'none';
            console.log('Welcome screen hidden');
        }
        
        // Ensure chat messages container is visible
        if (chatMessages) {
            chatMessages.style.display = 'block';
            console.log('Chat messages container is now visible');
        }
        
        // Add user message
        addMessage(message, 'user');
        
        // Add to conversation history
        conversationHistory.push({ role: "user", content: message });
        console.log('Conversation history after adding user message:', JSON.stringify(conversationHistory));
        
        // Clear input
        chatInput.value = '';
        chatInput.style.height = 'auto';
        
        // Show AI is typing
        isProcessing = true;
        showTypingIndicator();
        console.log('Typing indicator shown');
        
        try {
            // Check for internet connection
            if (!navigator.onLine) {
                throw new Error('No internet connection');
            }
            
            // Set system message based on language
            const systemMessage = currentLanguage === 'ur' 
                ? "آپ ایک مددگار اور دوستانہ اے آئی اسسٹنٹ ہیں جو اردو میں بات کرتا ہے۔ آپ کا نام اُردو اے آئی ہے۔"
                : "You are a helpful and friendly AI assistant that speaks English. Your name is Urdu AI.";
            
            // Add system message to the beginning of the messages array
            const messagesWithSystem = [
                { role: "system", content: systemMessage },
                ...conversationHistory
            ];
            
            // Call your backend API
            const requestData = { 
                messages: messagesWithSystem,
                language: currentLanguage
            };
            
            console.log('Sending request to API:', JSON.stringify({
                messageCount: requestData.messages.length,
                language: requestData.language
            }));
            
            // Set up timeout for the fetch request
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
            
            // Get the current origin - this is critical for making the API call work correctly
            const origin = window.location.origin;
            console.log('Using origin for API call:', origin);
            
            const response = await fetch(`${origin}/api/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestData),
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                console.error('Server error response:', response);
                const errorData = await response.json().catch(e => ({ error: 'Unknown error' }));
                console.error('Error data:', errorData);
                
                throw new Error(errorData.error || `Server error: ${response.status} ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log('Received response from API:', data);
            
            // Remove typing indicator
            removeTypingIndicator();
            
            // Add AI response to the chat - support both response formats
            const aiMessage = data.message || data.reply || 'No response received';
            addMessage(aiMessage, 'ai');
            
            // Add to conversation history
            conversationHistory.push({ role: "assistant", content: aiMessage });
            console.log('Conversation history after adding AI response:', JSON.stringify({
                messageCount: conversationHistory.length
            }));
            
            // Save conversation to localStorage
            saveConversation();
            
        } catch (error) {
            console.error('Error sending message:', error);
            console.error('Error stack:', error.stack);
            removeTypingIndicator();
            
            // Show appropriate error message based on the error
            let errorMessage;
            if (error.name === 'AbortError') {
                errorMessage = currentLanguage === 'ur' ? 
                    'درخواست کا وقت ختم ہو گیا ہے۔ براہ کرم اپنا انٹرنیٹ کنکشن چیک کریں اور دوبارہ کوشش کریں۔' : 
                    'Request timed out. Please check your internet connection and try again.';
            } else if (!navigator.onLine || error.message === 'No internet connection') {
                errorMessage = currentLanguage === 'ur' ? 
                    'انٹرنیٹ کنکشن نہیں ہے۔ براہ کرم اپنا کنکشن چیک کریں اور دوبارہ کوشش کریں۔' : 
                    'No internet connection. Please check your connection and try again.';
            } else if (error.message.includes('API key')) {
                errorMessage = currentLanguage === 'ur' ? 
                    'اے پی آئی کی ترتیب میں مسئلہ ہے۔ براہ کرم منتظم سے رابطہ کریں۔' : 
                    'There is an issue with the API configuration. Please contact the administrator.';
            } else {
                errorMessage = currentLanguage === 'ur' ? 
                    'کچھ غلط ہو گیا ہے۔ براہ کرم دوبارہ کوشش کریں۔ خرابی: ' + error.message : 
                    'Something went wrong. Please try again. Error: ' + error.message;
            }
            
            addMessage(errorMessage, 'error');
        } finally {
            isProcessing = false;
        }
    }
    
    // Function to add a message to the chat
    function addMessage(message, sender, className = '') {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message ${className}`;
        
        let messageContent = '';
        if (sender === 'user') {
            messageContent = `
                <div class="message-content">
                    <p>${message}</p>
                </div>
                <div class="message-avatar">
                    <i class="fas fa-user"></i>
                </div>
            `;
        } else if (sender === 'ai') {
            messageContent = `
                <div class="message-avatar">
                    <i class="fas fa-robot"></i>
                </div>
                <div class="message-content">
                    <p>${message}</p>
                    <div class="message-actions">
                        <button class="copy-btn" title="${currentLanguage === 'ur' ? 'کاپی کریں' : 'Copy to clipboard'}">
                            <i class="fas fa-copy"></i>
                        </button>
                    </div>
                </div>
            `;
        } else if (sender === 'error') {
            messageContent = `
                <div class="message-avatar">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <div class="message-content error-content">
                    <p>${message}</p>
                </div>
            `;
        }
        
        messageDiv.innerHTML = messageContent;
        chatMessages.appendChild(messageDiv);
        
        // Add copy functionality
        const copyBtn = messageDiv.querySelector('.copy-btn');
        if (copyBtn) {
            copyBtn.addEventListener('click', function() {
                const textToCopy = messageDiv.querySelector('p').textContent;
                navigator.clipboard.writeText(textToCopy).then(() => {
                    // Show copied tooltip
                    const tooltip = document.createElement('span');
                    tooltip.className = 'copy-tooltip';
                    tooltip.textContent = currentLanguage === 'ur' ? 'کاپی ہو گیا' : 'Copied!';
                    this.appendChild(tooltip);
                    
                    // Remove tooltip after 2 seconds
                    setTimeout(() => {
                        tooltip.remove();
                    }, 2000);
                });
            });
        }
        
        // Scroll to the bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    // Function to show typing indicator
    function showTypingIndicator() {
        const typingDiv = document.createElement('div');
        typingDiv.classList.add('message', 'ai-message', 'typing-indicator-container');
        typingDiv.id = 'typing-indicator';
        
        const avatar = document.createElement('div');
        avatar.classList.add('avatar');
        
        // Use the same nice avatar style as AI messages
        avatar.innerHTML = `<div class="ai-avatar-custom">AI</div>`;
        avatar.style.backgroundColor = '#4a6da7';
        avatar.style.color = 'white';
        avatar.style.borderRadius = '50%';
        avatar.style.display = 'flex';
        avatar.style.alignItems = 'center';
        avatar.style.justifyContent = 'center';
        avatar.style.width = '32px';
        avatar.style.height = '32px';
        avatar.style.fontSize = '14px';
        avatar.style.fontWeight = 'bold';
        
        const typingIndicator = document.createElement('div');
        typingIndicator.classList.add('typing-indicator');
        
        for (let i = 0; i < 3; i++) {
            const dot = document.createElement('span');
            dot.classList.add('dot');
            typingIndicator.appendChild(dot);
        }
        
        typingDiv.appendChild(avatar);
        typingDiv.appendChild(typingIndicator);
        
        chatMessages.appendChild(typingDiv);
        
        scrollToBottom();
    }
    
    // Function to remove typing indicator
    function removeTypingIndicator() {
        const typingIndicator = document.getElementById('typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }
    
    // Function to scroll chat to bottom
    function scrollToBottom() {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    // New chat button
    newChatBtn.addEventListener('click', function() {
        // Clear chat messages
        while (chatMessages.children.length > 0) {
            chatMessages.removeChild(chatMessages.lastChild);
        }
        
        // Reset conversation history
        conversationHistory = [];
        
        // Show welcome screen
        if (welcomeScreen) {
            welcomeScreen.style.display = 'flex';
        }
        
        // Set the first chat item as active if chat items exist
        if (chatItems && chatItems.length > 0) {
            chatItems.forEach(i => i.classList.remove('active'));
            chatItems[0].classList.add('active');
        }
        
        // Close the sidebar on mobile
        if (window.innerWidth <= 768) {
            sidebar.classList.remove('active');
        }
    });
    
    // Language toggle
    languageButtons.forEach(button => {
        button.addEventListener('click', function() {
            languageButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            currentLanguage = this.textContent.trim() === 'English' ? 'en' : 'ur';
            
            // Update placeholder text based on language
            chatInput.placeholder = currentLanguage === 'ur' ? '...اپنا سوال پوچھیں' : 'Type your message...';
        });
    });
    
    // Theme toggle
    themeButton.addEventListener('click', function() {
        document.body.classList.toggle('dark-mode');
        
        // Update icon
        const icon = this.querySelector('i');
        if (document.body.classList.contains('dark-mode')) {
            icon.classList.remove('fa-moon');
            icon.classList.add('fa-sun');
            localStorage.setItem('theme', 'dark');
        } else {
            icon.classList.remove('fa-sun');
            icon.classList.add('fa-moon');
            localStorage.setItem('theme', 'light');
        }
    });
    
    // Mobile menu toggle
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', function() {
            sidebar.classList.toggle('active');
            // For mobile, we want to show the sidebar when the menu button is clicked
            document.body.classList.remove('sidebar-collapsed');
        });
    }
    
    // Chat history items
    chatItems.forEach(item => {
        item.addEventListener('click', function() {
            chatItems.forEach(i => i.classList.remove('active'));
            this.classList.add('active');
            
            // In a real app, you would load the selected chat history here
            
            // Close sidebar on mobile
            if (window.innerWidth <= 768) {
                sidebar.classList.remove('active');
            }
        });
    });
    
    // Newsletter form handling
    const newsletterForm = document.getElementById('newsletter-form');
    const nameInput = document.getElementById('name');
    const emailInput = document.getElementById('email');
    const submitButton = document.getElementById('submit-button');
    const formMessages = document.getElementById('form-messages');
    const successModal = document.getElementById('success-modal');
    const closeModalBtn = document.getElementById('close-modal');
    const modalOverlay = document.getElementById('modal-overlay');

    if (newsletterForm) {
        newsletterForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Validate inputs
            const name = nameInput.value.trim();
            const email = emailInput.value.trim();
            
            // Clear previous error messages
            formMessages.innerHTML = '';
            formMessages.classList.remove('error', 'success');
            
            // Validate email
            if (!email) {
                showError('براہ کرم ای میل درج کریں۔');
                emailInput.classList.add('error-input');
                return;
            }
            
            if (!isValidEmail(email)) {
                showError('براہ کرم درست ای میل درج کریں۔');
                emailInput.classList.add('error-input');
                return;
            }
            
            // Show loading state
            const originalButtonText = submitButton.textContent;
            submitButton.textContent = 'جاری ہے...';
            submitButton.disabled = true;
            
            try {
                // Send data to our server endpoint
                const response = await fetch(`${API_BASE_URL}/api/newsletter/subscribe`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        name: name,
                        email: email
                    })
                });
                
                const data = await response.json();
                
                // Reset loading state
                submitButton.textContent = originalButtonText;
                submitButton.disabled = false;
                
                if (!response.ok) {
                    // Handle specific error cases
                    if (response.status === 409) {
                        showError('یہ ای میل پہلے سے رجسٹرڈ ہے۔');
                    } else {
                        showError('سبسکرپشن میں مسئلہ ہے۔ براہ کرم دوبارہ کوشش کریں۔');
                    }
                    console.error('Subscription error:', data);
                    return;
                }
                
                // Show success message and reset form
                showSuccess('آپ کی سبسکرپشن کامیابی سے رجسٹر ہو گئی ہے۔');
                newsletterForm.reset();
                
                // Show success modal
                successModal.classList.add('active');
                modalOverlay.classList.add('active');
                
                // Auto close modal after 5 seconds
                setTimeout(() => {
                    successModal.classList.remove('active');
                    modalOverlay.classList.remove('active');
                }, 5000);
                
            } catch (error) {
                console.error('Error:', error);
                submitButton.textContent = originalButtonText;
                submitButton.disabled = false;
                showError('سبسکرپشن میں مسئلہ ہے۔ براہ کرم دوبارہ کوشش کریں۔');
            }
        });
        
        // Close modal when clicking the close button or outside the modal
        if (closeModalBtn) {
            closeModalBtn.addEventListener('click', () => {
                successModal.classList.remove('active');
                modalOverlay.classList.remove('active');
            });
        }
        
        if (modalOverlay) {
            modalOverlay.addEventListener('click', (e) => {
                if (e.target === modalOverlay) {
                    successModal.classList.remove('active');
                    modalOverlay.classList.remove('active');
                }
            });
        }
        
        // Remove error class on input
        nameInput.addEventListener('input', function() {
            this.classList.remove('error-input');
        });
        
        emailInput.addEventListener('input', function() {
            this.classList.remove('error-input');
        });
    }
    
    function isValidEmail(email) {
        const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(email.toLowerCase());
    }
    
    function showError(message) {
        formMessages.textContent = message;
        formMessages.classList.add('error');
        formMessages.classList.remove('success');
        
        // Fade out after 5 seconds
        setTimeout(() => {
            formMessages.classList.remove('error');
            formMessages.textContent = '';
        }, 5000);
    }
    
    function showSuccess(message) {
        formMessages.textContent = message;
        formMessages.classList.add('success');
        formMessages.classList.remove('error');
        
        // Fade out after 5 seconds
        setTimeout(() => {
            formMessages.classList.remove('success');
            formMessages.textContent = '';
        }, 5000);
    }
    
    // Function to generate a unique chat ID
    function generateChatId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    
    // Function to save conversation to localStorage
    function saveConversation() {
        const savedChats = JSON.parse(localStorage.getItem('chats') || '{}');
        savedChats[currentChatId] = {
            messages: conversationHistory,
            timestamp: Date.now(),
            language: currentLanguage
        };
        
        // Keep only the 10 most recent chats
        const chatIds = Object.keys(savedChats).sort((a, b) => 
            savedChats[b].timestamp - savedChats[a].timestamp
        );
        
        if (chatIds.length > 10) {
            const chatsToKeep = {};
            chatIds.slice(0, 10).forEach(id => {
                chatsToKeep[id] = savedChats[id];
            });
            localStorage.setItem('chats', JSON.stringify(chatsToKeep));
        } else {
            localStorage.setItem('chats', JSON.stringify(savedChats));
        }
        
        // Update chat history in sidebar
        updateChatHistorySidebar();
    }
    
    // Function to load conversation history
    function loadConversationHistory() {
        const savedChats = JSON.parse(localStorage.getItem('chats') || '{}');
        const chatIds = Object.keys(savedChats);
        
        if (chatIds.length > 0) {
            // Update chat history in sidebar
            updateChatHistorySidebar();
        }
    }
    
    // Function to update chat history in sidebar
    function updateChatHistorySidebar() {
        const savedChats = JSON.parse(localStorage.getItem('chats') || '{}');
        const chatIds = Object.keys(savedChats).sort((a, b) => 
            savedChats[b].timestamp - savedChats[a].timestamp
        );
        
        const chatList = document.querySelector('.chat-list');
        if (!chatList) return;
        
        // Clear existing chat items except the "New Chat" item
        const existingItems = chatList.querySelectorAll('.chat-item:not(:first-child)');
        existingItems.forEach(item => item.remove());
        
        // Add saved chats to the list
        chatIds.forEach(id => {
            const chat = savedChats[id];
            if (chat.messages.length > 0) {
                const firstUserMessage = chat.messages.find(msg => msg.role === 'user');
                const title = firstUserMessage ? 
                    (firstUserMessage.content.length > 25 ? 
                        firstUserMessage.content.substring(0, 25) + '...' : 
                        firstUserMessage.content) : 
                    'Chat';
                
                const chatItem = document.createElement('li');
                chatItem.className = 'chat-item';
                chatItem.dataset.chatId = id;
                if (id === currentChatId) {
                    chatItem.classList.add('active');
                }
                
                chatItem.innerHTML = `
                    <i class="fas fa-comment"></i>
                    <span>${title}</span>
                    <button class="delete-chat-btn" title="Delete Chat">
                        <i class="fas fa-trash"></i>
                    </button>
                `;
                
                chatItem.addEventListener('click', function() {
                    loadChat(id);
                });
                
                const deleteBtn = chatItem.querySelector('.delete-chat-btn');
                deleteBtn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    deleteChat(id);
                });
                
                chatList.appendChild(chatItem);
            }
        });
    }
    
    // Function to load a specific chat
    function loadChat(chatId) {
        const savedChats = JSON.parse(localStorage.getItem('chats') || '{}');
        if (savedChats[chatId]) {
            // Update active chat in sidebar
            document.querySelectorAll('.chat-item').forEach(item => {
                item.classList.remove('active');
                if (item.dataset.chatId === chatId) {
                    item.classList.add('active');
                }
            });
            
            // Set current chat ID
            currentChatId = chatId;
            
            // Load conversation history
            conversationHistory = savedChats[chatId].messages;
            currentLanguage = savedChats[chatId].language || 'ur';
            
            // Update language UI
            updateLanguageUI();
            
            // Clear chat messages
            chatMessages.innerHTML = '';
            
            // Hide welcome screen
            if (welcomeScreen) {
                welcomeScreen.style.display = 'none';
            }
            
            // Show chat messages
            chatMessages.style.display = 'block';
            
            // Add messages to chat
            conversationHistory.forEach(msg => {
                if (msg.role === 'user') {
                    addMessage(msg.content, 'user');
                } else if (msg.role === 'assistant') {
                    addMessage(msg.content, 'ai');
                }
            });
            
            // Scroll to bottom
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    }
    
    // Function to delete a chat
    function deleteChat(chatId) {
        const savedChats = JSON.parse(localStorage.getItem('chats') || '{}');
        if (savedChats[chatId]) {
            delete savedChats[chatId];
            localStorage.setItem('chats', JSON.stringify(savedChats));
            
            // Update chat history in sidebar
            updateChatHistorySidebar();
            
            // If current chat was deleted, start a new chat
            if (chatId === currentChatId) {
                startNewChat();
            }
        }
    }
    
    // Function to start a new chat
    function startNewChat() {
        // Generate new chat ID
        currentChatId = generateChatId();
        
        // Clear conversation history
        conversationHistory = [];
        
        // Clear chat messages
        chatMessages.innerHTML = '';
        
        // Show welcome screen
        if (welcomeScreen) {
            welcomeScreen.style.display = 'block';
        }
        
        // Update active chat in sidebar
        document.querySelectorAll('.chat-item').forEach(item => {
            item.classList.remove('active');
            if (!item.dataset.chatId) {
                item.classList.add('active');
            }
        });
    }
    
    // Function to update language UI
    function updateLanguageUI() {
        // Update language buttons
        languageButtons.forEach(btn => {
            btn.classList.remove('active');
            if ((btn.textContent === 'اردو' && currentLanguage === 'ur') || 
                (btn.textContent === 'English' && currentLanguage === 'en')) {
                btn.classList.add('active');
            }
        });
        
        // Update placeholder text
        chatInput.placeholder = currentLanguage === 'ur' ? '...اپنا سوال پوچھیں' : 'Type your message...';
        
        // Save language preference
        localStorage.setItem('language', currentLanguage);
    }
    
    // Add diagnostic tool functionality
    const testApiBtn = document.getElementById('test-api-btn');
    const testConfigBtn = document.getElementById('test-config-btn');
    const testFetchBtn = document.getElementById('test-fetch-btn');
    const diagnosticResult = document.getElementById('diagnostic-result');
    
    if (testApiBtn) {
        testApiBtn.addEventListener('click', async function() {
            diagnosticResult.textContent = 'Testing API connection...';
            
            try {
                const origin = window.location.origin;
                const response = await fetch(`${origin}/api/test`);
                
                if (!response.ok) {
                    throw new Error(`Server responded with status: ${response.status}`);
                }
                
                const data = await response.json();
                diagnosticResult.textContent = JSON.stringify(data, null, 2);
            } catch (error) {
                diagnosticResult.textContent = `Error testing API: ${error.message}`;
                console.error('API test error:', error);
            }
        });
    }
    
    if (testConfigBtn) {
        testConfigBtn.addEventListener('click', async function() {
            diagnosticResult.textContent = 'Testing configuration...';
            
            try {
                const origin = window.location.origin;
                const response = await fetch(`${origin}/api/config/test`);
                
                if (!response.ok) {
                    throw new Error(`Server responded with status: ${response.status}`);
                }
                
                const data = await response.json();
                diagnosticResult.textContent = JSON.stringify(data, null, 2);
            } catch (error) {
                diagnosticResult.textContent = `Error testing config: ${error.message}`;
                console.error('Config test error:', error);
            }
        });
    }
    
    if (testFetchBtn) {
        testFetchBtn.addEventListener('click', async function() {
            diagnosticResult.textContent = 'Testing direct fetch to OpenAI...';
            
            try {
                const origin = window.location.origin;
                const response = await fetch(`${origin}/api/direct-test`);
                
                if (!response.ok) {
                    throw new Error(`Server responded with status: ${response.status}`);
                }
                
                const data = await response.json();
                diagnosticResult.textContent = JSON.stringify(data, null, 2);
            } catch (error) {
                diagnosticResult.textContent = `Error testing direct fetch: ${error.message}`;
                console.error('Direct fetch test error:', error);
            }
        });
    }
}); 