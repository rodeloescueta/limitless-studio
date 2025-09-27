'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useUserTeams } from '@/lib/hooks/useTeams'
import { KanbanBoard } from '@/components/kanban/KanbanBoard'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { TeamSelectionScreen } from '@/components/dashboard/TeamSelectionScreen'
import { Skeleton } from '@/components/ui/skeleton'

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null)

  const { data: userTeams, isLoading: teamsLoading } = useUserTeams()

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  // Auto-select first team or user's primary team
  useEffect(() => {
    if (userTeams && userTeams.length > 0 && !selectedTeamId) {
      setSelectedTeamId(userTeams[0].id)
    }
  }, [userTeams, selectedTeamId])

  // Show loading while checking authentication
  if (status === 'loading') {
    return <DashboardSkeleton />
  }

  // Show loading while fetching teams
  if (teamsLoading) {
    return <DashboardSkeleton />
  }

  // Redirect if not authenticated
  if (status === 'unauthenticated') {
    return null
  }

  // Show team selection if no teams available
  if (!userTeams || userTeams.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground mb-2">No Teams Available</h2>
          <p className="text-muted-foreground">
            You're not a member of any teams yet. Contact your administrator to get access.
          </p>
        </div>
      </div>
    )
  }

  // Show team selection if no team is selected
  if (!selectedTeamId) {
    return (
      <TeamSelectionScreen
        teams={userTeams}
        onSelect={setSelectedTeamId}
      />
    )
  }

  return (
    <div className="flex flex-col h-screen">
      <DashboardHeader
        selectedTeamId={selectedTeamId}
        teams={userTeams}
        onTeamChange={setSelectedTeamId}
      />

      <main className="flex-1 overflow-hidden">
        <KanbanBoard teamId={selectedTeamId} />
      </main>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-col h-screen">
      {/* Header skeleton */}
      <div className="border-b bg-background px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-10 w-48" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-9 rounded-full" />
          </div>
        </div>
      </div>

      {/* Board skeleton */}
      <div className="flex gap-6 p-6 overflow-x-auto min-h-screen bg-background">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="w-80 bg-card rounded-lg shadow-sm border">
            <div className="p-4 border-b">
              <Skeleton className="h-6 w-24 mb-2" />
              <Skeleton className="h-4 w-16" />
            </div>
            <div className="p-4 space-y-3">
              {[1, 2, 3].map((j) => (
                <Skeleton key={j} className="h-32 w-full" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}