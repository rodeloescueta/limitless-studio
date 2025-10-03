'use client'

import { useState, useEffect } from 'react'
import { useUserTeams } from '@/lib/hooks/useTeams'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Loader2 } from 'lucide-react'

interface MentionPickerProps {
  query: string
  onSelect: (userId: string, userName: string) => void
  onClose: () => void
}

interface TeamMember {
  id: string
  firstName: string
  lastName: string
  email: string
  avatar?: string
}

export function MentionPicker({ query, onSelect, onClose }: MentionPickerProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const { data: teams = [], isLoading } = useUserTeams()

  // Extract all team members from all teams
  const allMembers: TeamMember[] = teams.flatMap(team =>
    (team as any).members?.map((member: any) => member.user) || []
  )

  // Remove duplicates based on user ID
  const uniqueMembers = allMembers.filter((member, index, array) =>
    array.findIndex(m => m.id === member.id) === index
  )

  // Filter members based on query
  const filteredMembers = uniqueMembers.filter(member => {
    const fullName = `${member.firstName} ${member.lastName}`.toLowerCase()
    const email = member.email.toLowerCase()
    const searchQuery = query.toLowerCase()

    return fullName.includes(searchQuery) || email.includes(searchQuery)
  })

  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex(prev => Math.min(prev + 1, filteredMembers.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex(prev => Math.max(prev - 1, 0))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        if (filteredMembers[selectedIndex]) {
          const member = filteredMembers[selectedIndex]
          onSelect(member.id, `${member.firstName} ${member.lastName}`)
        }
      } else if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    
return () => document.removeEventListener('keydown', handleKeyDown)
  }, [filteredMembers, selectedIndex, onSelect, onClose])

  if (isLoading) {
    return (
      <div className="absolute top-full left-0 z-50 w-full mt-1 bg-popover border rounded-md shadow-md p-4">
        <div className="flex items-center justify-center">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="ml-2 text-sm">Loading team members...</span>
        </div>
      </div>
    )
  }

  if (filteredMembers.length === 0) {
    return (
      <div className="absolute top-full left-0 z-50 w-full mt-1 bg-popover border rounded-md shadow-md p-4">
        <div className="text-sm text-muted-foreground text-center">
          No team members found
        </div>
      </div>
    )
  }

  const getUserInitials = (firstName: string, lastName: string) => {
    return `${firstName[0]}${lastName[0]}`.toUpperCase()
  }

  return (
    <div className="absolute top-full left-0 z-50 w-full mt-1 bg-popover border rounded-md shadow-md max-h-48 overflow-y-auto">
      {filteredMembers.map((member, index) => (
        <button
          key={member.id}
          type="button"
          className={`w-full flex items-center gap-3 p-3 text-left hover:bg-accent transition-colors ${
            index === selectedIndex ? 'bg-accent' : ''
          }`}
          onClick={() => onSelect(member.id, `${member.firstName} ${member.lastName}`)}
        >
          <Avatar className="h-8 w-8">
            <AvatarImage src={member.avatar} />
            <AvatarFallback className="text-xs">
              {getUserInitials(member.firstName, member.lastName)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm">
              {member.firstName} {member.lastName}
            </div>
            <div className="text-xs text-muted-foreground truncate">
              {member.email}
            </div>
          </div>
        </button>
      ))}
    </div>
  )
}