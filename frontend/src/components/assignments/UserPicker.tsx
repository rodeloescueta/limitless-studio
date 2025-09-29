'use client'

import { useState } from 'react'
import { Check, ChevronsUpDown, UserPlus } from 'lucide-react'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { TeamMember } from '@/lib/api-client'

interface UserPickerProps {
  users: TeamMember[]
  selectedUserId?: string
  onSelect: (userId: string) => void
  disabled?: boolean
  placeholder?: string
  className?: string
}

export function UserPicker({
  users,
  selectedUserId,
  onSelect,
  disabled = false,
  placeholder = "Select user...",
  className
}: UserPickerProps) {
  const [open, setOpen] = useState(false)

  const selectedUser = users.find(user => user.id === selectedUserId)

  const getRoleBadgeColor = (role: string) => {
    const colors = {
      admin: 'bg-purple-100 text-purple-800',
      strategist: 'bg-blue-100 text-blue-800',
      scriptwriter: 'bg-green-100 text-green-800',
      editor: 'bg-orange-100 text-orange-800',
      coordinator: 'bg-yellow-100 text-yellow-800',
      member: 'bg-gray-100 text-gray-800',
      client: 'bg-pink-100 text-pink-800',
    }
    return colors[role as keyof typeof colors] || colors.member
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("justify-between", className)}
          disabled={disabled}
        >
          {selectedUser ? (
            <div className="flex items-center gap-2">
              <Avatar className="h-5 w-5">
                <AvatarImage src={selectedUser.avatar} />
                <AvatarFallback className="text-xs">
                  {selectedUser.firstName[0]}{selectedUser.lastName[0]}
                </AvatarFallback>
              </Avatar>
              <span className="truncate">
                {selectedUser.firstName} {selectedUser.lastName}
              </span>
              <Badge className={cn("text-xs", getRoleBadgeColor(selectedUser.role))}>
                {selectedUser.role}
              </Badge>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-muted-foreground">
              <UserPlus className="h-4 w-4" />
              {placeholder}
            </div>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0">
        <Command>
          <CommandInput placeholder="Search team members..." />
          <CommandList>
            <CommandEmpty>No users found.</CommandEmpty>
            <CommandGroup>
              {users.map((user) => (
                <CommandItem
                  key={user.id}
                  value={`${user.firstName} ${user.lastName} ${user.email} ${user.role}`}
                  onSelect={() => {
                    onSelect(user.id)
                    setOpen(false)
                  }}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback className="text-sm">
                          {user.firstName[0]}{user.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">
                          {user.firstName} {user.lastName}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {user.email}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={cn("text-xs", getRoleBadgeColor(user.role))}>
                        {user.role}
                      </Badge>
                      <Check
                        className={cn(
                          "h-4 w-4",
                          selectedUserId === user.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}