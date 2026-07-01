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

  generateLearningBlocks: (text: string) => `
Bạn là chuyên gia sư phạm. Phân tích tài liệu học tập sau và tạo ra các "Learning Blocks" — các đơn vị kiến thức độc lập, dễ học.

Tài liệu:
${text}

Tạo 5-8 learning blocks. Mỗi block là một đơn vị kiến thức cụ thể. Phân loại knowledge_type thành một trong: "concept" (khái niệm), "fact" (sự kiện/số liệu), "procedure" (quy trình), "principle" (nguyên lý), "example" (ví dụ minh họa).

Trả lời ONLY JSON (không markdown):
{
  "blocks": [
    {
      "block_index": 0,
      "knowledge_type": "concept",
      "title": "Tiêu đề ngắn (tối đa 10 từ)",
      "teach_card": "Giải thích rõ ràng, dễ hiểu, 2-4 câu. Dùng ngôn ngữ đơn giản như giải thích cho người mới.",
      "memory_aid": "Mẹo ghi nhớ, liên tưởng, hoặc câu dễ nhớ (1-2 câu)",
      "common_mistakes": ["Lỗi sai phổ biến 1", "Lỗi sai phổ biến 2"]
    }
  ]
}
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

  generatePracticeQuiz: (content: string, blocks: string) => `
Bạn là chuyên gia thiết kế bài kiểm tra học tập. Tạo 5-10 câu quiz bằng tiếng Việt từ tài liệu và learning blocks sau.

Yêu cầu:
- Trộn câu hỏi multiple_choice và short_answer.
- Câu multiple_choice có đúng 4 lựa chọn trong options.
- Câu short_answer đặt options là [].
- correct_answer phải ngắn gọn, rõ ràng.
- explanation giải thích vì sao đáp án đúng.
- Chỉ kiểm tra kiến thức có trong tài liệu.

Tài liệu:
${content}

Learning blocks:
${blocks}

Trả lời ONLY JSON:
{
  "questions": [
    {
      "question": "Câu hỏi?",
      "type": "multiple_choice",
      "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
      "correct_answer": "A",
      "explanation": "Giải thích ngắn gọn"
    },
    {
      "question": "Câu hỏi tự luận ngắn?",
      "type": "short_answer",
      "options": [],
      "correct_answer": "Đáp án mẫu ngắn gọn",
      "explanation": "Giải thích ngắn gọn"
    }
  ]
}
`.trim(),

  generateMistakeReviewQuiz: (mistakes: string, count: number = 5) => `
Bạn là gia sư tạo bài ôn lại từ các lỗi sai của người học. Tạo ${count} câu quiz ngắn bằng tiếng Việt, chỉ dựa trên danh sách mistakes sau.

Yêu cầu:
- Mỗi câu phải gắn đúng mistake_id từ danh sách.
- Trộn multiple_choice và short_answer nếu phù hợp.
- multiple_choice có đúng 4 lựa chọn trong options.
- short_answer đặt options là [].
- correct_answer phải dựa trên correct_answer của mistake.
- explanation giải thích ngắn vì sao đáp án đúng.

Danh sách mistakes:
${mistakes}

Trả lời ONLY JSON:
{
  "questions": [
    {
      "mistake_id": "uuid",
      "question": "Câu hỏi ôn lại?",
      "type": "multiple_choice",
      "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
      "correct_answer": "A",
      "explanation": "Giải thích ngắn gọn"
    }
  ]
}
`.trim(),
  gradeExplainBack: (content: string, blocks: string, userExplanation: string) => `
Bạn là gia sư chấm bài theo phương pháp ExplainBack. Dựa trên tài liệu và learning blocks, chấm phần giải thích lại của người học theo 4 chiều:
1. Thiếu ý nào.
2. Sai logic nào.
3. Ví dụ còn thiếu hoặc chưa phù hợp.
4. Độ rõ ràng.

Tài liệu:
${content}

Learning blocks:
${blocks}

Phần giải thích của người học:
${userExplanation}

Trả lời ONLY JSON:
{
  "score": 0,
  "missing_points": ["Ý quan trọng bị thiếu"],
  "wrong_logic": ["Điểm sai hoặc suy luận chưa đúng"],
  "good_points": ["Điểm làm tốt"],
  "follow_up_question": "Một câu hỏi tiếp theo để người học tự sửa"
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
