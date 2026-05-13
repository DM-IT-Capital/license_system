'use client'

import { useState, type FormEvent } from 'react'
import useSWR from 'swr'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { CreateProductDialog } from '@/components/dashboard/create-product-dialog'
import { CreateTierDialog } from '@/components/dashboard/create-tier-dialog'
import { Package, Check, Trash2, Pencil, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import type { Product, ProductTier } from '@/lib/types'

const fetcher = (url: string) => fetch(url).then(res => res.json())

export default function ProductsPage() {
  const { data: products, mutate } = useSWR<(Product & { tiers: ProductTier[] })[]>('/api/products', fetcher)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  
  // Product edit state
  const [editProductDialogOpen, setEditProductDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [productName, setProductName] = useState('')
  const [productSlug, setProductSlug] = useState('')
  const [productDescription, setProductDescription] = useState('')
  const [savingProduct, setSavingProduct] = useState(false)

  // Tier edit state
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingTier, setEditingTier] = useState<ProductTier | null>(null)
  const [tierName, setTierName] = useState('')
  const [tierSlug, setTierSlug] = useState('')
  const [tierPrice, setTierPrice] = useState('')
  const [tierDescription, setTierDescription] = useState('')
  const [tierMaxActivations, setTierMaxActivations] = useState('1')
  const [tierIsSubscription, setTierIsSubscription] = useState(false)
  const [tierDurationDays, setTierDurationDays] = useState('30')
  const [tierFeatures, setTierFeatures] = useState('')
  const [savingTier, setSavingTier] = useState(false)

  const openEditProduct = (product: Product) => {
    setEditingProduct(product)
    setProductName(product.name)
    setProductSlug(product.slug)
    setProductDescription(product.description || '')
    setEditProductDialogOpen(true)
  }

  const resetProductForm = () => {
    setEditingProduct(null)
    setProductName('')
    setProductSlug('')
    setProductDescription('')
  }

  const handleUpdateProduct = async (e: FormEvent) => {
    e.preventDefault()
    if (!editingProduct) return

    setSavingProduct(true)
    try {
      const response = await fetch(`/api/products?id=${editingProduct.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: productName,
          slug: productSlug,
          description: productDescription || null,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update product')
      }

      toast.success('Product updated successfully')
      setEditProductDialogOpen(false)
      resetProductForm()
      mutate()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update product')
    } finally {
      setSavingProduct(false)
    }
  }

  const openEditTier = (tier: ProductTier) => {
    setEditingTier(tier)
    setTierName(tier.name)
    setTierSlug(tier.slug)
    setTierPrice(String(tier.price))
    setTierDescription(tier.description || '')
    setTierMaxActivations(String(tier.max_activations))
    setTierIsSubscription(Boolean(tier.is_subscription))
    setTierDurationDays(String(tier.duration_days ?? 30))
    setTierFeatures((tier.features || []).join(', '))
    setEditDialogOpen(true)
  }

  const resetEditForm = () => {
    setEditingTier(null)
    setTierName('')
    setTierSlug('')
    setTierPrice('')
    setTierDescription('')
    setTierMaxActivations('1')
    setTierIsSubscription(false)
    setTierDurationDays('30')
    setTierFeatures('')
  }

  const handleUpdateTier = async (e: FormEvent) => {
    e.preventDefault()
    if (!editingTier) return

    setSavingTier(true)
    try {
      const response = await fetch(`/api/tiers?id=${editingTier.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: tierName,
          slug: tierSlug,
          description: tierDescription || null,
          price: Number(tierPrice),
          max_activations: Number(tierMaxActivations),
          is_subscription: tierIsSubscription,
          duration_days: tierIsSubscription ? Number(tierDurationDays) : null,
          features: tierFeatures.split(',').map(feature => feature.trim()).filter(Boolean),
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update tier')
      }

      toast.success('Tier updated successfully')
      setEditDialogOpen(false)
      resetEditForm()
      mutate()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update tier')
    } finally {
      setSavingTier(false)
    }
  }

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

      <Dialog open={editProductDialogOpen} onOpenChange={(open) => {
        if (!open) resetProductForm()
        setEditProductDialogOpen(open)
      }}>
        <DialogContent className="sm:max-w-[500px]">
          <form onSubmit={handleUpdateProduct}>
            <DialogHeader>
              <DialogTitle>Edit Product</DialogTitle>
              <DialogDescription>Update the product details.</DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="product-name">Product Name</Label>
                <Input
                  id="product-name"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="product-slug">Product Slug</Label>
                <Input
                  id="product-slug"
                  value={productSlug}
                  onChange={(e) => setProductSlug(e.target.value)}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="product-description">Description</Label>
                <Textarea
                  id="product-description"
                  value={productDescription}
                  onChange={(e) => setProductDescription(e.target.value)}
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditProductDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={savingProduct}>
                {savingProduct ? 'Saving...' : 'Save changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={editDialogOpen} onOpenChange={(open) => {
        if (!open) resetEditForm()
        setEditDialogOpen(open)
      }}>
        <DialogContent className="sm:max-w-[500px]">
          <form onSubmit={handleUpdateTier}>
            <DialogHeader>
              <DialogTitle>Edit Tier</DialogTitle>
              <DialogDescription>Update the tier details for this product.</DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="tier-name">Tier Name</Label>
                <Input
                  id="tier-name"
                  value={tierName}
                  onChange={(e) => setTierName(e.target.value)}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="tier-slug">Tier Slug</Label>
                <Input
                  id="tier-slug"
                  value={tierSlug}
                  onChange={(e) => setTierSlug(e.target.value)}
                  required
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="tier-price">Price</Label>
                  <Input
                    id="tier-price"
                    type="number"
                    value={tierPrice}
                    onChange={(e) => setTierPrice(e.target.value)}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="tier-max-activations">Max Activations</Label>
                  <Input
                    id="tier-max-activations"
                    type="number"
                    value={tierMaxActivations}
                    onChange={(e) => setTierMaxActivations(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Switch
                  checked={tierIsSubscription}
                  onCheckedChange={setTierIsSubscription}
                />
                <Label>Subscription tier</Label>
              </div>

              {tierIsSubscription && (
                <div className="grid gap-2">
                  <Label htmlFor="tier-duration">Duration (days)</Label>
                  <Input
                    id="tier-duration"
                    type="number"
                    value={tierDurationDays}
                    onChange={(e) => setTierDurationDays(e.target.value)}
                    required
                  />
                </div>
              )}

              <div className="grid gap-2">
                <Label htmlFor="tier-description">Description</Label>
                <Textarea
                  id="tier-description"
                  value={tierDescription}
                  onChange={(e) => setTierDescription(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="tier-features">Features</Label>
                <Textarea
                  id="tier-features"
                  value={tierFeatures}
                  onChange={(e) => setTierFeatures(e.target.value)}
                  rows={2}
                  placeholder="Comma-separated features"
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={savingTier}>
                {savingTier ? 'Saving...' : 'Save changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

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
                  <div className="flex items-center gap-2">
                    <CreateTierDialog onTierCreated={() => mutate()} productId={product.id} />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditProduct(product)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
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
              </div>
            </CardHeader>
            <CardContent>
              <h4 className="text-sm font-medium mb-4">License Tiers</h4>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {product.tiers?.length ? (
                  product.tiers.map(tier => (
                    <div
                      key={tier.id}
                      className="p-4 rounded-lg border bg-card hover:border-primary/50 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h5 className="font-semibold">{tier.name}</h5>
                          <div className="text-sm text-muted-foreground">
                            ${tier.price}{' '}
                            {tier.is_subscription && `/${tier.duration_days === 30 ? 'mo' : tier.duration_days === 365 ? 'yr' : `${tier.duration_days}d`}`}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" onClick={() => openEditTier(tier)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={async () => {
                              if (!confirm('Delete this tier?')) return
                              try {
                                const response = await fetch(`/api/tiers?id=${tier.id}`, {
                                  method: 'DELETE',
                                })
                                if (!response.ok) throw new Error('Failed to delete tier')
                                toast.success('Tier deleted')
                                mutate()
                              } catch (error) {
                                toast.error(error instanceof Error ? error.message : 'Failed to delete tier')
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
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
                  ))
                ) : (
                  <div className="p-6 rounded-lg border border-dashed border-muted/50 bg-muted/10 text-center text-sm text-muted-foreground">
                    No tiers yet. Use Add Tier to create pricing options for this product.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
