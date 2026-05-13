'use client'

import { useState, FormEvent } from 'react'
import useSWR from 'swr'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
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
import { CreateCustomerDialog } from '@/components/dashboard/create-customer-dialog'
import { Plus, Search, MoreHorizontal, Eye, Mail, Trash2, Users, Pencil, Loader2 } from 'lucide-react'
import type { Customer } from '@/lib/types'
import { toast } from 'sonner'
import Link from 'next/link'

const fetcher = (url: string) => fetch(url).then(res => res.json())

export default function CustomersPage() {
  const [search, setSearch] = useState('')
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Edit form
  const [editName, setEditName] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editCompany, setEditCompany] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [editNotes, setEditNotes] = useState('')
  const [savingCustomer, setSavingCustomer] = useState(false)

  const { data: customers, mutate } = useSWR<(Customer & { licenses: { count: number }[] })[]>('/api/customers', fetcher)

  const filteredCustomers = customers?.filter(customer => {
    return !search || 
      customer.name.toLowerCase().includes(search.toLowerCase()) ||
      customer.email.toLowerCase().includes(search.toLowerCase()) ||
      customer.company?.toLowerCase().includes(search.toLowerCase())
  })

  const openEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer)
    setEditName(customer.name)
    setEditEmail(customer.email)
    setEditCompany(customer.company || '')
    setEditPhone(customer.phone || '')
    setEditNotes(customer.notes || '')
    setEditDialogOpen(true)
  }

  const handleUpdateCustomer = async (e: FormEvent) => {
    e.preventDefault()
    if (!editingCustomer) return

    setSavingCustomer(true)
    try {
      const response = await fetch(`/api/customers/${editingCustomer.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName,
          email: editEmail,
          company: editCompany || null,
          phone: editPhone || null,
          notes: editNotes || null,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update customer')
      }

      toast.success('Customer updated successfully')
      setEditDialogOpen(false)
      setEditingCustomer(null)
      mutate()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update customer')
    } finally {
      setSavingCustomer(false)
    }
  }

  const deleteCustomer = async (id: string) => {
    if (!confirm('Are you sure you want to delete this customer? This will also delete all their licenses.')) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/customers/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      toast.success('Customer deleted')
      mutate()
    } catch {
      toast.error('Failed to delete customer')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Customers</h1>
          <p className="text-muted-foreground mt-1">Manage your customer database</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Customer
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            All Customers
          </CardTitle>
          <CardDescription>
            {filteredCustomers?.length || 0} customers registered
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email or company..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 max-w-md"
            />
          </div>

          {/* Table */}
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Licenses</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No customers found. Add your first customer to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCustomers?.map(customer => (
                    <TableRow key={customer.id}>
                      <TableCell className="font-medium">{customer.name}</TableCell>
                      <TableCell>
                        <a href={`mailto:${customer.email}`} className="text-primary hover:underline">
                          {customer.email}
                        </a>
                      </TableCell>
                      <TableCell>{customer.company || '-'}</TableCell>
                      <TableCell>{customer.phone || '-'}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center justify-center h-6 px-2 rounded-full bg-primary/10 text-primary text-xs font-medium">
                          {customer.licenses?.[0]?.count || 0}
                        </span>
                      </TableCell>
                      <TableCell>{new Date(customer.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/dashboard/customers/${customer.id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEditCustomer(customer)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <a href={`mailto:${customer.email}`}>
                                <Mail className="mr-2 h-4 w-4" />
                                Send Email
                              </a>
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => deleteCustomer(customer.id)}
                              disabled={deletingId === customer.id}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              {deletingId === customer.id ? 'Deleting...' : 'Delete'}
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

      <Dialog open={editDialogOpen} onOpenChange={(open) => {
        if (!open) setEditingCustomer(null)
        setEditDialogOpen(open)
      }}>
        <DialogContent className="sm:max-w-[500px]">
          <form onSubmit={handleUpdateCustomer}>
            <DialogHeader>
              <DialogTitle>Edit Customer</DialogTitle>
              <DialogDescription>Update customer details.</DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="customer-name">Name</Label>
                <Input
                  id="customer-name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="customer-email">Email</Label>
                <Input
                  id="customer-email"
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="customer-company">Company</Label>
                <Input
                  id="customer-company"
                  value={editCompany}
                  onChange={(e) => setEditCompany(e.target.value)}
                  placeholder="Optional"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="customer-phone">Phone</Label>
                <Input
                  id="customer-phone"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  placeholder="Optional"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="customer-notes">Notes</Label>
                <Textarea
                  id="customer-notes"
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Optional"
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={savingCustomer}>
                {savingCustomer ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <CreateCustomerDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={() => mutate()}
      />
    </div>
  )
}
