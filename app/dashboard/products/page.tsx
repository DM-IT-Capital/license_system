'use client'

import useSWR from 'swr'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Package, Check } from 'lucide-react'
import type { Product, ProductTier } from '@/lib/types'

const fetcher = (url: string) => fetch(url).then(res => res.json())

export default function ProductsPage() {
  const { data: products } = useSWR<(Product & { tiers: ProductTier[] })[]>('/api/products', fetcher)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Products</h1>
        <p className="text-muted-foreground mt-1">Your licensed software products and pricing tiers</p>
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
                <Badge variant="outline" className="font-mono text-xs">
                  {product.slug}
                </Badge>
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
