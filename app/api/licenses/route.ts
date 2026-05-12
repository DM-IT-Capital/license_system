import { createClient } from '@/lib/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'
import { generateLicenseKey, createOfflineLicensePackage, type OfflineLicenseData } from '@/lib/license-utils'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const productId = searchParams.get('product_id')
    const customerId = searchParams.get('customer_id')

    let query = supabase
      .from('licenses')
      .select(`
        *,
        customer:customers(*),
        product:products(*),
        tier:product_tiers(*)
      `)
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }
    if (productId) {
      query = query.eq('product_id', productId)
    }
    if (customerId) {
      query = query.eq('customer_id', customerId)
    }

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching licenses:', error)
    return NextResponse.json(
      { error: 'Failed to fetch licenses' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { product_id, tier_id, customer_id, expires_at, metadata } = body

    if (!product_id || !tier_id || !customer_id) {
      return NextResponse.json(
        { error: 'Missing required fields: product_id, tier_id, customer_id' },
        { status: 400 }
      )
    }

    // Get tier details
    const { data: tier, error: tierError } = await supabase
      .from('product_tiers')
      .select('*, product:products(*)')
      .eq('id', tier_id)
      .single()

    if (tierError || !tier) {
      return NextResponse.json({ error: 'Invalid tier' }, { status: 400 })
    }

    // Generate license key
    const licenseKey = generateLicenseKey()

    // Calculate expiration
    let finalExpiresAt = expires_at
    if (!finalExpiresAt && tier.is_subscription && tier.duration_days) {
      const expirationDate = new Date()
      expirationDate.setDate(expirationDate.getDate() + tier.duration_days)
      finalExpiresAt = expirationDate.toISOString()
    }

    // Generate offline signature
    const offlineLicenseData: OfflineLicenseData = {
      licenseKey,
      productSlug: tier.product.slug,
      tierSlug: tier.slug,
      expiresAt: finalExpiresAt,
      maxActivations: tier.max_activations,
      features: tier.features || [],
      issuedAt: new Date().toISOString()
    }
    const offlineSignature = createOfflineLicensePackage(offlineLicenseData)

    // Create license
    const { data: license, error: licenseError } = await supabase
      .from('licenses')
      .insert({
        license_key: licenseKey,
        customer_id,
        product_id,
        tier_id,
        status: 'active',
        is_subscription: tier.is_subscription,
        expires_at: finalExpiresAt,
        max_activations: tier.max_activations,
        offline_signature: offlineSignature,
        metadata: metadata || {}
      })
      .select(`
        *,
        customer:customers(*),
        product:products(*),
        tier:product_tiers(*)
      `)
      .single()

    if (licenseError) throw licenseError

    return NextResponse.json(license, { status: 201 })
  } catch (error) {
    console.error('Error creating license:', error)
    return NextResponse.json(
      { error: 'Failed to create license' },
      { status: 500 }
    )
  }
}
