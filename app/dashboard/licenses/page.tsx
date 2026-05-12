'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CreateLicenseDialog } from '@/components/dashboard/create-license-dialog'
import { LicenseStatusBadge } from '@/components/dashboard/license-status-badge'
import { Plus, Search, MoreHorizontal, Copy, Eye, Ban, Trash2, Key } from 'lucide-react'
import type { License, Product, ProductTier, Customer } from '@/lib/types'
import { toast } from 'sonner'
import Link from 'next/link'

const fetcher = (url: string) => fetch(url).then(res => res.json())

export default function LicensesPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [productFilter, setProductFilter] = useState<string>('all')
  const [createDialogOpen, setCreateDialogOpen] = useState(false)

  const { data: licenses, mutate } = useSWR<License[]>('/api/licenses', fetcher)
  const { data: products } = useSWR<Product[]>('/api/products', fetcher)
  const { data: tiers } = useSWR<ProductTier[]>('/api/tiers', fetcher)
  const { data: customers } = useSWR<Customer[]>('/api/customers', fetcher)

  const filteredLicenses = licenses?.filter(license => {
    const matchesSearch = !search || 
      license.license_key.toLowerCase().includes(search.toLowerCase()) ||
      license.customer?.name.toLowerCase().includes(search.toLowerCase()) ||
      license.customer?.email.toLowerCase().includes(search.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || license.status === statusFilter
    const matchesProduct = productFilter === 'all' || license.product_id === productFilter

    return matchesSearch && matchesStatus && matchesProduct
  })

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('License key copied to clipboard')
  }

  const updateLicenseStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/licenses/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })
      if (!res.ok) throw new Error('Failed to update')
      toast.success(`License ${status}`)
      mutate()
    } catch {
      toast.error('Failed to update license')
    }
  }

  const renewLicense = async (id: string, currentDate?: string) => {
    const suggested = currentDate ? currentDate.split('T')[0] : ''
    const newDate = prompt('Enter new expiration date (YYYY-MM-DD):', suggested)
    if (!newDate) return

    const isoDate = new Date(newDate)
    if (Number.isNaN(isoDate.getTime())) {
      toast.error('Invalid date format')
      return
    }

    try {
      const res = await fetch(`/api/licenses/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expires_at: isoDate.toISOString() }),
      })
      if (!res.ok) throw new Error('Failed to renew license')
      toast.success('License renewed successfully')
      mutate()
    } catch {
      toast.error('Failed to renew license')
    }
  }

  const deleteLicense = async (id: string) => {
    if (!confirm('Are you sure you want to delete this license?')) return
    try {
      const res = await fetch(`/api/licenses/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      toast.success('License deleted')
      mutate()
    } catch {
      toast.error('Failed to delete license')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Licenses</h1>
          <p className="text-muted-foreground mt-1">Manage and generate license keys</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create License
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            All Licenses
          </CardTitle>
          <CardDescription>
            {filteredLicenses?.length || 0} licenses found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by key, customer name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="revoked">Revoked</SelectItem>
              </SelectContent>
            </Select>
            <Select value={productFilter} onValueChange={setProductFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Product" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Products</SelectItem>
                {products?.map(product => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>License Key</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Activations</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLicenses?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No licenses found. Create your first license to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLicenses?.map(license => (
                    <TableRow key={license.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <code className="font-mono text-sm bg-muted px-2 py-1 rounded">
                            {license.license_key}
                          </code>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => copyToClipboard(license.license_key)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{license.customer?.name}</div>
                          <div className="text-sm text-muted-foreground">{license.customer?.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>{license.product?.name}</TableCell>
                      <TableCell>{license.tier?.name}</TableCell>
                      <TableCell>
                        <LicenseStatusBadge status={license.status} />
                      </TableCell>
                      <TableCell>
                        {license.current_activations} / {license.max_activations}
                      </TableCell>
                      <TableCell>
                        {license.expires_at
                          ? new Date(license.expires_at).toLocaleDateString()
                          : 'Never'}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/dashboard/licenses/${license.id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => copyToClipboard(license.license_key)}>
                              <Copy className="mr-2 h-4 w-4" />
                              Copy Key
                            </DropdownMenuItem>
                            {license.status === 'active' && (
                              <DropdownMenuItem onClick={() => updateLicenseStatus(license.id, 'suspended')}>
                                <Ban className="mr-2 h-4 w-4" />
                                Suspend
                              </DropdownMenuItem>
                            )}
                            {license.status === 'suspended' && (
                              <DropdownMenuItem onClick={() => updateLicenseStatus(license.id, 'active')}>
                                <Key className="mr-2 h-4 w-4" />
                                Reactivate
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => renewLicense(license.id, license.expires_at || undefined)}>
                              <Key className="mr-2 h-4 w-4" />
                              Renew expiration
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => deleteLicense(license.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <CreateLicenseDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        products={products || []}
        tiers={tiers || []}
        customers={customers || []}
        onSuccess={() => mutate()}
      />
    </div>
  )
}
