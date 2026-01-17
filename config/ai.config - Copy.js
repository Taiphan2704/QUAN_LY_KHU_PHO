import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// System prompts
const CHATBOT_SYSTEM_PROMPT = `Bạn là trợ lý AI của hệ thống Quản lý Khu phố 25 - Long Trường, TP.HCM.

Nhiệm vụ của bạn:
1. Hỗ trợ người dân về thủ tục hành chính: đăng ký hộ khẩu, tạm trú, tạm vắng, khai sinh, khai tử
2. Giải đáp quy định về quản lý dân cư, hộ tịch
3. Hướng dẫn sử dụng hệ thống phần mềm
4. Cung cấp thông tin về các chính sách hỗ trợ hộ nghèo, cận nghèo, gia đình chính sách

Quy tắc trả lời:
- Trả lời ngắn gọn, dễ hiểu bằng tiếng Việt
- KHÔNG sử dụng Markdown (không dùng **, *, #, -, bullet points)
- Sử dụng dấu gạch ngang hoặc số thứ tự đơn giản nếu cần liệt kê
- Nếu không biết hoặc không chắc chắn, hãy khuyên người dùng liên hệ trực tiếp với cán bộ khu phố
- Luôn thân thiện và lịch sự`;

const SEARCH_SYSTEM_PROMPT = `Bạn là công cụ tìm kiếm thông minh cho hệ thống quản lý dân cư.

Nhiệm vụ: Phân tích câu hỏi tìm kiếm bằng tiếng Việt và trả về JSON với các tiêu chí tìm kiếm.

Ví dụ:
- "Tìm hộ nghèo ở Tổ 2" -> {"entity":"household","filters":{"household_status":"poor","area":"Tổ 2"}}
- "Ai trên 60 tuổi?" -> {"entity":"resident","filters":{"age_min":60}}
- "Chủ hộ đường số 1" -> {"entity":"resident","filters":{"is_household_head":true,"address_contains":"số 1"}}

Các entity: household, resident
Các filter cho household: household_status, household_type, area, address_contains
Các filter cho resident: gender, age_min, age_max, occupation, is_household_head, address_contains

Chỉ trả về JSON hợp lệ, không có text khác.`;

const ANALYTICS_SYSTEM_PROMPT = `Bạn là chuyên gia phân tích dữ liệu dân cư khu phố. Hãy phân tích DỮ LIỆU CỤ THỂ được cung cấp.

YÊU CẦU BẮT BUỘC:
1. Phân tích DỰA TRÊN SỐ LIỆU THỰC TẾ trong dữ liệu, không đưa ra nhận xét chung chung
2. Nêu CON SỐ CỤ THỂ (ví dụ: "Có 5 hộ nghèo chiếm 20%", không nói "có một số hộ nghèo")
3. So sánh các nhóm với nhau (ví dụ: "Nam nhiều hơn Nữ 10 người")
4. Chỉ ra ĐIỂM NỔI BẬT hoặc BẤT THƯỜNG trong dữ liệu
5. Đưa ra KHUYẾN NGHỊ CỤ THỂ dựa trên phân tích

CẤU TRÚC TRẢ LỜI:
1. TỔNG QUAN: Tóm tắt nhanh về quy mô (số hộ, số nhân khẩu)
2. PHÂN TÍCH CHI TIẾT: 
   - Cơ cấu độ tuổi: nhóm nào đông nhất, tỷ lệ người cao tuổi
   - Giới tính: tỷ lệ nam/nữ
   - Tình trạng hộ: hộ nghèo, cận nghèo, gia đình chính sách
   - Nghề nghiệp phổ biến
3. ĐIỂM CẦN LƯU Ý: Những vấn đề cần quan tâm
4. KHUYẾN NGHỊ: Hành động cụ thể cho cán bộ khu phố

QUY TẮC:
- Viết bằng tiếng Việt, rõ ràng
- KHÔNG dùng Markdown (không dùng **, *, #, -)
- Dùng số thứ tự đơn giản (1., 2., 3.) khi liệt kê
- Tập trung vào thông tin HỮU ÍCH cho quản lý khu phố`;

// AI Helper class
class AIHelper {
    constructor() {
        this.model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
        this.chatSessions = new Map();
    }

    // Chatbot - conversation with context
    async chat(userId, message) {
        try {
            // Get or create chat session for user
            if (!this.chatSessions.has(userId)) {
                const chat = this.model.startChat({
                    history: [],
                    generationConfig: {
                        maxOutputTokens: 500,
                        temperature: 0.7,
                    },
                });
                this.chatSessions.set(userId, chat);
            }

            const chat = this.chatSessions.get(userId);

            // First message includes system prompt
            const history = await chat.getHistory();
            let prompt = message;
            if (history.length === 0) {
                prompt = `${CHATBOT_SYSTEM_PROMPT}\n\nNgười dùng: ${message}`;
            }

            const result = await chat.sendMessage(prompt);
            const response = await result.response;
            return response.text();
        } catch (error) {
            console.error('AI Chat error:', error);
            throw new Error('Không thể kết nối với AI. Vui lòng thử lại sau.');
        }
    }

    // Clear chat history for user
    clearChatHistory(userId) {
        this.chatSessions.delete(userId);
    }

    // Smart search - parse natural language to search filters
    async parseSearchQuery(query) {
        try {
            const prompt = `${SEARCH_SYSTEM_PROMPT}\n\nCâu hỏi: "${query}"`;

            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const text = response.text().trim();

            // Extract JSON from response
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }

            return null;
        } catch (error) {
            console.error('AI Search parse error:', error);
            return null;
        }
    }

    // Smart analytics - analyze statistics data
    async analyzeData(statisticsData) {
        try {
            const prompt = `${ANALYTICS_SYSTEM_PROMPT}\n\nDữ liệu thống kê:\n${JSON.stringify(statisticsData, null, 2)}`;

            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            return response.text();
        } catch (error) {
            console.error('AI Analytics error:', error);
            throw new Error('Không thể phân tích dữ liệu. Vui lòng thử lại sau.');
        }
    }

    // Smart suggestions - get suggestions for input fields
    async getSuggestions(field, partialValue, context = {}) {
        try {
            const fieldNames = {
                'occupation': 'nghề nghiệp',
                'workplace': 'nơi làm việc',
                'address': 'địa chỉ',
                'street': 'đường',
                'area': 'khu vực/tổ',
                'current_address': 'nơi ở hiện nay'
            };

            const fieldName = fieldNames[field] || field;

            const prompt = `Gợi ý 5 giá trị phổ biến cho trường "${fieldName}" trong hệ thống quản lý dân cư khu phố.
${partialValue ? `Người dùng đang nhập: "${partialValue}"` : ''}
${context.area ? `Khu vực: ${context.area}` : ''}

Chỉ trả về danh sách JSON: ["gợi ý 1", "gợi ý 2", ...]
Không có text khác.`;

            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const text = response.text().trim();

            const jsonMatch = text.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }

            return [];
        } catch (error) {
            console.error('AI Suggestions error:', error);
            return [];
        }
    }
}

export const aiHelper = new AIHelper();
export default aiHelper;
