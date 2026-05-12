import { createServiceClient } from '@/lib/supabase/service'
import { redirect } from 'next/navigation'
import { DashboardSidebar } from '@/components/dashboard/sidebar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createServiceClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const { data: adminUser } = await supabase
    .from('admin_users')
    .select()
    .or(`id.eq.${user.id},email.eq.${user.email}`)
    .maybeSingle()

  if (!adminUser) {
    redirect('/auth/login')
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <main className="pl-64">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
