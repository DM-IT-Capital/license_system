'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CreateProductDialog } from '@/components/dashboard/create-product-dialog'
import { Package, Check, Trash2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import type { Product, ProductTier } from '@/lib/types'

const fetcher = (url: string) => fetch(url).then(res => res.json())

export default function ProductsPage() {
  const { data: products, mutate } = useSWR<(Product & { tiers: ProductTier[] })[]>('/api/products', fetcher)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return

    setDeletingId(productId)
    try {
      const response = await fetch(`/api/products?id=${productId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete product')
      }

      toast.success('Product deleted successfully')
      mutate()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete product')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Products</h1>
          <p className="text-muted-foreground mt-1">Your licensed software products and pricing tiers</p>
        </div>
        <CreateProductDialog onProductCreated={() => mutate()} />
      </div>

      <div className="grid gap-6">
        {products?.map(product => (
          <Card key={product.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Package className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle>{product.name}</CardTitle>
                    <CardDescription>{product.description}</CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono text-xs">
                    {product.slug}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(product.id)}
                    disabled={deletingId === product.id}
                  >
                    {deletingId === product.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <h4 className="text-sm font-medium mb-4">License Tiers</h4>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {product.tiers?.map(tier => (
                  <div
                    key={tier.id}
                    className="p-4 rounded-lg border bg-card hover:border-primary/50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="font-semibold">{tier.name}</h5>
                      <div className="text-right">
                        <span className="text-2xl font-bold">${tier.price}</span>
                        {tier.is_subscription && (
                          <span className="text-sm text-muted-foreground">
                            /{tier.duration_days === 30 ? 'mo' : tier.duration_days === 365 ? 'yr' : `${tier.duration_days}d`}
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{tier.description}</p>
                    <div className="space-y-2">
                      {(tier.features as string[])?.map((feature, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm">
                          <Check className="h-4 w-4 text-green-500" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 pt-3 border-t flex items-center justify-between text-sm text-muted-foreground">
                      <span>Max activations: {tier.max_activations}</span>
                      <Badge variant={tier.is_subscription ? 'default' : 'secondary'}>
                        {tier.is_subscription ? 'Subscription' : 'Perpetual'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
