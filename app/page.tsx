import { AuthHeader } from '@/components/auth-header'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { UploadForm } from './upload-form'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <AuthHeader email={user.email ?? 'Người dùng'} />
      <main className="max-w-4xl mx-auto px-4 py-12">
        <UploadForm />
      </main>
    </div>
  )
}