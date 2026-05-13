'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Settings, Key, Code, Copy, Check, ExternalLink, Pencil, Trash2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import useSWR from 'swr'
import { FormEvent } from 'react'

interface Product {
  id: string
  name: string
  slug: string
  description: string | null
}

const fetcher = (url: string) => fetch(url).then(r => r.json())

export default function SettingsPage() {
  const [copied, setCopied] = useState<string | null>(null)
  const [editProductDialogOpen, setEditProductDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [productName, setProductName] = useState('')
  const [productSlug, setProductSlug] = useState('')
  const [productDescription, setProductDescription] = useState('')
  const [savingProduct, setSavingProduct] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const { data: products, mutate } = useSWR<Product[]>('/api/products', fetcher)

  const apiEndpoint = typeof window !== 'undefined' 
    ? `${window.location.origin}/api/validate`
    : '/api/validate'

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopied(id)
    toast.success('Copied to clipboard')
    setTimeout(() => setCopied(null), 2000)
  }

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

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return

    setDeletingId(productId)
    try {
      const response = await fetch(`/api/products?id=${productId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete product')
      }

      toast.success('Product deleted successfully')
      mutate()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete product')
    } finally {
      setDeletingId(null)
    }
  }

  const exampleCode = `// Validate a license in your application
const response = await fetch('${apiEndpoint}', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    license_key: 'XXXX-XXXX-XXXX-XXXX',
    product_slug: 'ai-ddos-dashboard',
    machine_id: 'unique-machine-identifier',
    machine_name: 'User\\'s Computer'
  })
});

const result = await response.json();

if (result.valid) {
  console.log('License is valid!');
  console.log('Features:', result.features);
  console.log('Expires:', result.expires_at);
} else {
  console.error('License invalid:', result.error);
}`

  const offlineExample = `// Offline validation (no internet required)
const response = await fetch('${apiEndpoint}', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    offline_package: 'base64-encoded-offline-license-package',
    product_slug: 'ai-ddos-dashboard'
  })
});

const result = await response.json();
// Works without internet connection using cryptographic signatures`

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">Configure your license management system</p>
      </div>

      <Tabs defaultValue="api" className="space-y-6">
        <TabsList>
          <TabsTrigger value="api" className="gap-2">
            <Code className="h-4 w-4" />
            API Integration
          </TabsTrigger>
          <TabsTrigger value="products" className="gap-2">
            <Key className="h-4 w-4" />
            Product Slugs
          </TabsTrigger>
          <TabsTrigger value="general" className="gap-2">
            <Settings className="h-4 w-4" />
            General
          </TabsTrigger>
        </TabsList>

        <TabsContent value="api" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>API Endpoint</CardTitle>
              <CardDescription>
                Use this endpoint in your applications to validate licenses
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <code className="flex-1 p-3 bg-muted rounded-lg font-mono text-sm">
                  POST {apiEndpoint}
                </code>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(apiEndpoint, 'endpoint')}
                >
                  {copied === 'endpoint' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                This endpoint supports both online validation (real-time) and offline validation (cryptographic signatures).
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Online Validation Example</CardTitle>
                  <CardDescription>
                    Validate licenses in real-time with machine tracking
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(exampleCode, 'online')}
                >
                  {copied === 'online' ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                  Copy
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <pre className="p-4 bg-muted rounded-lg overflow-x-auto text-sm">
                <code>{exampleCode}</code>
              </pre>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Offline Validation Example</CardTitle>
                  <CardDescription>
                    Validate licenses without internet using cryptographic signatures
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(offlineExample, 'offline')}
                >
                  {copied === 'offline' ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                  Copy
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <pre className="p-4 bg-muted rounded-lg overflow-x-auto text-sm">
                <code>{offlineExample}</code>
              </pre>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>API Response Format</CardTitle>
              <CardDescription>What to expect from the validation endpoint</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2 text-green-500">Successful Response</h4>
                <pre className="p-4 bg-muted rounded-lg overflow-x-auto text-sm">
{`{
  "valid": true,
  "license_key": "XXXX-XXXX-XXXX-XXXX",
  "product": "ai-ddos-dashboard",
  "product_name": "AI DDoS Dashboard",
  "tier": "pro",
  "tier_name": "Pro",
  "features": ["All Basic features", "Priority support", ...],
  "expires_at": "2025-12-31T23:59:59Z",
  "max_activations": 3,
  "current_activations": 1
}`}
                </pre>
              </div>
              <div>
                <h4 className="font-medium mb-2 text-red-500">Error Response</h4>
                <pre className="p-4 bg-muted rounded-lg overflow-x-auto text-sm">
{`{
  "valid": false,
  "error": "License has expired",
  "expired_at": "2024-12-31T23:59:59Z"
}`}
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Your Product Slugs</CardTitle>
              <CardDescription>
                Use these slugs when validating licenses for specific products
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {!products ? (
                  <div className="flex items-center justify-center p-8">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : products.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No products created yet.</p>
                ) : (
                  products.map(product => (
                    <div key={product.id} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                      <div>
                        <h4 className="font-medium">{product.name}</h4>
                        <p className="text-sm text-muted-foreground">{product.description}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-mono">{product.slug}</Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => copyToClipboard(product.slug, `slug-${product.id}`)}
                        >
                          {copied === `slug-${product.id}` ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditProduct(product)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteProduct(product.id)}
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
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>License Signature Secret</CardTitle>
              <CardDescription>
                Set a secret key for offline license validation signatures
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="secret">Signature Secret</Label>
                <Input
                  id="secret"
                  type="password"
                  placeholder="Set via LICENSE_SIGNATURE_SECRET env variable"
                  disabled
                />
                <p className="text-xs text-muted-foreground">
                  Set the LICENSE_SIGNATURE_SECRET environment variable for secure offline validation.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Documentation</CardTitle>
              <CardDescription>Additional resources for integration</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <a
                  href="#"
                  className="flex items-center gap-2 text-primary hover:underline"
                >
                  <ExternalLink className="h-4 w-4" />
                  Full API Documentation
                </a>
                <a
                  href="#"
                  className="flex items-center gap-2 text-primary hover:underline"
                >
                  <ExternalLink className="h-4 w-4" />
                  SDK Integration Guides
                </a>
                <a
                  href="#"
                  className="flex items-center gap-2 text-primary hover:underline"
                >
                  <ExternalLink className="h-4 w-4" />
                  Webhook Configuration
                </a>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

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
    </div>
  )
}
