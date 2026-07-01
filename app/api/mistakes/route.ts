import { createAdminClient, createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.redirect(new URL('/login', req.url))
    }

    const documentId = req.nextUrl.searchParams.get('documentId')

    if (!documentId) {
      return NextResponse.json({ error: 'Thiếu documentId' }, { status: 400 })
    }

    const admin = await createAdminClient()

    const { data: document, error: docError } = await admin
      .from('documents')
      .select('id')
      .eq('id', documentId)
      .eq('user_id', user.id)
      .single()

    if (docError || !document) {
      return NextResponse.json({ error: 'Không tìm thấy tài liệu' }, { status: 404 })
    }

    const { data: mistakes, error: mistakesError } = await admin
      .from('mistakes')
      .select('id, document_id, source, content, correct_answer, times_wrong, last_seen')
      .eq('document_id', documentId)
      .eq('user_id', user.id)
      .order('last_seen', { ascending: false })

    if (mistakesError) {
      console.error('Load mistakes error:', mistakesError)
      return NextResponse.json({ error: 'Lỗi tải danh sách lỗi' }, { status: 500 })
    }

    return NextResponse.json({ mistakes: mistakes ?? [] })
  } catch (err) {
    console.error('Mistakes API error:', err)
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 })
  }
}