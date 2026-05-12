import { createClient } from '@/lib/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'
import { parseOfflineLicensePackage, isLicenseExpired } from '@/lib/license-utils'

// Public API - No auth required (your systems will call this)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { license_key, product_slug, machine_id, machine_name, offline_package } = body

    // Get client IP
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'

    // Offline validation
    if (offline_package) {
      const result = parseOfflineLicensePackage(offline_package)
      if (!result) {
        return NextResponse.json({
          valid: false,
          error: 'Invalid offline license package'
        })
      }

      if (!result.valid) {
        return NextResponse.json({
          valid: false,
          error: 'License signature verification failed'
        })
      }

      if (product_slug && result.data.productSlug !== product_slug) {
        return NextResponse.json({
          valid: false,
          error: 'License is not valid for this product'
        })
      }

      if (isLicenseExpired(result.data.expiresAt)) {
        return NextResponse.json({
          valid: false,
          error: 'License has expired',
          expired_at: result.data.expiresAt
        })
      }

      return NextResponse.json({
        valid: true,
        license_key: result.data.licenseKey,
        product: result.data.productSlug,
        tier: result.data.tierSlug,
        features: result.data.features,
        expires_at: result.data.expiresAt,
        offline: true
      })
    }

    // Online validation
    if (!license_key) {
      return NextResponse.json({
        valid: false,
        error: 'License key is required'
      }, { status: 400 })
    }

    // Fetch license with product info
    const { data: license, error: licenseError } = await supabase
      .from('licenses')
      .select(`
        *,
        product:products(*),
        tier:product_tiers(*)
      `)
      .eq('license_key', license_key.toUpperCase())
      .single()

    // Log the validation attempt
    const logValidation = async (result: string, errorMessage?: string) => {
      await supabase.from('license_validation_logs').insert({
        license_id: license?.id || null,
        license_key: license_key.toUpperCase(),
        product_slug: product_slug || null,
        machine_id: machine_id || null,
        ip_address: ip,
        validation_result: result,
        error_message: errorMessage || null
      })
    }

    if (licenseError || !license) {
      await logValidation('not_found', 'License not found')
      return NextResponse.json({
        valid: false,
        error: 'License not found'
      })
    }

    // Check product match
    if (product_slug && license.product.slug !== product_slug) {
      await logValidation('invalid', 'Product mismatch')
      return NextResponse.json({
        valid: false,
        error: 'License is not valid for this product'
      })
    }

    // Check status
    if (license.status === 'revoked') {
      await logValidation('invalid', 'License revoked')
      return NextResponse.json({
        valid: false,
        error: 'License has been revoked'
      })
    }

    if (license.status === 'suspended') {
      await logValidation('suspended', 'License suspended')
      return NextResponse.json({
        valid: false,
        error: 'License is suspended'
      })
    }

    // Check expiration
    if (isLicenseExpired(license.expires_at)) {
      await logValidation('expired', 'License expired')
      // Update status to expired if not already
      if (license.status !== 'expired') {
        await supabase
          .from('licenses')
          .update({ status: 'expired' })
          .eq('id', license.id)
      }
      return NextResponse.json({
        valid: false,
        error: 'License has expired',
        expired_at: license.expires_at
      })
    }

    // Handle machine activation
    if (machine_id) {
      // Check if this machine is already activated
      const { data: existingActivation } = await supabase
        .from('license_activations')
        .select()
        .eq('license_id', license.id)
        .eq('machine_id', machine_id)
        .single()

      if (existingActivation) {
        // Update last seen
        await supabase
          .from('license_activations')
          .update({ last_seen_at: new Date().toISOString(), ip_address: ip })
          .eq('id', existingActivation.id)
      } else {
        // Check max activations
        if (license.current_activations >= license.max_activations) {
          await logValidation('max_activations', 'Maximum activations reached')
          return NextResponse.json({
            valid: false,
            error: 'Maximum number of activations reached',
            max_activations: license.max_activations,
            current_activations: license.current_activations
          })
        }

        // Add new activation
        await supabase.from('license_activations').insert({
          license_id: license.id,
          machine_id,
          machine_name: machine_name || null,
          ip_address: ip
        })

        // Update activation count
        await supabase
          .from('licenses')
          .update({ current_activations: license.current_activations + 1 })
          .eq('id', license.id)
      }
    }

    await logValidation('valid')

    return NextResponse.json({
      valid: true,
      license_key: license.license_key,
      product: license.product.slug,
      product_name: license.product.name,
      tier: license.tier.slug,
      tier_name: license.tier.name,
      features: license.tier.features,
      expires_at: license.expires_at,
      max_activations: license.max_activations,
      current_activations: license.current_activations + (machine_id && !license.current_activations ? 1 : 0),
      customer: {
        name: license.customer?.name,
        email: license.customer?.email
      }
    })
  } catch (error) {
    console.error('Error validating license:', error)
    return NextResponse.json(
      { valid: false, error: 'Validation failed' },
      { status: 500 }
    )
  }
}
