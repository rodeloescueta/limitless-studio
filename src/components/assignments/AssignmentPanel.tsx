'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Calendar, Plus, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { UserPicker } from './UserPicker'
import { AssigneeList } from './AssigneeList'
import { useCardAssignments, useTeamMembers, useAssignUser, useUnassignUser, useUpdateAssignment } from '@/lib/hooks/useAssignments'
import { toast } from 'sonner'

const createAssignmentSchema = z.object({
  assignedTo: z.string().min(1, 'Please select a user'),
  role: z.enum(['primary', 'reviewer', 'approver', 'collaborator']),
  dueDate: z.string().optional(),
  notes: z.string().optional(),
})

type CreateAssignmentFormData = z.infer<typeof createAssignmentSchema>

interface AssignmentPanelProps {
  cardId: string
  teamId: string
  readonly?: boolean
}

export function AssignmentPanel({ cardId, teamId, readonly = false }: AssignmentPanelProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const { data: assignments = [], isLoading: assignmentsLoading } = useCardAssignments(cardId)
  const { data: teamMembers = [], isLoading: membersLoading } = useTeamMembers(teamId)
  const assignUser = useAssignUser()
  const unassignUser = useUnassignUser()
  const updateAssignment = useUpdateAssignment()

  const form = useForm<CreateAssignmentFormData>({
    resolver: zodResolver(createAssignmentSchema),
    defaultValues: {
      role: 'primary',
    },
  })

  // Filter out already assigned users
  const assignedUserIds = assignments.map(a => a.assignedTo.id)
  const availableUsers = teamMembers.filter(member => !assignedUserIds.includes(member.id))

  const onSubmit = async (data: CreateAssignmentFormData) => {
    try {
      await assignUser.mutateAsync({
        cardId,
        data: {
          ...data,
          dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : undefined,
        },
      })

      toast.success('User assigned successfully')
      form.reset()
      setIsDialogOpen(false)
    } catch (error) {
      toast.error('Failed to assign user')
      console.error('Assignment error:', error)
    }
  }

  const handleUnassign = async (assignmentId: string) => {
    try {
      await unassignUser.mutateAsync(assignmentId)
      toast.success('User unassigned successfully')
    } catch (error) {
      toast.error('Failed to unassign user')
      console.error('Unassignment error:', error)
    }
  }

  const handleToggleComplete = async (assignmentId: string, completed: boolean) => {
    try {
      await updateAssignment.mutateAsync({
        assignmentId,
        data: { completed },
      })
      toast.success(completed ? 'Assignment marked as completed' : 'Assignment marked as incomplete')
    } catch (error) {
      toast.error('Failed to update assignment')
      console.error('Update error:', error)
    }
  }

  if (assignmentsLoading || membersLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Assignments
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-10 w-32" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Assignments ({assignments.length})
          </CardTitle>
          {!readonly && availableUsers.length > 0 && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Assign User
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Assign Team Member</DialogTitle>
                </DialogHeader>

                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="assignedTo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Team Member</FormLabel>
                          <FormControl>
                            <UserPicker
                              users={availableUsers}
                              selectedUserId={field.value}
                              onSelect={field.onChange}
                              placeholder="Select a team member..."
                              className="w-full"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="role"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Assignment Role</FormLabel>
                          <FormControl>
                            <Select value={field.value} onValueChange={field.onChange}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="primary">Primary</SelectItem>
                                <SelectItem value="reviewer">Reviewer</SelectItem>
                                <SelectItem value="approver">Approver</SelectItem>
                                <SelectItem value="collaborator">Collaborator</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="dueDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Due Date (Optional)</FormLabel>
                          <FormControl>
                            <Input
                              type="datetime-local"
                              {...field}
                              min={new Date().toISOString().slice(0, 16)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notes (Optional)</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Add any notes or instructions..."
                              rows={3}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end gap-2 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={assignUser.isPending}>
                        {assignUser.isPending ? 'Assigning...' : 'Assign User'}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <AssigneeList
          assignments={assignments}
          onUnassign={readonly ? undefined : handleUnassign}
          onToggleComplete={readonly ? undefined : handleToggleComplete}
          readonly={readonly}
        />
      </CardContent>
    </Card>
  )
}