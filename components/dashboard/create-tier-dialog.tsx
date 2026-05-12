'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { Plus, Loader2 } from 'lucide-react'

interface CreateTierDialogProps {
  productId: string
  onTierCreated: () => void
}

export function CreateTierDialog({ productId, onTierCreated }: CreateTierDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [price, setPrice] = useState('')
  const [description, setDescription] = useState('')
  const [features, setFeatures] = useState('')
  const [maxActivations, setMaxActivations] = useState('1')
  const [isSubscription, setIsSubscription] = useState(false)
  const [durationDays, setDurationDays] = useState('30')

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/tiers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: productId,
          name,
          slug,
          description,
          price: Number(price),
          features: features
            .split(',')
            .map(feature => feature.trim())
            .filter(Boolean),
          max_activations: Number(maxActivations),
          is_subscription: isSubscription,
          duration_days: isSubscription ? Number(durationDays) : null,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create tier')
      }

      toast.success('Tier created successfully')
      setName('')
      setSlug('')
      setPrice('')
      setDescription('')
      setFeatures('')
      setMaxActivations('1')
      setIsSubscription(false)
      setDurationDays('30')
      setOpen(false)
      onTierCreated()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create tier')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        Add Tier
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-xl rounded-2xl bg-background p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold">Create Tier</h2>
                <p className="text-sm text-muted-foreground">Add a pricing tier for this product</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
                Close
              </Button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <Label htmlFor="tier-name">Tier Name</Label>
                <Input
                  id="tier-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Professional"
                  required
                />
              </div>

              <div>
                <Label htmlFor="tier-slug">Tier Slug</Label>
                <Input
                  id="tier-slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="e.g., professional"
                  required
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="tier-price">Price</Label>
                  <Input
                    id="tier-price"
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="0"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="tier-max-activations">Max Activations</Label>
                  <Input
                    id="tier-max-activations"
                    type="number"
                    value={maxActivations}
                    onChange={(e) => setMaxActivations(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Switch
                  checked={isSubscription}
                  onCheckedChange={setIsSubscription}
                />
                <Label>Subscription tier</Label>
              </div>

              {isSubscription && (
                <div>
                  <Label htmlFor="tier-duration">Duration (days)</Label>
                  <Input
                    id="tier-duration"
                    type="number"
                    value={durationDays}
                    onChange={(e) => setDurationDays(e.target.value)}
                    required
                  />
                </div>
              )}

              <div>
                <Label htmlFor="tier-description">Description</Label>
                <Textarea
                  id="tier-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Tier description"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="tier-features">Features</Label>
                <Textarea
                  id="tier-features"
                  value={features}
                  onChange={(e) => setFeatures(e.target.value)}
                  placeholder="Comma-separated features"
                  rows={2}
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Tier'
                )}
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
