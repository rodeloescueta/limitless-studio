'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Building2, Plus, Search } from 'lucide-react'
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
import { ClientOnboardingWizard } from '@/components/clients/ClientOnboardingWizard'
import { toast } from 'sonner'

interface Client {
  team: {
    id: string
    name: string
    clientCompanyName?: string
    industry?: string
    contactEmail?: string
    description?: string
    createdAt: string
  }
  profile?: {
    contentPillars?: string[]
  }
}

export default function ClientsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [showWizard, setShowWizard] = useState(false)
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

    fetchClients()
  }, [session, status, router])

  const fetchClients = async () => {
    try {
      const response = await fetch('/api/clients')
      if (!response.ok) throw new Error('Failed to fetch clients')
      const data = await response.json()
      setClients(data)
    } catch (error) {
      console.error('Error fetching clients:', error)
      toast.error('Failed to load clients')
    } finally {
      setLoading(false)
    }
  }

  const filteredClients = clients.filter(client =>
    client.team.clientCompanyName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.team.industry?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading clients...</p>
        </div>
      </div>
    )
  }

  if (showWizard) {
    return (
      <div className="max-w-4xl mx-auto">
        <ClientOnboardingWizard
          onSuccess={(clientId) => {
            setShowWizard(false)
            fetchClients()
            toast.success('Client created successfully!')
          }}
          onCancel={() => setShowWizard(false)}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Client Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage your client profiles and teams
          </p>
        </div>
        <Button onClick={() => setShowWizard(true)} size="lg">
          <Plus className="w-4 h-4 mr-2" />
          New Client
        </Button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search clients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Badge variant="secondary">
          {filteredClients.length} {filteredClients.length === 1 ? 'client' : 'clients'}
        </Badge>
      </div>

      {/* Client Grid */}
      {filteredClients.length === 0 && searchQuery === '' ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="p-4 rounded-full bg-primary/10 mb-4">
              <Building2 className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No clients yet</h3>
            <p className="text-muted-foreground text-center mb-4 max-w-md">
              Get started by creating your first client profile with brand guidelines and project details.
            </p>
            <Button onClick={() => setShowWizard(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create First Client
            </Button>
          </CardContent>
        </Card>
      ) : filteredClients.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <p className="text-muted-foreground">No clients found matching "{searchQuery}"</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClients.map((client) => (
            <Card
              key={client.team.id}
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => router.push(`/dashboard?team=${client.team.id}`)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Building2 className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">
                        {client.team.clientCompanyName || client.team.name}
                      </CardTitle>
                      {client.team.industry && (
                        <Badge variant="secondary" className="mt-1">
                          {client.team.industry}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {client.team.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                    {client.team.description}
                  </p>
                )}

                {client.profile?.contentPillars && client.profile.contentPillars.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Content Pillars</p>
                    <div className="flex flex-wrap gap-1">
                      {client.profile.contentPillars.slice(0, 3).map((pillar, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {pillar}
                        </Badge>
                      ))}
                      {client.profile.contentPillars.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{client.profile.contentPillars.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {client.team.contactEmail && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-xs text-muted-foreground">{client.team.contactEmail}</p>
                  </div>
                )}

                <div className="mt-4 pt-4 border-t">
                  <p className="text-xs text-muted-foreground">
                    Created {new Date(client.team.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}