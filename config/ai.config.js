import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import Database from './database.js'; // Import Database để lấy Key của user
dotenv.config();

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// 1. System Prompt dành riêng cho CHATBOT (Đóng vai cán bộ)
const CHATBOT_SYSTEM_PROMPT = `Bạn là trợ lý AI của hệ thống Quản lý Khu phố 25 - Long Trường, TP.HCM.

Nhiệm vụ của bạn là hỗ trợ người dân và cán bộ về:
1. Thủ tục hành chính: Đăng ký thường trú, tạm trú, tạm vắng, khai sinh, khai tử, bảo hiểm y tế, đăng ký hộ kinh doanh.
2. Giải đáp quy định pháp luật về cư trú.
3. Hướng dẫn sử dụng phần mềm quản lý này.

QUY TẮC TRẢ LỜI QUAN TRỌNG:
- KHÔNG chào hỏi lại kiểu "Xin chào, tôi là AI..." ở mỗi câu trả lời. Đi thẳng vào vấn đề.
- Hiện tại Việt Nam đã bỏ Sổ hộ khẩu giấy và quản lý bằng dữ liệu điện tử.
- Khu vực này thuộc TP. Hồ Chí Minh (trước đây là Quận 9), hiện tại KHÔNG CÒN CẤP QUẬN.
- Khi người dùng hỏi về nơi làm thủ tục, hướng dẫn đến: "UBND Phường Long Trường" hoặc "Công an Phường Long Trường".
- TUYỆT ĐỐI KHÔNG nhắc đến "UBND Quận", "Công an Quận" hay "Quận 9" trong câu trả lời.
- Trả lời Ngắn gọn, súc tích, chia gạch đầu dòng rõ ràng.
- Về thủ tục: Nêu rõ hồ sơ cần chuẩn bị gồm những giấy tờ gì.
- Giọng điệu: Thân thiện, chuyên nghiệp, phục vụ nhân dân.
- Tuyệt đối KHÔNG dùng Markdown phức tạp (như ** đậm, # tiêu đề) vì giao diện chat hiện tại không hỗ trợ render Markdown, chỉ dùng text thường và xuống dòng.
- Dùng dấu gạch ngang (-) ở đầu dòng cho các danh sách liệt kê.
- Dùng dấu xuống dòng để tách các ý.
- Nếu không biết câu trả lời, hãy khuyên liên hệ Trưởng khu phố.`;

// 2. System Prompt dành cho TÌM KIẾM (Trả về JSON)
const SEARCH_SYSTEM_PROMPT = `Bạn là công cụ tìm kiếm dữ liệu dân cư.
Nhiệm vụ: Phân tích câu hỏi tiếng Việt và trả về JSON tiêu chí lọc.
Quy tắc: Chỉ trả về JSON thuần túy, không có Markdown, không có lời dẫn.

Cấu trúc JSON mong muốn:
- entity: "household" hoặc "resident"
- filters: object chứa các trường lọc (household_status, area, gender, age_min, age_max, occupation, address_contains...)

Ví dụ mẫu:
- "Tìm hộ nghèo tổ 1" -> {"entity":"household","filters":{"household_status":"poor","area":"Tổ 1"}}
- "Người trên 60 tuổi" -> {"entity":"resident","filters":{"age_min":60}}`;

// 3. System Prompt dành cho PHÂN TÍCH (Trả về Text báo cáo)
const ANALYTICS_SYSTEM_PROMPT = `Bạn là chuyên gia phân tích dữ liệu dân cư.
Nhiệm vụ: Dựa vào JSON số liệu được cung cấp, hãy viết một báo cáo ngắn gọn, sâu sắc.
Quy tắc:
- Chỉ ra các con số nổi bật (tăng/giảm, tỷ lệ cao/thấp).
- Đưa ra nhận xét thực tế về tình hình dân cư.
- Đưa ra 1-2 khuyến nghị quản lý.
- Không dùng Markdown, trình bày dạng văn bản chia đoạn dễ đọc.`;

// AI Helper class
class AIHelper {
    constructor() {
        this.chatSessions = new Map();
        // Fallback key từ biến môi trường (nếu user chưa cài đặt)
        this.defaultKey = process.env.GEMINI_API_KEY;
    }

    // Hàm lấy Model với Key động
    getModel(userId, modelName = 'gemini-2.5-flash', systemInstruction = null) {
        // 1. Lấy user từ DB
        const user = Database.getUserById(userId);
        
        // 2. Ưu tiên dùng Key riêng của User, nếu không có thì dùng Key mặc định của hệ thống
        const apiKey = (user && user.gemini_api_key) ? user.gemini_api_key : this.defaultKey;

        if (!apiKey) {
            throw new Error('Chưa cấu hình Gemini API Key. Vui lòng vào Cài đặt để nhập Key.');
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        
        const config = { model: modelName };
        if (systemInstruction) {
            config.systemInstruction = systemInstruction;
        }

        return genAI.getGenerativeModel(config);
    }

    // Chatbot - conversation with context
    async chat(userId, message) {
        try {
            // Lấy model với key của user đó
            const chatModel = this.getModel(userId, 'gemini-2.5-flash', CHATBOT_SYSTEM_PROMPT);

            if (!this.chatSessions.has(userId)) {
                const chat = chatModel.startChat({
                    history: [],
                    generationConfig: { maxOutputTokens: 1000, temperature: 0.7 },
                });
                this.chatSessions.set(userId, chat);
            }

            // Lưu ý: Nếu user đổi key giữa chừng, session cũ có thể lỗi -> cần try-catch để tạo mới
            let chat = this.chatSessions.get(userId);
            
            try {
                const result = await chat.sendMessage(message);
                return result.response.text();
            } catch (innerError) {
                // Nếu lỗi session (do đổi key hoặc hết hạn), tạo lại session mới
                console.warn('Chat session error, creating new session...', innerError);
                const newChat = chatModel.startChat({
                    history: [],
                    generationConfig: { maxOutputTokens: 1000, temperature: 0.7 },
                });
                this.chatSessions.set(userId, newChat);
                const result = await newChat.sendMessage(message);
                return result.response.text();
            }

        } catch (error) {
            console.error('AI Chat error:', error);
            this.chatSessions.delete(userId);
            if (error.message.includes('API Key')) return error.message;
            return 'Lỗi kết nối AI. Vui lòng kiểm tra API Key trong Cài đặt.';
        }
    }

    // Clear chat history for user
    clearChatHistory(userId) {
        this.chatSessions.delete(userId);
    }

    // Smart search - parse natural language to search filters
    async parseSearchQuery(query, userId) {
        try {
            // Dùng dataModel (không có tính cách chatbot) để đảm bảo trả về JSON chuẩn
            const model = this.getModel(userId, 'gemini-2.5-flash'); // Dùng model key user
            const prompt = `${SEARCH_SYSTEM_PROMPT}\n\nCâu hỏi: "${query}"`;
            
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = result.response.text().trim();

            // Lọc lấy phần JSON (đề phòng model trả về thừa text)
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            return jsonMatch ? JSON.parse(jsonMatch[0]) : null;
        } catch (error) {
            return null;
        }
    }

    // Smart analytics - analyze statistics data
    async analyzeData(statisticsData, userId) {
        try {
            const model = this.getModel(userId, 'gemini-2.5-flash');
            // Dùng dataModel
            const prompt = `${ANALYTICS_SYSTEM_PROMPT}\n\nDữ liệu thống kê:\n${JSON.stringify(statisticsData, null, 2)}`;

            const result = await model.generateContent(prompt);
            return result.response.text();
        } catch (error) {
            return 'Không thể phân tích dữ liệu.';
        }
    }

    // Smart suggestions
    async getSuggestions(field, partialValue, context = {}, userId) {
        try {
            const model = this.getModel(userId, 'gemini-2.5-flash');
            const prompt = `Gợi ý 5 giá trị ngắn gọn cho trường "${field}" (Việt Nam). Input: "${partialValue}". Trả về JSON Array string.`;
            const result = await this.dataModel.generateContent(prompt);
            const response = await result.response;
            const text = result.response.text().trim();
            const jsonMatch = text.match(/\[[\s\S]*\]/);
            return jsonMatch ? JSON.parse(jsonMatch[0]) : [];
        } catch (error) {
            return [];
        }
    }
}

export const aiHelper = new AIHelper();
export default aiHelper;