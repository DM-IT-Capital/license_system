'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import type { Product, ProductTier, Customer } from '@/lib/types'

interface CreateLicenseDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  products: Product[]
  tiers: ProductTier[]
  customers: Customer[]
  onSuccess: () => void
}

export function CreateLicenseDialog({
  open,
  onOpenChange,
  products,
  tiers,
  customers,
  onSuccess
}: CreateLicenseDialogProps) {
  const [loading, setLoading] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<string>('')
  const [selectedTier, setSelectedTier] = useState<string>('')
  const [selectedCustomer, setSelectedCustomer] = useState<string>('')
  const [expiresAt, setExpiresAt] = useState<string>('')
  const [notes, setNotes] = useState('')

  const filteredTiers = tiers.filter(t => t.product_id === selectedProduct)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedProduct || !selectedTier || !selectedCustomer) {
      toast.error('Please fill in all required fields')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/licenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: selectedProduct,
          tier_id: selectedTier,
          customer_id: selectedCustomer,
          expires_at: expiresAt || null,
          metadata: notes ? { notes } : {}
        })
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.message || 'Failed to create license')
      }

      toast.success('License created successfully')
      onSuccess()
      onOpenChange(false)
      resetForm()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create license')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setSelectedProduct('')
    setSelectedTier('')
    setSelectedCustomer('')
    setExpiresAt('')
    setNotes('')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New License</DialogTitle>
            <DialogDescription>
              Generate a new license key for a customer.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="customer">Customer *</Label>
              <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                <SelectTrigger id="customer">
                  <SelectValue placeholder="Select a customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map(customer => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name} ({customer.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="product">Product *</Label>
              <Select value={selectedProduct} onValueChange={(value) => {
                setSelectedProduct(value)
                setSelectedTier('')
              }}>
                <SelectTrigger id="product">
                  <SelectValue placeholder="Select a product" />
                </SelectTrigger>
                <SelectContent>
                  {products.map(product => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="tier">License Tier *</Label>
              <Select value={selectedTier} onValueChange={setSelectedTier} disabled={!selectedProduct}>
                <SelectTrigger id="tier">
                  <SelectValue placeholder={selectedProduct ? 'Select a tier' : 'Select product first'} />
                </SelectTrigger>
                <SelectContent>
                  {filteredTiers.map(tier => (
                    <SelectItem key={tier.id} value={tier.id}>
                      {tier.name} (${tier.price})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="expires">Expiration Date (Optional)</Label>
              <Input
                id="expires"
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any additional notes about this license..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create License'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
