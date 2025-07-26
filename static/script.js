// Chat functionality
const chatMessages = document.getElementById('chatMessages');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const typingIndicator = document.getElementById('typingIndicator');
const charCount = document.getElementById('charCount');

// API Configuration
const API_URL = 'http://127.0.0.1:5000/chat';

// Current category
let currentCategory = 'general';

// Initialize chat
document.addEventListener('DOMContentLoaded', function() {
    messageInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    
    // Character counter
    messageInput.addEventListener('input', function() {
        const count = this.value.length;
        charCount.textContent = `${count}/500`;
        
        if (count > 450) {
            charCount.style.color = 'var(--error-color)';
        } else if (count > 350) {
            charCount.style.color = 'var(--warning-color)';
        } else {
            charCount.style.color = 'var(--text-secondary)';
        }
        
        // Limit input
        if (count >= 500) {
            this.value = this.value.substring(0, 500);
        }
    });
    
    // Auto-focus input
    messageInput.focus();
    
    // Remove welcome message after a delay
    setTimeout(() => {
        const welcomeSection = document.querySelector('.welcome-section');
        if (welcomeSection) {
            welcomeSection.style.opacity = '0.7';
        }
    }, 5000);
});

// Send message function
async function sendMessage() {
    const message = messageInput.value.trim();
    // if (!message) return;

    messageInput.disabled = true;
    sendBtn.disabled = true;

    addMessage(message, 'user');
    messageInput.value = '';
    updateCharCount();
    showTypingIndicator();

    try {
        const formData = new FormData();
        formData.append('message', message);

        // Add file if selected
        const fileInput = document.getElementById('fileInput'); // <input type="file" id="fileInput">
        if (fileInput && fileInput.files.length > 0) {
            formData.append('file', fileInput.files[0]);
        }

        const response = await fetch('http://127.0.0.1:5000/chat', {
            method: 'POST',
            body: formData // No need to set headers for FormData
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        hideTypingIndicator();

        const botResponse = data.response || '⚠️ Empty response. Please try again.';
        addMessage(botResponse, 'bot');

    } catch (error) {
        console.error('Error calling API:', error);
        hideTypingIndicator();

        const errorMessage = error.message.includes('Failed to fetch')
            ? '❌ Unable to connect to the server at http://127.0.0.1:5000. Make sure it is running.'
            : `❌ Error: ${error.message}`;
        
        addMessage(errorMessage, 'bot', true);
    } finally {
        messageInput.disabled = false;
        sendBtn.disabled = false;
        messageInput.focus();
    }
}


// Add message to chat
function addMessage(text, sender, isError = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;
    
    if (isError) {
        messageDiv.classList.add('error-message');
    }
    
    const currentTime = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    
    if (sender === 'user') {
        messageDiv.innerHTML = `
            <div class="message-content">
                <div class="message-bubble">${escapeHtml(text)}</div>
                <div class="message-time">${currentTime}</div>
            </div>
            <div class="message-avatar">👤</div>
        `;
    } else {
        messageDiv.innerHTML = `
            <div class="message-avatar">🤖</div>
            <div class="message-content">
                <div class="message-bubble">${formatBotMessage(text)}</div>
                <div class="message-time">${currentTime}</div>
            </div>
        `;
    }
    
    chatMessages.insertBefore(messageDiv, typingIndicator);
    scrollToBottom();
}

// Format bot message (preserve line breaks and basic formatting)
function formatBotMessage(text) {
    // First escape HTML, then apply formatting
    let formattedText = escapeHtml(text)
        .replace(/\n/g, '<br>')
        .replace(/\r\n/g, '<br>')
        .replace(/\r/g, '<br>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`(.*?)`/g, '<code>$1</code>')
        .replace(/^#{1,6}\s(.+)$/gm, '<h4>$1</h4>')
        .replace(/^\d+\.\s(.+)$/gm, '<div class="list-item">$1</div>')
        .replace(/^[-•]\s(.+)$/gm, '<div class="list-item">• $1</div>');
    
    return formattedText;
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Quick message function
function sendQuickMessage(message) {
    messageInput.value = message;
    sendMessage();
}

// Set category function
function setCategory(category) {
    currentCategory = category;
    
    // Update active category button
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    event.target.classList.add('active');
    
    // Update placeholder based on category
    const placeholders = {
        general: 'Ask any question about Indian Law...',
        contract: 'Ask about contracts, agreements, terms...',
        property: 'Ask about property rights, registration, disputes...',
        criminal: 'Ask about criminal law, procedures, rights...',
        family: 'Ask about marriage, divorce, custody, inheritance...',
        corporate: 'Ask about company law, compliance, regulations...',
        labor: 'Ask about employment rights, labor laws...',
        tax: 'Ask about tax laws, filing, compliance...'
    };
    
    messageInput.placeholder = placeholders[category] || placeholders.general;
    
    // Add category context message
    const categoryNames = {
        general: 'General Law',
        contract: 'Contract Law',
        property: 'Property Law',
        criminal: 'Criminal Law',
        family: 'Family Law',
        corporate: 'Corporate Law',
        labor: 'Labor Law',
        tax: 'Tax Law'
    };
    
    addMessage(`I'm now focused on ${categoryNames[category]}. How can I help you with this area of Indian law?`, 'bot');
}

// Clear chat function
function clearChat() {
    if (confirm('Are you sure you want to clear the chat history?')) {
        // Remove all messages except welcome section and typing indicator
        const messages = chatMessages.querySelectorAll('.message');
        messages.forEach(message => message.remove());
        
        // Add a fresh start message
        setTimeout(() => {
            addMessage('Chat cleared. How can I assist you with Indian law today?', 'bot');
        }, 500);
    }
}

// Show typing indicator
function showTypingIndicator() {
    typingIndicator.style.display = 'flex';
    scrollToBottom();
}

// Hide typing indicator
function hideTypingIndicator() {
    typingIndicator.style.display = 'none';
}

// Update character count
function updateCharCount() {
    charCount.textContent = '0/500';
    charCount.style.color = 'var(--text-secondary)';
}

// Scroll to bottom
function scrollToBottom() {
    setTimeout(() => {
        const chatContainer = chatMessages;
        chatContainer.scrollTop = chatContainer.scrollHeight;
        
        // Ensure the last message is fully visible
        const lastMessage = chatContainer.lastElementChild;
        if (lastMessage && lastMessage.classList.contains('message')) {
            lastMessage.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'end',
                inline: 'nearest'
            });
        }
    }, 100);
}

// Enhanced interactive features
document.addEventListener('DOMContentLoaded', function() {
    // Add hover effects to messages
    chatMessages.addEventListener('mouseover', function(e) {
        if (e.target.closest('.message-bubble')) {
            e.target.closest('.message-bubble').style.transform = 'translateY(-1px)';
        }
    });
    
    chatMessages.addEventListener('mouseout', function(e) {
        if (e.target.closest('.message-bubble')) {
            e.target.closest('.message-bubble').style.transform = 'translateY(0)';
        }
    });
    
    // Add send button animation
    sendBtn.addEventListener('click', function() {
        this.style.transform = 'scale(0.95)';
        setTimeout(() => {
            this.style.transform = 'scale(1)';
        }, 150);
    });
    
    // Input focus effects
    messageInput.addEventListener('focus', function() {
        this.closest('.chat-input').style.borderColor = 'var(--primary-color)';
    });
    
    messageInput.addEventListener('blur', function() {
        this.closest('.chat-input').style.borderColor = 'var(--border-color)';
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        // Ctrl/Cmd + K to focus input
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            messageInput.focus();
        }
        
        // Escape to clear input
        if (e.key === 'Escape' && document.activeElement === messageInput) {
            messageInput.value = '';
            updateCharCount();
        }
    });
    
    // Auto-resize textarea behavior for input
    messageInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = Math.min(this.scrollHeight, 120) + 'px';
    });
});

// Add some sample legal questions based on category
const sampleQuestions = {
    general: [
        "What are the fundamental rights guaranteed by the Indian Constitution?",
        "How does the Indian legal system work?",
        "What is the difference between civil and criminal law in India?"
    ],
    contract: [
        "What makes a contract valid under Indian law?",
        "Can a verbal agreement be legally binding in India?",
        "What are the remedies for breach of contract?"
    ],
    property: [
        "How do I register property in India?",
        "What are the different types of property ownership?",
        "What is the process for property dispute resolution?"
    ],
    criminal: [
        "What are my rights if arrested in India?",
        "How do I file an FIR?",
        "What is the difference between bailable and non-bailable offenses?"
    ],
    family: [
        "What are the grounds for divorce under Hindu Marriage Act?",
        "How is child custody determined in India?",
        "What are the inheritance laws in India?"
    ],
    corporate: [
        "How do I register a company in India?",
        "What are the compliance requirements for companies?",
        "What is the difference between private and public companies?"
    ],
    labor: [
        "What are the basic rights of employees in India?",
        "How does the minimum wage law work?",
        "What is the process for filing a labor dispute?"
    ],
    tax: [
        "What are the different types of taxes in India?",
        "How do I file income tax returns?",
        "What are the penalties for tax evasion?"
    ]
};

// Function to get random sample questions
function getSampleQuestions(category) {
    return sampleQuestions[category] || sampleQuestions.general;
}

// Update suggestions based on category
function updateSuggestions(category) {
    const suggestionsGrid = document.querySelector('.suggestions-grid');
    const questions = getSampleQuestions(category);
    
    suggestionsGrid.innerHTML = questions.map(question => 
        `<button class="suggestion-btn" onclick="sendQuickMessage('${question}')">
            💡 ${question.substring(0, 50)}${question.length > 50 ? '...' : ''}
        </button>`
    ).join('');
}

// Initialize with default suggestions
document.addEventListener('DOMContentLoaded', function() {
    updateSuggestions('general');
});

// Export chat functionality
function exportChat() {
    const messages = Array.from(document.querySelectorAll('.message')).map(msg => {
        const isUser = msg.classList.contains('user-message');
        const text = msg.querySelector('.message-bubble').textContent;
        const time = msg.querySelector('.message-time').textContent;
        return `${isUser ? 'User' : 'AI'} (${time}): ${text}`;
    }).join('\n\n');
    
    const blob = new Blob([messages], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `indian-law-chat-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
}

// Add export functionality to export button
document.addEventListener('DOMContentLoaded', function() {
    const exportBtn = document.querySelector('[title="Export Chat"]');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportChat);
    }
});