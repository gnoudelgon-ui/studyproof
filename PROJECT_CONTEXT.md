# PROJECT_CONTEXT.md

File này là luật duy nhất. Codex/Yuu chỉ build đúng theo sprint hiện tại ghi trong file này — không tự thêm feature, không tự đổi kiến trúc.

## Thông tin dự án
- Repo: github.com/gnoudelgon-ui/studyproof
- Deploy: studyproof.vercel.app
- Tên thương hiệu: chưa chốt cuối cùng — không mở rộng thảo luận tên trong file này
- Stack: Next.js 14 (App Router) + Supabase (Postgres + pgvector + Auth) + Vercel + Gemini 2.5 Flash

## USP — một câu
Upload tài liệu → AI dạy đúng cách từng loại kiến thức → ép trả bài (Quiz + ExplainBack) → nhớ đúng chỗ sai (Mistake Memory) → ôn đúng lúc (FSRS spaced review).

## Repo tham khảo — chỉ 5 repo, chỉ ĐỌC, không clone (trừ mục 5)

1. **DeepTutor** — https://github.com/HKUDS/DeepTutor
   Tham khảo kiến trúc lớn: memory, mastery path, question bank, tutor loop. Không copy code/UI, không integrate repo.

2. **OpenTutor** — https://github.com/zijinz456/OpenTutor
   Tham khảo FSRS review flow, learning block, knowledge graph. Không clone.

3. **Studyield** — https://github.com/studyield/studyield
   Tham khảo cơ chế teach-back evaluation / ExplainBack / knowledge graph. Không clone.

4. **get-it** — https://github.com/beltromatti/get-it
   Tham khảo triết lý UX "PDF → measurable mastery map". Chỉ đọc UX, không lấy làm kiến trúc chính.

5. **ts-fsrs** — https://github.com/open-spaced-repetition/ts-fsrs
   DÙNG TRỰC TIẾP trong Sprint 2 để làm spaced review. Cài package qua npm, không tự viết SM-2.

## Scope theo sprint

**Sprint 1 (đang làm):**
PDF/text → learning blocks → Study Map (tab Học) → Quiz + ExplainBack (tab Luyện tập) → Mistake Log (tab Ôn lại) → Auth + Dashboard.

**Sprint 2 (kế tiếp) — Spaced Review dùng FSRS, KHÔNG tự viết SM-2:**
- `npm install ts-fsrs`
- Review item có 4 nút: Again / Hard / Good / Easy
- User không thấy thuật ngữ FSRS, chỉ thấy "Hôm nay cần ôn"
- Trường cần lưu cho mỗi card: `due`, `stability`, `difficulty`, `elapsed_days`, `scheduled_days`, `reps`, `lapses`, `state`
- Lưu lịch sử review vào bảng `card_reviews` hoặc `mistake_reviews`
- Sau mỗi lần review, gọi `ts-fsrs` để tính ngày ôn tiếp theo
- Không implement optimizer trong MVP
- Không expose setting FSRS cho user
- Ngoài ra: RAG-lite pgvector, UI polish

**Sprint 3:**
Landing page → usage limit → payment (PayOS/MoMo).

## KHÔNG thêm vào sprint hiện tại — ghi vào mục Later, không code

- LangChain / LlamaIndex
- Vercel AI SDK abstraction
- LiteLLM / OpenRouter / model router
- mem0 / Zep
- OCR
- YouTube
- Audio
- Voice ExplainBack
- Mobile app
- Memory Palace
- Method Router

## Phân công

- **Codex/Yuu**: build đúng sprint hiện tại trong file này.
- **Claude (Cowork)**: review code/prompt, cập nhật file này, viết schema/prompt, flag rủi ro. Không tự ý mở rộng scope.
- Muốn thêm feature ngoài sprint hiện tại → ghi vào mục Later ở trên, không code ngay.
