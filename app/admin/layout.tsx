import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/auth'
import AdminSidebar from '@/components/admin/AdminSidebar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  try {
    await requireAdmin()
  } catch {
    redirect('/login')
  }

  return (
    <div className="min-h-screen flex bg-[#09090b]">
      <AdminSidebar />
      <div className="flex-1 min-w-0 pt-14 lg:pt-0">
        {children}
      </div>
    </div>
  )
}
