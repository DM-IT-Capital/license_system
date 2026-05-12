import { createServiceClient } from '@/lib/supabase/service'
import { NextResponse } from 'next/server'

export async function POST() {
  const supabase = await createServiceClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json(
      { admin: false, error: userError?.message ?? 'No active user session' },
      { status: 401 },
    )
  }

  const { data: adminUser, error: adminError } = await supabase
    .from('admin_users')
    .select('*')
    .or(`id.eq.${user.id},email.eq.${user.email}`)
    .maybeSingle()

  if (adminError) {
    return NextResponse.json({ admin: false, error: adminError.message }, { status: 403 })
  }

  return NextResponse.json({ admin: Boolean(adminUser) })
}
