'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
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
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { useCardDetails, useUpdateCard, useDeleteCard } from '@/lib/hooks/useCards'
import { CommentsPanel } from '@/components/comments/CommentsPanel'
import { AttachmentsPanel } from '@/components/attachments/AttachmentsPanel'
import { AssignmentPanel } from '@/components/assignments/AssignmentPanel'
import { CardHistoryPanel } from '@/components/audit/CardHistoryPanel'
import { RoleGate, EditAccess, usePermissions } from '@/components/auth/RoleGate'
import { format } from 'date-fns'
import { CalendarIcon, TrashIcon } from 'lucide-react'

const updateCardSchema = z.object({
  title: z.string().min(1, 'Title is required').max(300),
  description: z.string().optional(),
  content: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
})

type UpdateCardFormData = z.infer<typeof updateCardSchema>

interface CardDetailsModalProps {
  cardId: string | null
  isOpen: boolean
  onClose: () => void
}

export function CardDetailsModal({ cardId, isOpen, onClose }: CardDetailsModalProps) {
  const [activeTab, setActiveTab] = useState('overview')
  const { data: card, isLoading } = useCardDetails(cardId || '')
  const updateCard = useUpdateCard()
  const deleteCard = useDeleteCard()
  const permissions = usePermissions()

  const form = useForm<UpdateCardFormData>({
    resolver: zodResolver(updateCardSchema),
    values: card ? {
      title: card.title,
      description: card.description || '',
      content: card.content || '',
      priority: card.priority,
    } : undefined,
  })

  const priorityColors = {
    low: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-orange-100 text-orange-800',
    urgent: 'bg-red-100 text-red-800',
  }

  const onSubmit = async (data: UpdateCardFormData) => {
    if (!cardId) return

    try {
      await updateCard.mutateAsync({
        cardId,
        data,
      })
    } catch (error) {
      console.error('Failed to update card:', error)
    }
  }

  const handleDelete = async () => {
    if (!cardId || !confirm('Are you sure you want to delete this card?')) return

    try {
      await deleteCard.mutateAsync(cardId)
      onClose()
    } catch (error) {
      console.error('Failed to delete card:', error)
    }
  }

  if (!isOpen || !cardId) return null

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl h-[80vh] overflow-hidden">
          <div className="space-y-4">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (!card) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <div className="text-center py-8">
            <p>Card not found</p>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  const tags = card.tags ? (typeof card.tags === 'string' ? JSON.parse(card.tags) : card.tags) : []

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl h-[85vh] overflow-hidden">
        <DialogHeader>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1">
              <Badge variant="outline" className="text-xs font-normal">
                {card.contentType || 'Blog'}
              </Badge>
              <Badge
                className="text-xs font-normal"
                style={{
                  backgroundColor: card.stage?.color || '#6b7280',
                  color: 'white'
                }}
              >
                {card.stage?.name || 'Unknown'}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={priorityColors[card.priority]}>
                {card.priority}
              </Badge>
              <RoleGate stage={card.stage?.name || ''} action="delete">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDelete}
                  disabled={deleteCard.isPending}
                >
                  <TrashIcon className="h-4 w-4" />
                </Button>
              </RoleGate>
            </div>
          </div>
          <DialogTitle className="text-2xl font-semibold mt-2">
            {card.title}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="assignments">Assignments</TabsTrigger>
            <TabsTrigger value="comments">Comments</TabsTrigger>
            <TabsTrigger value="attachments">Attachments</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <div className="mt-4 overflow-y-auto flex-1">
            <TabsContent value="overview" className="m-0 p-0">
              <div className="grid grid-cols-3 gap-6">
                {/* Main Content Area - 2 columns */}
                <div className="col-span-2 space-y-6">
                  {/* Description Section */}
                  <div>
                    <h3 className="text-sm font-semibold text-foreground mb-3">Description</h3>
                    {card.description ? (
                      <p className="text-sm text-muted-foreground leading-relaxed">{card.description}</p>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">No description provided</p>
                    )}
                  </div>

                  {/* Notes Section */}
                  {card.content && (
                    <div className="bg-accent/50 rounded-lg p-4 border">
                      <h3 className="text-sm font-semibold text-foreground mb-2">Notes</h3>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{card.content}</p>
                    </div>
                  )}

                  {/* Edit Form - Only visible with edit access */}
                  <EditAccess stage={card.stage?.name || ''} fallback={null}>
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                          control={form.control}
                          name="title"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Title</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Description</FormLabel>
                              <FormControl>
                                <Textarea rows={3} {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="priority"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Priority</FormLabel>
                              <FormControl>
                                <Select value={field.value} onValueChange={field.onChange}>
                                  <SelectTrigger className="w-32">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="low">Low</SelectItem>
                                    <SelectItem value="medium">Medium</SelectItem>
                                    <SelectItem value="high">High</SelectItem>
                                    <SelectItem value="urgent">Urgent</SelectItem>
                                  </SelectContent>
                                </Select>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                          >
                            Close
                          </Button>
                          <Button
                            type="submit"
                            disabled={updateCard.isPending}
                          >
                            {updateCard.isPending ? 'Saving...' : 'Save Changes'}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </EditAccess>
                </div>

                {/* Sidebar - 1 column */}
                <div className="space-y-4">
                  {/* Metadata */}
                  <div className="bg-muted/50 rounded-lg p-4 space-y-3 text-sm">
                    <div>
                      <p className="text-muted-foreground text-xs mb-1">Created by</p>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={card.createdBy.avatar} />
                          <AvatarFallback className="text-xs">
                            {card.createdBy.firstName[0]}{card.createdBy.lastName[0]}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-foreground">{card.createdBy.firstName} {card.createdBy.lastName}</span>
                      </div>
                    </div>

                    {card.assignedTo && (
                      <div>
                        <p className="text-muted-foreground text-xs mb-1">Assigned to</p>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={card.assignedTo.avatar} />
                            <AvatarFallback className="text-xs">
                              {card.assignedTo.firstName[0]}{card.assignedTo.lastName[0]}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-foreground">{card.assignedTo.firstName} {card.assignedTo.lastName}</span>
                        </div>
                      </div>
                    )}

                    {card.dueDate && (
                      <div>
                        <p className="text-muted-foreground text-xs mb-1">Due date</p>
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                          <span className="text-foreground">{format(new Date(card.dueDate), 'MMM d, yyyy')}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Tags */}
                  {tags && tags.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-foreground mb-2">Tags</h3>
                      <div className="flex flex-wrap gap-1">
                        {tags.map((tag: string, index: number) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="content">
              <EditAccess stage={card.stage?.name || ''} fallback={
                <div>
                  <label className="text-sm font-medium">Content</label>
                  <div className="mt-2 p-4 bg-gray-50 rounded border min-h-[300px] whitespace-pre-wrap">
                    {card.content || 'No content added yet'}
                  </div>
                </div>
              }>
                <Form {...form}>
                  <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Content</FormLabel>
                        <FormControl>
                          <Textarea
                            rows={15}
                            placeholder="Add content details, scripts, notes..."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end gap-2 mt-4">
                    <Button
                      type="button"
                      onClick={form.handleSubmit(onSubmit)}
                      disabled={updateCard.isPending}
                    >
                      {updateCard.isPending ? 'Saving...' : 'Save Content'}
                    </Button>
                  </div>
                </Form>
              </EditAccess>
            </TabsContent>

            <TabsContent value="assignments" className="h-full">
              <AssignmentPanel
                cardId={cardId}
                teamId={card.teamId}
                readonly={!permissions.canAssign(card.stage?.name || '')}
              />
            </TabsContent>

            <TabsContent value="comments" className="h-full">
              <CommentsPanel cardId={cardId} />
            </TabsContent>

            <TabsContent value="attachments" className="h-full">
              <AttachmentsPanel cardId={cardId} />
            </TabsContent>

            <TabsContent value="history" className="h-full">
              <CardHistoryPanel cardId={cardId} />
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}