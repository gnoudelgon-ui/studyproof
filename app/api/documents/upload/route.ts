import { createAdminClient } from '@/lib/supabase/server'
import { generateJSON } from '@/lib/ai/gemini'
import { PROMPTS } from '@/lib/ai/prompts'
import { NextRequest, NextResponse } from 'next/server'

interface LearningBlock {
  block_index: number
  knowledge_type: string
  title: string
  teach_card: string
  memory_aid: string
  common_mistakes: string[]
}

const MVP_USER_ID = '00000000-0000-0000-0000-000000000000'

export async function POST(req: NextRequest) {
  try {
    // Parse body
    const { title, content } = await req.json()
    if (!content || content.trim().length < 50) {
      return NextResponse.json(
        { error: 'Nội dung quá ngắn (tối thiểu 50 ký tự)' },
        { status: 400 }
      )
    }

    const admin = await createAdminClient()

    // Save document
    const { data: document, error: docError } = await admin
      .from('documents')
      .insert({
        user_id: MVP_USER_ID,
        title: title || 'Tài liệu chưa đặt tên',
        content: content.trim(),
        language: 'vi',
      })
      .select('id')
      .single()

    if (docError || !document) {
      console.error('Insert document error:', docError)
      return NextResponse.json({ error: 'Lỗi lưu tài liệu' }, { status: 500 })
    }

    // Truncate content for AI (max ~8000 chars to stay within token limits)
    const aiContent = content.trim().slice(0, 8000)

    // Generate learning blocks via Gemini
    const result = await generateJSON<{ blocks: LearningBlock[] }>(
      PROMPTS.generateLearningBlocks(aiContent)
    )

    const blocks = result.blocks.map((block, i) => ({
      document_id: document.id,
      block_index: i,
      knowledge_type: block.knowledge_type,
      title: block.title,
      teach_card: block.teach_card,
      memory_aid: block.memory_aid,
      common_mistakes: block.common_mistakes ?? [],
    }))

    const { error: blocksError } = await admin
      .from('learning_blocks')
      .insert(blocks)

    if (blocksError) {
      console.error('Insert blocks error:', blocksError)
      // Don't fail — document is saved, blocks can be retried
    }

    return NextResponse.json({ id: document.id })
  } catch (err) {
    console.error('Upload error:', err)
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 })
  }
}
