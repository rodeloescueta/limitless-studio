'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Building2, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
} from '@/components/ui/card'
import { ClientOnboardingWizard } from '@/components/clients/ClientOnboardingWizard'
import { ClientsDataTable, type Client } from '@/components/clients/ClientsDataTable'
import { toast } from 'sonner'

export default function ClientsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [showWizard, setShowWizard] = useState(false)

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

      {/* Client Table */}
      {clients.length === 0 ? (
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
      ) : (
        <ClientsDataTable clients={clients} />
      )}
    </div>
  )
}