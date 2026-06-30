import { AuthHeader } from '@/components/auth-header'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { PracticeTabs } from './practice-tabs'

interface Block {
  id: string
  block_index: number
  knowledge_type: string
  title: string
  teach_card: string
  memory_aid: string
  common_mistakes: string[]
}

interface Document {
  id: string
  title: string
  content: string
  created_at: string
}

export default async function DocumentPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const admin = await createAdminClient()

  const { data: doc } = await admin
    .from('documents')
    .select('id, title, content, created_at')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()

  if (!doc) redirect('/dashboard')

  const { data: blocks } = await admin
    .from('learning_blocks')
    .select('*')
    .eq('document_id', params.id)
    .order('block_index')

  const document = doc as Document
  const learningBlocks = (blocks ?? []) as Block[]

  return (
    <div className="min-h-screen bg-gray-50">
      <AuthHeader email={user.email ?? 'Người dùng'} />

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-5 flex items-center gap-4">
          <Link href="/dashboard" className="text-gray-500 hover:text-gray-700 text-sm">
            ← Dashboard
          </Link>
          <h1 className="font-semibold text-gray-900 truncate flex-1">
            {document.title}
          </h1>
          <span className="text-xs text-gray-400 whitespace-nowrap">
            {learningBlocks.length} blocks
          </span>
        </div>

        <PracticeTabs documentId={document.id} learningBlocks={learningBlocks} />
      </main>
    </div>
  )
}