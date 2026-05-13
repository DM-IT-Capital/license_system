import { NextResponse, type NextRequest } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { parseOfflineLicensePackage, isLicenseExpired } from '@/lib/license-utils'

type ValidateRequestBody = {
  license_key?: string
  product_slug?: string
  machine_id?: string
  machine_name?: string
  offline_package?: string
}

function normalizeLicenseKey(value?: string) {
  return String(value || '').trim().toUpperCase()
}

function normalizeSlug(value?: string) {
  return String(value || '').trim()
}

function getClientIp(request: NextRequest) {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    null
  )
}

async function writeValidationLog(
  supabase: ReturnType<typeof createServiceRoleClient>,
  payload: {
    licenseId?: string | null
    licenseKey?: string | null
    productSlug?: string | null
    machineId?: string | null
    machineName?: string | null
    valid: boolean
    error?: string | null
    requestIp?: string | null
    userAgent?: string | null
  },
) {
  try {
    await supabase.from('license_validation_logs').insert({
      license_id: payload.licenseId || null,
      license_key: payload.licenseKey || null,
      product_slug: payload.productSlug || null,
      machine_id: payload.machineId || null,
      machine_name: payload.machineName || null,
      is_valid: payload.valid,
      error_message: payload.error || null,
      request_ip: payload.requestIp || null,
      user_agent: payload.userAgent || null,
    })
  } catch {
    // Do not fail license validation only because logging failed.
  }
}

async function validateOfflinePackage(
  request: NextRequest,
  body: ValidateRequestBody,
) {
  const requestIp = getClientIp(request)
  const userAgent = request.headers.get('user-agent')

  try {
    if (!body.offline_package) {
      return NextResponse.json(
        {
          valid: false,
          error: 'Offline package is required',
        },
        { status: 400 },
      )
    }

    const offlineLicense = parseOfflineLicensePackage(body.offline_package)

    if (!offlineLicense) {
      return NextResponse.json(
        {
          valid: false,
          error: 'Invalid offline license package',
        },
        { status: 400 },
      )
    }

    if (isLicenseExpired(offlineLicense.expires_at)) {
      return NextResponse.json({
        valid: false,
        error: 'License has expired',
        expired_at: offlineLicense.expires_at,
      })
    }

    return NextResponse.json({
      valid: true,
      offline: true,
      license_key: offlineLicense.license_key,
      product_slug: offlineLicense.product_slug,
      product_name: offlineLicense.product_name,
      tier: offlineLicense.tier,
      tier_name: offlineLicense.tier_name,
      features: offlineLicense.features || [],
      expires_at: offlineLicense.expires_at,
      max_activations: offlineLicense.max_activations,
      current_activations: offlineLicense.current_activations,
      request_ip: requestIp,
      user_agent: userAgent,
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        valid: false,
        error: error?.message || 'Failed to validate offline license',
      },
      { status: 400 },
    )
  }
}

export async function POST(request: NextRequest) {
  const supabase = createServiceRoleClient()

  const requestIp = getClientIp(request)
  const userAgent = request.headers.get('user-agent')

  try {
    const body = (await request.json()) as ValidateRequestBody

    if (body.offline_package) {
      return validateOfflinePackage(request, body)
    }

    const licenseKey = normalizeLicenseKey(body.license_key)
    const productSlug = normalizeSlug(body.product_slug)
    const machineId = String(body.machine_id || '').trim() || null
    const machineName = String(body.machine_name || '').trim() || null

    if (!licenseKey) {
      return NextResponse.json(
        {
          valid: false,
          error: 'license_key is required',
        },
        { status: 400 },
      )
    }

    if (!productSlug) {
      return NextResponse.json(
        {
          valid: false,
          error: 'product_slug is required',
        },
        { status: 400 },
      )
    }

    const { data: license, error: licenseError } = await supabase
      .from('licenses')
      .select(
        `
          id,
          license_key,
          status,
          expires_at,
          max_activations,
          current_activations,
          customer_id,
          product_id,
          tier_id,
          customers (
            id,
            name,
            email
          ),
          products (
            id,
            name,
            slug
          ),
          product_tiers (
            id,
            name,
            slug,
            features,
            max_activations
          )
        `,
      )
      .eq('license_key', licenseKey)
      .single()

    if (licenseError || !license) {
      await writeValidationLog(supabase, {
        licenseKey,
        productSlug,
        machineId,
        machineName,
        valid: false,
        error: 'License not found',
        requestIp,
        userAgent,
      })

      return NextResponse.json({
        valid: false,
        error: 'License not found',
      })
    }

    const product = Array.isArray(license.products)
      ? license.products[0]
      : license.products

    const tier = Array.isArray(license.product_tiers)
      ? license.product_tiers[0]
      : license.product_tiers

    const customer = Array.isArray(license.customers)
      ? license.customers[0]
      : license.customers

    if (!product || product.slug !== productSlug) {
      await writeValidationLog(supabase, {
        licenseId: license.id,
        licenseKey,
        productSlug,
        machineId,
        machineName,
        valid: false,
        error: 'License does not belong to this product',
        requestIp,
        userAgent,
      })

      return NextResponse.json({
        valid: false,
        error: 'License does not belong to this product',
      })
    }

    if (license.status !== 'active') {
      await writeValidationLog(supabase, {
        licenseId: license.id,
        licenseKey,
        productSlug,
        machineId,
        machineName,
        valid: false,
        error: `License is ${license.status}`,
        requestIp,
        userAgent,
      })

      return NextResponse.json({
        valid: false,
        error: `License is ${license.status}`,
      })
    }

    if (license.expires_at && new Date(license.expires_at).getTime() < Date.now()) {
      await supabase
        .from('licenses')
        .update({
          status: 'expired',
          updated_at: new Date().toISOString(),
        })
        .eq('id', license.id)

      await writeValidationLog(supabase, {
        licenseId: license.id,
        licenseKey,
        productSlug,
        machineId,
        machineName,
        valid: false,
        error: 'License has expired',
        requestIp,
        userAgent,
      })

      return NextResponse.json({
        valid: false,
        error: 'License has expired',
        expired_at: license.expires_at,
      })
    }

    const maxActivations =
      Number(license.max_activations || tier?.max_activations || 1) || 1

    let currentActivations = Number(license.current_activations || 0) || 0

    if (machineId) {
      const { data: existingActivation } = await supabase
        .from('license_activations')
        .select('id, machine_id')
        .eq('license_id', license.id)
        .eq('machine_id', machineId)
        .maybeSingle()

      if (!existingActivation) {
        if (currentActivations >= maxActivations) {
          await writeValidationLog(supabase, {
            licenseId: license.id,
            licenseKey,
            productSlug,
            machineId,
            machineName,
            valid: false,
            error: 'Maximum activations reached',
            requestIp,
            userAgent,
          })

          return NextResponse.json({
            valid: false,
            error: 'Maximum activations reached',
            max_activations: maxActivations,
            current_activations: currentActivations,
          })
        }

        const { error: activationError } = await supabase
          .from('license_activations')
          .insert({
            license_id: license.id,
            machine_id: machineId,
            machine_name: machineName,
            activated_at: new Date().toISOString(),
            last_seen_at: new Date().toISOString(),
            request_ip: requestIp,
            user_agent: userAgent,
          })

        if (!activationError) {
          currentActivations += 1

          await supabase
            .from('licenses')
            .update({
              current_activations: currentActivations,
              updated_at: new Date().toISOString(),
            })
            .eq('id', license.id)
        }
      } else {
        await supabase
          .from('license_activations')
          .update({
            machine_name: machineName,
            last_seen_at: new Date().toISOString(),
            request_ip: requestIp,
            user_agent: userAgent,
          })
          .eq('id', existingActivation.id)
      }
    }

    await writeValidationLog(supabase, {
      licenseId: license.id,
      licenseKey,
      productSlug,
      machineId,
      machineName,
      valid: true,
      error: null,
      requestIp,
      userAgent,
    })

    return NextResponse.json({
      valid: true,
      license_key: license.license_key,
      product_slug: product.slug,
      product_name: product.name,
      customer_name: customer?.name || null,
      customer_email: customer?.email || null,
      tier: tier?.slug || null,
      tier_name: tier?.name || null,
      features: tier?.features || [],
      expires_at: license.expires_at,
      max_activations: maxActivations,
      current_activations: currentActivations,
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        valid: false,
        error: error?.message || 'Failed to validate license',
      },
      { status: 500 },
    )
  }
}