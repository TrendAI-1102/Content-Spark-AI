import { GoogleGenAI, Type } from "@google/genai";
import { GeneratedPostContent, Tone, ImageStyle, SafetyStatus, QuoteCategory, TrendItem } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- Local Translation Maps for Prompts ---
const toneMap: Record<Tone, string> = {
  [Tone.PROVOCATIVE]: 'Kích thích tranh luận',
  [Tone.DEBATE]: 'Tranh luận',
  [Tone.SATIRE]: 'Châm biếm',
  [Tone.PLAYFUL]: 'Vui tươi',
  [Tone.ANALYTICAL]: 'Phân tích',
  [Tone.NEUTRAL]: 'Trung lập',
};

const imageStyleMap: Record<ImageStyle, string> = {
  [ImageStyle.EDITORIAL_VECTOR]: 'Vector biên tập',
  [ImageStyle.MEME]: 'Phong cách meme (không mặt)',
  [ImageStyle.ILLUSTRATION]: 'Minh họa cách điệu',
  [ImageStyle.INFOGRAPHIC]: 'Đoạn infographic',
};

const quoteCategoryMap: Record<QuoteCategory, string> = {
  [QuoteCategory.TRENDING]: 'Thịnh hành, tạo trend',
  [QuoteCategory.PHILOSOPHY]: 'Triết lý sống sâu sắc',
  [QuoteCategory.LOVE]: 'Tình yêu lãng mạn',
  [QuoteCategory.CONTRARIAN]: 'Những câu nói đi ngược lại với định nghĩa hoặc quan điểm thông thường',
  [QuoteCategory.MOTIVATION]: 'Động lực sống và phát triển bản thân',
  [QuoteCategory.CELEBRITY]: 'Người nổi tiếng và người của công chúng',
};


const textResponseSchema = {
    type: Type.OBJECT,
    properties: {
        hook: {
            type: Type.STRING,
            description: "Một dòng thu hút sự chú ý bằng tiếng Việt cho bài đăng trên mạng xã hội."
        },
        context: {
            type: Type.STRING,
            description: "1-2 câu ngữ cảnh ngắn gọn bằng tiếng Việt (tối đa 140 ký tự)."
        },
        discussion_prompts: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Chính xác 3 câu hỏi mở bằng tiếng Việt để khơi gợi thảo luận."
        },
        hashtags: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Chính xác 5 hashtag liên quan bằng tiếng Việt, không dấu, được tối ưu hóa để tương tác."
        },
        safety_tag: {
            type: Type.STRING,
            enum: [SafetyStatus.SAFE, SafetyStatus.NEEDS_REVIEW, SafetyStatus.REJECTED],
            description: `Phân loại an toàn. Sử dụng '${SafetyStatus.NEEDS_REVIEW}' cho nội dung khiêu khích, tranh luận hoặc châm biếm. Sử dụng '${SafetyStatus.REJECTED}' cho nội dung vi phạm quy tắc an toàn. Sử dụng '${SafetyStatus.SAFE}' cho tất cả các nội dung khác.`
        },
        disclaimer: {
            type: Type.STRING,
            description: "Nếu tông giọng là 'Châm biếm' hoặc 'Kích thích tranh luận', hãy thêm một tuyên bố miễn trừ trách nhiệm bằng tiếng Việt như 'Quan điểm:' hoặc 'Châm biếm:'. Nếu không, đây phải là một chuỗi rỗng.",
            nullable: true,
        },
    },
    required: ['hook', 'context', 'discussion_prompts', 'hashtags', 'safety_tag']
};

export const generateTextContent = async (topic: string, tone: Tone): Promise<GeneratedPostContent> => {
    try {
        const systemInstruction = `Bạn là một chuyên gia sáng tạo nội dung mạng xã hội, chuyên tạo ra nội dung theo xu hướng và gây tranh luận. Mục tiêu chính của bạn là tạo ra các bài đăng hấp dẫn trong khi tuân thủ nghiêm ngặt các nguyên tắc an toàn. TOÀN BỘ ĐẦU RA PHẢI BẰNG TIẾNG VIỆT.
        
        Quy tắc an toàn:
        - KHÔNG BAO GIỜ tạo nội dung thù địch, quấy rối, phỉ báng hoặc quảng bá thông tin sai lệch.
        - KHÔNG BAO GIỜ mạo danh các cá nhân có thật hoặc tạo nội dung về họ.
        - LUÔN LUÔN gắn nhãn các kết quả nhạy cảm hoặc khiêu khích bằng tuyên bố miễn trừ trách nhiệm.
        - Định dạng đầu ra của bạn PHẢI là một đối tượng JSON hợp lệ khớp với schema được cung cấp.`;

        const prompt = `Tạo một bài đăng trên mạng xã hội bằng TIẾNG VIỆT về chủ đề "${topic}" với tông giọng "${toneMap[tone]}". Bài đăng phải hấp dẫn, kích thích tư duy và được thiết kế để tạo ra thảo luận.`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: "application/json",
                responseSchema: textResponseSchema,
                temperature: 0.8,
            }
        });
        
        const jsonText = response.text.trim();
        const parsed = JSON.parse(jsonText);

        // Ensure arrays have the correct length
        parsed.discussion_prompts = parsed.discussion_prompts.slice(0, 3);
        parsed.hashtags = parsed.hashtags.slice(0, 5);

        return parsed as GeneratedPostContent;
    } catch (error) {
        console.error("Error generating text content:", error);
        throw new Error("Không thể tạo nội dung văn bản từ AI. Vui lòng kiểm tra console để biết chi tiết.");
    }
};

const simpleTextResponseSchema = {
    type: Type.OBJECT,
    properties: {
        text: {
            type: Type.STRING,
            description: "Một đoạn văn ngắn, giàu trí tưởng tượng và mang tính mô tả bằng tiếng Việt (khoảng 3-5 câu) về chủ đề được cung cấp."
        }
    },
    required: ['text']
};

export const generateSimpleText = async (topic: string): Promise<string> => {
    try {
        const systemInstruction = `Bạn là một người kể chuyện và nhà văn sáng tạo AI. Vai trò của bạn là tạo ra những đoạn văn ngắn, giàu hình ảnh và hấp dẫn bằng tiếng Việt. TOÀN BỘ ĐẦU RA PHẢI BẰNG TIẾNG VIỆT và là một đối tượng JSON hợp lệ.`;
        const prompt = `Viết một đoạn văn ngắn, giàu trí tưởng tượng và mang tính mô tả (3-5 câu) về chủ đề: "${topic}".`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: "application/json",
                responseSchema: simpleTextResponseSchema,
                temperature: 0.8,
            }
        });
        const jsonText = response.text.trim();
        const parsed = JSON.parse(jsonText);
        return parsed.text;
    } catch (error) {
        console.error("Error generating simple text:", error);
        throw new Error("Không thể tạo văn bản từ AI.");
    }
};

const quoteResponseSchema = {
    type: Type.OBJECT,
    properties: {
        quotes: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Một danh sách gồm chính xác 10 câu nói, trích dẫn hoặc triết lý sâu sắc, độc đáo và nguyên bản bằng tiếng Việt, phù hợp với thể loại được yêu cầu."
        },
    },
    required: ['quotes']
};

export const generateQuote = async (category: QuoteCategory): Promise<{ quotes: string[] }> => {
    try {
        const systemInstruction = `Bạn là một nhà văn và nhà triết học AI, chuyên tạo ra những câu nói nguyên bản, sâu sắc và đáng nhớ. Câu nói phải ngắn gọn, mạnh mẽ và phù hợp để chia sẻ trên mạng xã hội. TOÀN BỘ ĐẦU RA PHẢI BẰNG TIẾNG VIỆT và là một đối tượng JSON hợp lệ.`;

        const prompt = `Tạo một danh sách gồm chính xác 10 câu nói độc đáo, sâu sắc và có khả năng gây sốt trên mạng xã hội bằng TIẾNG VIỆT, thuộc thể loại "${quoteCategoryMap[category]}".`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: "application/json",
                responseSchema: quoteResponseSchema,
                temperature: 0.9,
            }
        });

        const jsonText = response.text.trim();
        return JSON.parse(jsonText);

    } catch (error) {
        console.error("Error generating quote:", error);
        throw new Error("Không thể tạo câu nói từ AI. Vui lòng kiểm tra console để biết chi tiết.");
    }
};

export const generateImage = async (topic: string, style: ImageStyle): Promise<string> => {
    try {
        const prompt = `Tạo một hình ảnh cho bài đăng trên mạng xã hội về chủ đề tiếng Việt "${topic}". Phong cách nên là "${imageStyleMap[style]}". Hình ảnh nên trừu tượng hoặc ẩn dụ, tránh miêu tả người thật hoặc các nhân vật của công chúng. Nó cần phải nổi bật về mặt hình ảnh và liên quan đến chủ đề.`;

        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: prompt,
            config: {
                numberOfImages: 1,
                outputMimeType: 'image/jpeg',
                aspectRatio: '16:9',
            },
        });

        if (response.generatedImages && response.generatedImages.length > 0) {
            const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
            return `data:image/jpeg;base64,${base64ImageBytes}`;
        }
        throw new Error("Không có hình ảnh nào được tạo ra.");

    } catch (error) {
        console.error("Error generating image:", error);
        throw new Error("Không thể tạo hình ảnh từ AI. Sử dụng hình ảnh giữ chỗ.");
    }
};

const trendsResponseSchema = {
    type: Type.OBJECT,
    properties: {
        trends: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    keyword: { type: Type.STRING, description: "Từ khóa chính của xu hướng bằng tiếng Việt." },
                    summary: { type: Type.STRING, description: "Tóm tắt ngắn gọn (1-2 câu) lý do xu hướng này thịnh hành." },
                    score: { type: Type.INTEGER, description: "Điểm xu hướng từ 0 đến 100, thể hiện mức độ phổ biến." },
                    source: { type: Type.STRING, description: "Nguồn gốc hoặc loại xu hướng (ví dụ: Mạng xã hội, Tin tức, Sự kiện văn hóa)." }
                },
                required: ['keyword', 'summary', 'score', 'source']
            }
        }
    },
    required: ['trends']
};

export const generateTrends = async (): Promise<TrendItem[]> => {
    try {
        const systemInstruction = `Bạn là một chuyên gia phân tích xu hướng mạng xã hội tại Việt Nam. Vai trò của bạn là xác định các chủ đề đang thịnh hành và có tiềm năng tạo ra các cuộc thảo luận sôi nổi. Cung cấp đầu ra dưới dạng JSON.`;
        const prompt = `Liệt kê 5 chủ đề đang là xu hướng hàng đầu trên mạng xã hội Việt Nam. Với mỗi chủ đề, hãy cung cấp một bản tóm tắt ngắn gọn về lý do nó thịnh hành, một điểm xu hướng (0-100) và một nguồn có thể có (ví dụ: 'Mạng xã hội', 'Tin tức', 'Sự kiện văn hóa'). TOÀN BỘ ĐẦU RA PHẢI BẰNG TIẾNG VIỆT.`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: "application/json",
                responseSchema: trendsResponseSchema,
                temperature: 0.7,
            }
        });
        
        const jsonText = response.text.trim();
        const parsed = JSON.parse(jsonText);
        return parsed.trends as TrendItem[];
    } catch (error) {
        console.error("Error generating trends:", error);
        throw new Error("Không thể tạo danh sách xu hướng từ AI. Vui lòng kiểm tra console để biết chi tiết.");
    }
};