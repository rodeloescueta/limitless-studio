'use client'

import { format } from 'date-fns'
import { Calendar, Check, X, UserX } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { Assignment } from '@/lib/api-client'

interface AssigneeListProps {
  assignments: Assignment[]
  onUnassign?: (assignmentId: string) => void
  onToggleComplete?: (assignmentId: string, completed: boolean) => void
  readonly?: boolean
  className?: string
}

export function AssigneeList({
  assignments,
  onUnassign,
  onToggleComplete,
  readonly = false,
  className
}: AssigneeListProps) {
  if (!assignments || assignments.length === 0) {
    return (
      <div className={cn("text-center text-muted-foreground py-8", className)}>
        <UserX className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>No assignments yet</p>
        <p className="text-sm">Add team members to get started</p>
      </div>
    )
  }

  const getRoleColor = (role: string) => {
    const colors = {
      primary: 'bg-blue-100 text-blue-800',
      reviewer: 'bg-green-100 text-green-800',
      approver: 'bg-purple-100 text-purple-800',
      collaborator: 'bg-orange-100 text-orange-800',
    }
    
return colors[role as keyof typeof colors] || colors.primary
  }

  const getUserRoleColor = (role: string) => {
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
    <div className={cn("space-y-3", className)}>
      {assignments.map((assignment) => (
        <Card key={assignment.id} className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3 flex-1">
                <Avatar className="h-10 w-10 mt-1">
                  <AvatarImage src={assignment.assignedTo.avatar} />
                  <AvatarFallback>
                    {assignment.assignedTo.firstName[0]}{assignment.assignedTo.lastName[0]}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium truncate">
                      {assignment.assignedTo.firstName} {assignment.assignedTo.lastName}
                    </h4>
                    <Badge className={cn("text-xs", getUserRoleColor(assignment.assignedTo.role))}>
                      {assignment.assignedTo.role}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className={getRoleColor(assignment.role)}>
                      {assignment.role}
                    </Badge>
                    {assignment.completedAt && (
                      <Badge className="bg-green-100 text-green-800">
                        <Check className="h-3 w-3 mr-1" />
                        Completed
                      </Badge>
                    )}
                  </div>

                  <div className="text-sm text-muted-foreground space-y-1">
                    <div>
                      Assigned {format(new Date(assignment.assignedAt), 'MMM d, yyyy')}
                    </div>

                    {assignment.dueDate && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Due {format(new Date(assignment.dueDate), 'MMM d, yyyy')}
                      </div>
                    )}

                    {assignment.notes && (
                      <div className="text-xs italic mt-2 p-2 bg-gray-50 rounded">
                        "{assignment.notes}"
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {!readonly && (
                <div className="flex items-center gap-1 ml-2">
                  <TooltipProvider>
                    {onToggleComplete && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onToggleComplete(assignment.id, !assignment.completedAt)}
                            className={cn(
                              "h-8 w-8 p-0",
                              assignment.completedAt
                                ? "text-green-600 hover:text-green-700"
                                : "text-gray-400 hover:text-green-600"
                            )}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          {assignment.completedAt ? 'Mark as incomplete' : 'Mark as complete'}
                        </TooltipContent>
                      </Tooltip>
                    )}

                    {onUnassign && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onUnassign(assignment.id)}
                            className="h-8 w-8 p-0 text-red-400 hover:text-red-600"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          Remove assignment
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </TooltipProvider>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}