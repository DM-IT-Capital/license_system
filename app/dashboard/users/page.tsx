'use client'

import { useState, FormEvent } from 'react'
import useSWR from 'swr'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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
import { Plus, Search, MoreHorizontal, Pencil, Trash2, Users, Shield, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface AdminUser {
  id: string
  email: string
  name: string | null
  role: 'admin' | 'super_admin'
  created_at: string
  updated_at: string
}

const fetcher = (url: string) => fetch(url).then(res => res.json())

export default function UsersPage() {
  const [search, setSearch] = useState('')
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Create form
  const [newEmail, setNewEmail] = useState('')
  const [newName, setNewName] = useState('')
  const [newRole, setNewRole] = useState<'admin' | 'super_admin'>('admin')
  const [creatingUser, setCreatingUser] = useState(false)

  // Edit form
  const [editName, setEditName] = useState('')
  const [editRole, setEditRole] = useState<'admin' | 'super_admin'>('admin')
  const [savingUser, setSavingUser] = useState(false)

  const { data: users, mutate } = useSWR<AdminUser[]>('/api/users', fetcher)

  const filteredUsers = users?.filter(user => {
    return !search ||
      user.email.toLowerCase().includes(search.toLowerCase()) ||
      user.name?.toLowerCase().includes(search.toLowerCase())
  })

  const handleCreateUser = async (e: FormEvent) => {
    e.preventDefault()
    if (!newEmail || !newRole) {
      toast.error('Email and role are required')
      return
    }

    setCreatingUser(true)
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newEmail,
          name: newName || null,
          role: newRole,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create user')
      }

      toast.success('User created successfully')
      setCreateDialogOpen(false)
      setNewEmail('')
      setNewName('')
      setNewRole('admin')
      mutate()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create user')
    } finally {
      setCreatingUser(false)
    }
  }

  const handleEditUser = (user: AdminUser) => {
    setEditingUser(user)
    setEditName(user.name || '')
    setEditRole(user.role)
    setEditDialogOpen(true)
  }

  const handleUpdateUser = async (e: FormEvent) => {
    e.preventDefault()
    if (!editingUser) return

    setSavingUser(true)
    try {
      const response = await fetch(`/api/users?id=${editingUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName || null,
          role: editRole,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update user')
      }

      toast.success('User updated successfully')
      setEditDialogOpen(false)
      setEditingUser(null)
      setEditName('')
      mutate()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update user')
    } finally {
      setSavingUser(false)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return

    setDeletingId(userId)
    try {
      const response = await fetch(`/api/users?id=${userId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete user')
      }

      toast.success('User deleted successfully')
      mutate()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete user')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Users</h1>
          <p className="text-muted-foreground mt-1">Manage admin users for your system</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add User
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            All Admin Users
          </CardTitle>
          <CardDescription>
            {filteredUsers?.length || 0} admin users registered
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by email or name..."
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
                  <TableHead>Role</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!users ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ) : filteredUsers?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No users found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers?.map(user => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name || '-'}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.role === 'super_admin'
                            ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100'
                        }`}>
                          {user.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                        </span>
                      </TableCell>
                      <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditUser(user)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleDeleteUser(user.id)}
                              disabled={deletingId === user.id}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              {deletingId === user.id ? 'Deleting...' : 'Delete'}
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

      {/* Create User Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <form onSubmit={handleCreateUser}>
            <DialogHeader>
              <DialogTitle>Add Admin User</DialogTitle>
              <DialogDescription>Create a new admin user account.</DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="admin@example.com"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="name">Name (Optional)</Label>
                <Input
                  id="name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="John Doe"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="role">Role</Label>
                <Select value={newRole} onValueChange={(value: any) => setNewRole(value)}>
                  <SelectTrigger id="role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={creatingUser}>
                {creatingUser ? 'Creating...' : 'Create User'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={(open) => {
        if (!open) setEditingUser(null)
        setEditDialogOpen(open)
      }}>
        <DialogContent className="sm:max-w-[500px]">
          <form onSubmit={handleUpdateUser}>
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
              <DialogDescription>Update user details.</DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Email Address</Label>
                <Input value={editingUser?.email || ''} disabled />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-name">Name (Optional)</Label>
                <Input
                  id="edit-name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="John Doe"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-role">Role</Label>
                <Select value={editRole} onValueChange={(value: any) => setEditRole(value)}>
                  <SelectTrigger id="edit-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={savingUser}>
                {savingUser ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
