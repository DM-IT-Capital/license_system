import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardSidebar } from '@/components/dashboard/sidebar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Check if user is admin
  const { data: adminUserById } = await supabase
    .from('admin_users')
    .select()
    .eq('id', user.id)
    .maybeSingle()

  let adminUser = adminUserById

  if (!adminUser && user.email) {
    const { data: adminUserByEmail } = await supabase
      .from('admin_users')
      .select()
      .eq('email', user.email)
      .maybeSingle()

    adminUser = adminUserByEmail
  }

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
