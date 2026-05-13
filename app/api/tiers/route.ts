import { createServiceClient } from '@/lib/supabase/service'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createServiceClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('product_tiers')
      .select(`
        *,
        product:products(*)
      `)
      .order('product_id')
      .order('price')

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching tiers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tiers' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServiceClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      product_id,
      name,
      slug,
      description,
      price,
      features,
      max_activations,
      is_subscription,
      duration_days,
    } = body

    if (!product_id || !name || !slug || price == null || max_activations == null) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('product_tiers')
      .insert({
        product_id,
        name,
        slug: slug.toLowerCase(),
        description: description || null,
        price,
        features: features || [],
        max_activations,
        is_subscription: Boolean(is_subscription),
        duration_days: is_subscription ? duration_days : null,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('Error creating tier:', error)
    return NextResponse.json(
      { error: 'Failed to create tier' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createServiceClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const tierId = searchParams.get('id')

    if (!tierId) {
      return NextResponse.json(
        { error: 'Tier ID is required' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const {
      name,
      slug,
      description,
      price,
      features,
      max_activations,
      is_subscription,
      duration_days,
    } = body

    const updateData: Record<string, unknown> = {}
    if (name !== undefined) updateData.name = name
    if (slug !== undefined) updateData.slug = slug.toLowerCase()
    if (description !== undefined) updateData.description = description
    if (price !== undefined) updateData.price = price
    if (features !== undefined) updateData.features = features
    if (max_activations !== undefined) updateData.max_activations = max_activations
    if (is_subscription !== undefined) updateData.is_subscription = Boolean(is_subscription)
    if (duration_days !== undefined) updateData.duration_days = duration_days

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('product_tiers')
      .update(updateData)
      .eq('id', tierId)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error updating tier:', error)
    return NextResponse.json(
      { error: 'Failed to update tier' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createServiceClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const tierId = searchParams.get('id')

    if (!tierId) {
      return NextResponse.json(
        { error: 'Tier ID is required' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('product_tiers')
      .delete()
      .eq('id', tierId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting tier:', error)
    return NextResponse.json(
      { error: 'Failed to delete tier' },
      { status: 500 }
    )
  }
}
