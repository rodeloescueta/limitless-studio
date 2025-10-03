'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Users as UsersIcon, Plus, Search, Mail, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { toast } from 'sonner'

interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: string
  createdAt: string
}

const roleColors: Record<string, string> = {
  admin: 'bg-red-500',
  strategist: 'bg-purple-500',
  scriptwriter: 'bg-blue-500',
  editor: 'bg-green-500',
  coordinator: 'bg-yellow-500',
  member: 'bg-gray-500',
  client: 'bg-pink-500',
}

export default function UsersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
      
return
    }

    if (session?.user?.role !== 'admin') {
      toast.error('Access denied. Admin role required.')
      router.push('/dashboard')
      
return
    }

    fetchUsers()
  }, [session, status, router])

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users')
      if (!response.ok) throw new Error('Failed to fetch users')
      const data = await response.json()
      setUsers(data)
    } catch (error) {
      console.error('Error fetching users:', error)
      toast.error('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.role.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading users...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage user accounts and permissions
          </p>
        </div>
        <Button onClick={() => router.push('/dashboard/users/new')} size="lg">
          <Plus className="w-4 h-4 mr-2" />
          Add User
        </Button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Badge variant="secondary">
          {filteredUsers.length} {filteredUsers.length === 1 ? 'user' : 'users'}
        </Badge>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>
            View and manage all user accounts in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <UsersIcon className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {searchQuery ? `No users found matching "${searchQuery}"` : 'No users found'}
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback className={roleColors[user.role]}>
                              {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">
                              {user.firstName} {user.lastName}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              ID: {user.id.slice(0, 8)}...
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-muted-foreground" />
                          {user.email}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          <Shield className="w-3 h-3 mr-1" />
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(user.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/dashboard/users/${user.id}`)}
                        >
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Role Legend */}
      <Card>
        <CardHeader>
          <CardTitle>Role Descriptions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex items-start gap-3">
              <div className={`w-3 h-3 rounded-full ${roleColors.admin} mt-1`} />
              <div>
                <div className="font-medium">Admin</div>
                <div className="text-sm text-muted-foreground">Full system access</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className={`w-3 h-3 rounded-full ${roleColors.strategist} mt-1`} />
              <div>
                <div className="font-medium">Strategist</div>
                <div className="text-sm text-muted-foreground">Comment/approve all stages</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className={`w-3 h-3 rounded-full ${roleColors.scriptwriter} mt-1`} />
              <div>
                <div className="font-medium">Scriptwriter</div>
                <div className="text-sm text-muted-foreground">Research & Envision stages</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className={`w-3 h-3 rounded-full ${roleColors.editor} mt-1`} />
              <div>
                <div className="font-medium">Editor</div>
                <div className="text-sm text-muted-foreground">Assemble & Connect stages</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className={`w-3 h-3 rounded-full ${roleColors.coordinator} mt-1`} />
              <div>
                <div className="font-medium">Coordinator</div>
                <div className="text-sm text-muted-foreground">Connect & Hone stages</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className={`w-3 h-3 rounded-full ${roleColors.member} mt-1`} />
              <div>
                <div className="font-medium">Member</div>
                <div className="text-sm text-muted-foreground">Basic collaboration</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className={`w-3 h-3 rounded-full ${roleColors.client} mt-1`} />
              <div>
                <div className="font-medium">Client</div>
                <div className="text-sm text-muted-foreground">Approve in Connect stage</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}