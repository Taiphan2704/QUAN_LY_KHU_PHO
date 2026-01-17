// Chatbot Module
const Chatbot = {
    isOpen: false,
    messages: [],

    init() {
        this.createChatbotUI();
        this.setupEventListeners();
    },

    createChatbotUI() {
        // Create chatbot container
        const chatbotHTML = `
            <div id="chatbot-container" class="chatbot-container">
                <button id="chatbot-toggle" class="chatbot-toggle" title="Trợ lý AI">
                    <span class="chatbot-icon">🤖</span>
                    <span class="chatbot-close-icon">✕</span>
                </button>
                
                <div id="chatbot-popup" class="chatbot-popup">
                    <div class="chatbot-header">
                        <div class="chatbot-header-info">
                            <span class="chatbot-avatar">🤖</span>
                            <div>
                                <h4>Trợ lý AI</h4>
                                <span class="chatbot-status">Sẵn sàng hỗ trợ</span>
                            </div>
                        </div>
                        <div class="chatbot-header-actions">
                            <button id="chatbot-clear" class="chatbot-action-btn" title="Xóa lịch sử">🗑️</button>
                        </div>
                    </div>
                    
                    <div id="chatbot-messages" class="chatbot-messages">
                        <div class="chatbot-message bot">
                            <div class="message-content">
                                Xin chào! Tôi là trợ lý AI của Khu phố 25 - Long Trường. Tôi có thể giúp bạn về thủ tục hành chính, đăng ký hộ khẩu, hoặc hướng dẫn sử dụng hệ thống. Bạn cần hỗ trợ gì?
                            </div>
                        </div>
                    </div>
                    
                    <div class="chatbot-input-container">
                        <input type="text" id="chatbot-input" class="chatbot-input" 
                            placeholder="Nhập câu hỏi..." maxlength="500">
                        <button id="chatbot-send" class="chatbot-send-btn">
                            <span>➤</span>
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', chatbotHTML);
    },

    setupEventListeners() {
        const toggle = document.getElementById('chatbot-toggle');
        const popup = document.getElementById('chatbot-popup');
        const input = document.getElementById('chatbot-input');
        const sendBtn = document.getElementById('chatbot-send');
        const clearBtn = document.getElementById('chatbot-clear');
        const container = document.getElementById('chatbot-container');

        // Toggle chatbot
        toggle.addEventListener('click', () => {
            this.isOpen = !this.isOpen;
            container.classList.toggle('open', this.isOpen);
            if (this.isOpen) {
                input.focus();
            }
        });

        // Send message on button click
        sendBtn.addEventListener('click', () => this.sendMessage());

        // Send message on Enter
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendMessage();
            }
        });

        // Clear history
        clearBtn.addEventListener('click', () => this.clearHistory());
    },

    async sendMessage() {
        const input = document.getElementById('chatbot-input');
        const message = input.value.trim();

        if (!message) return;

        // Add user message to UI
        this.addMessage(message, 'user');
        input.value = '';

        // Show typing indicator
        this.showTyping();

        try {
            const response = await API.post('/ai/chat', { message });
            this.hideTyping();
            this.addMessage(response.message, 'bot');
        } catch (error) {
            this.hideTyping();
            this.addMessage('Xin lỗi, có lỗi xảy ra. Vui lòng thử lại sau.', 'bot', true);
            console.error('Chatbot error:', error);
        }
    },

    addMessage(text, sender, isError = false) {
        const messagesContainer = document.getElementById('chatbot-messages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `chatbot-message ${sender}${isError ? ' error' : ''}`;
        messageDiv.innerHTML = `<div class="message-content">${Utils.escapeHtml(text)}</div>`;
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    },

    showTyping() {
        const messagesContainer = document.getElementById('chatbot-messages');
        const typingDiv = document.createElement('div');
        typingDiv.id = 'chatbot-typing';
        typingDiv.className = 'chatbot-message bot typing';
        typingDiv.innerHTML = `
            <div class="message-content">
                <div class="typing-indicator">
                    <span></span><span></span><span></span>
                </div>
            </div>
        `;
        messagesContainer.appendChild(typingDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    },

    hideTyping() {
        const typing = document.getElementById('chatbot-typing');
        if (typing) {
            typing.remove();
        }
    },

    async clearHistory() {
        try {
            await API.delete('/ai/chat/history');
            const messagesContainer = document.getElementById('chatbot-messages');
            messagesContainer.innerHTML = `
                <div class="chatbot-message bot">
                    <div class="message-content">
                        Xin chào! Tôi là trợ lý AI của Khu phố 25 - Long Trường. Tôi có thể giúp bạn về thủ tục hành chính, đăng ký hộ khẩu, hoặc hướng dẫn sử dụng hệ thống. Bạn cần hỗ trợ gì?
                    </div>
                </div>
            `;
            Toast.success('Đã xóa lịch sử chat');
        } catch (error) {
            Toast.error('Không thể xóa lịch sử chat');
        }
    }
};

// Smart Search Module
const SmartSearch = {
    async search(query) {
        try {
            const response = await API.post('/ai/search', { query });
            return response;
        } catch (error) {
            console.error('Smart search error:', error);
            throw error;
        }
    },

    showResults(results, entity) {
        Modal.open({
            title: '🔍 Kết quả tìm kiếm AI',
            size: 'lg',
            body: this.renderResults(results, entity),
            footer: `<button class="btn btn-secondary" onclick="Modal.close()">Đóng</button>`
        });
    },

    renderResults(data, entity) {
        if (!data.results || data.results.length === 0) {
            return `
                <div class="empty-state" style="padding: 2rem; text-align: center;">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">🔍</div>
                    <h3>Không tìm thấy kết quả</h3>
                    <p>${data.message || 'Thử tìm kiếm với từ khóa khác'}</p>
                </div>
            `;
        }

        if (entity === 'household') {
            return `
                <p style="margin-bottom: 1rem; color: var(--text-secondary);">
                    Tìm thấy ${data.total} hộ dân
                </p>
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Mã hộ khẩu</th>
                            <th>Địa chỉ</th>
                            <th>Chủ hộ</th>
                            <th>Tình trạng</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.results.map(h => `
                            <tr>
                                <td><strong>${Utils.escapeHtml(h.household_code)}</strong></td>
                                <td>${Utils.escapeHtml(h.address)}</td>
                                <td>${Utils.escapeHtml(h.head_name) || '-'}</td>
                                <td>${this.getStatusBadge(h.household_status)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        } else {
            return `
                <p style="margin-bottom: 1rem; color: var(--text-secondary);">
                    Tìm thấy ${data.total} nhân khẩu
                </p>
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Họ tên</th>
                            <th>Tuổi</th>
                            <th>Giới tính</th>
                            <th>Nghề nghiệp</th>
                            <th>Địa chỉ</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.results.map(r => `
                            <tr>
                                <td>
                                    ${r.is_household_head ? '⭐ ' : ''}
                                    <strong>${Utils.escapeHtml(r.full_name)}</strong>
                                </td>
                                <td>${r.age || '-'}</td>
                                <td>${r.gender || '-'}</td>
                                <td>${Utils.escapeHtml(r.occupation) || '-'}</td>
                                <td>${Utils.escapeHtml(r.current_address || r.household_address) || '-'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        }
    },

    getStatusBadge(status) {
        const labels = {
            'normal': 'Hộ thường',
            'business': 'Hộ kinh doanh',
            'rental': 'Hộ cho thuê',
            'poor': 'Hộ nghèo',
            'near_poor': 'Hộ cận nghèo',
            'policy': 'GĐ chính sách'
        };
        return `<span class="badge badge-primary">${labels[status] || 'Hộ thường'}</span>`;
    }
};

// Smart Analytics Module
const SmartAnalytics = {
    async getAnalysis() {
        try {
            const response = await API.get('/ai/analyze');
            return response;
        } catch (error) {
            console.error('Analytics error:', error);
            throw error;
        }
    },

    renderInsights(analysis) {
        return `
            <div class="ai-insights">
                <div class="ai-insights-header">
                    <span>🤖</span>
                    <span>Phân tích AI</span>
                </div>
                <div class="ai-insights-content">
                    ${Utils.escapeHtml(analysis).replace(/\n/g, '<br>')}
                </div>
            </div>
        `;
    }
};

// Initialize chatbot when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Wait for app to be visible (user logged in)
    const checkApp = setInterval(() => {
        const app = document.getElementById('app');
        if (app && app.style.display !== 'none' && !document.getElementById('chatbot-container')) {
            clearInterval(checkApp);
            Chatbot.init();
        }
    }, 500);

    // Also check when auth state changes
    window.addEventListener('authStateChanged', () => {
        if (!document.getElementById('chatbot-container')) {
            Chatbot.init();
        }
    });
});
