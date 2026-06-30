import Link from 'next/link'

export function AuthHeader({
  email,
  title = '📚 StudyProof',
}: {
  email: string
  title?: string
}) {
  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
        <Link href="/" className="text-2xl font-bold text-blue-700">
          {title}
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-sm text-gray-600 hover:text-blue-600">
            Dashboard
          </Link>
          <span className="text-sm text-gray-600 truncate max-w-[220px]">{email}</span>
          <form action="/api/auth/signout" method="POST">
            <button type="submit" className="text-sm text-red-600 hover:underline">
              Đăng xuất
            </button>
          </form>
        </div>
      </div>
    </header>
  )
}