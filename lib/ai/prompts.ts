export const PROMPTS = {
  summarize: (text: string) => `
Tóm tắt nội dung sau đây một cách súc tích, rõ ràng bằng tiếng Việt.
Nêu bật các ý chính và điểm quan trọng nhất.

Nội dung:
${text}

Trả lời bằng format:
## Tóm tắt
[Tóm tắt ngắn gọn]

## Các điểm chính
- [Điểm 1]
- [Điểm 2]
- ...
`.trim(),

  generateQuiz: (text: string, count: number = 5) => `
Dựa trên nội dung sau, tạo ${count} câu hỏi trắc nghiệm để kiểm tra hiểu biết.
Mỗi câu có 4 lựa chọn (A, B, C, D) và chỉ 1 đáp án đúng.

Nội dung:
${text}

Trả lời theo format JSON:
{
  "questions": [
    {
      "question": "Câu hỏi?",
      "options": { "A": "...", "B": "...", "C": "...", "D": "..." },
      "answer": "A",
      "explanation": "Giải thích ngắn gọn"
    }
  ]
}
`.trim(),

  explainConcept: (concept: string, context: string) => `
Giải thích khái niệm "${concept}" một cách dễ hiểu, có ví dụ cụ thể.
Sử dụng ngữ cảnh từ tài liệu nếu có.

Ngữ cảnh từ tài liệu:
${context}

Trả lời bằng tiếng Việt, súc tích và dễ hiểu.
`.trim(),

  flashcards: (text: string, count: number = 10) => `
Tạo ${count} flashcard từ nội dung sau để học tập hiệu quả.
Mỗi flashcard có mặt trước (câu hỏi/thuật ngữ) và mặt sau (đáp án/định nghĩa).

Nội dung:
${text}

Trả lời theo format JSON:
{
  "flashcards": [
    { "front": "Thuật ngữ hoặc câu hỏi", "back": "Định nghĩa hoặc đáp án" }
  ]
}
`.trim(),
}
