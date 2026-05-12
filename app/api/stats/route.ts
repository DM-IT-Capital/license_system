import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch all stats in parallel
    const [
      licensesResult,
      customersResult,
      validationsResult,
      validationsTodayResult,
      recentValidationsResult,
      licensesByProductResult,
      validationsByDayResult
    ] = await Promise.all([
      // Total licenses
      supabase.from('licenses').select('id, status', { count: 'exact' }),
      // Total customers
      supabase.from('customers').select('id', { count: 'exact' }),
      // Total validations
      supabase.from('license_validation_logs').select('id', { count: 'exact' }),
      // Validations today
      supabase
        .from('license_validation_logs')
        .select('id', { count: 'exact' })
        .gte('validated_at', new Date().toISOString().split('T')[0]),
      // Recent validations
      supabase
        .from('license_validation_logs')
        .select('*')
        .order('validated_at', { ascending: false })
        .limit(10),
      // Licenses by product
      supabase
        .from('licenses')
        .select('product:products(name)')
        .eq('status', 'active'),
      // Validations by day (last 7 days)
      supabase
        .from('license_validation_logs')
        .select('validated_at, validation_result')
        .gte('validated_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
    ])

    // Calculate active licenses
    const activeLicenses = licensesResult.data?.filter(l => l.status === 'active').length || 0

    // Group licenses by product
    const productCounts: Record<string, number> = {}
    licensesByProductResult.data?.forEach((l: { product: { name: string } | null }) => {
      const productName = l.product?.name || 'Unknown'
      productCounts[productName] = (productCounts[productName] || 0) + 1
    })
    const licensesByProduct = Object.entries(productCounts).map(([product, count]) => ({
      product,
      count
    }))

    // Group validations by day
    const dayValidations: Record<string, { valid: number; invalid: number }> = {}
    validationsByDayResult.data?.forEach((v: { validated_at: string; validation_result: string }) => {
      const date = v.validated_at.split('T')[0]
      if (!dayValidations[date]) {
        dayValidations[date] = { valid: 0, invalid: 0 }
      }
      if (v.validation_result === 'valid') {
        dayValidations[date].valid++
      } else {
        dayValidations[date].invalid++
      }
    })
    const validationsByDay = Object.entries(dayValidations)
      .map(([date, counts]) => ({ date, ...counts }))
      .sort((a, b) => a.date.localeCompare(b.date))

    return NextResponse.json({
      totalLicenses: licensesResult.count || 0,
      activeLicenses,
      totalCustomers: customersResult.count || 0,
      totalValidations: validationsResult.count || 0,
      validationsToday: validationsTodayResult.count || 0,
      recentValidations: recentValidationsResult.data || [],
      licensesByProduct,
      validationsByDay
    })
  } catch (error) {
    console.error('Error fetching stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}
