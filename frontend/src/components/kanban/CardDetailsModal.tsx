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
      <DialogContent className="max-w-4xl h-[80vh] overflow-hidden">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <DialogTitle className="text-lg font-semibold flex-1">
              {card.title}
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Badge className={priorityColors[card.priority]}>
                {card.priority}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDelete}
                disabled={deleteCard.isPending}
              >
                <TrashIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <div className="mt-4 overflow-y-auto flex-1">
            <TabsContent value="overview" className="space-y-6">
              {/* Card Info */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Created by</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={card.createdBy.avatar} />
                      <AvatarFallback className="text-xs">
                        {card.createdBy.firstName[0]}{card.createdBy.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <span>{card.createdBy.firstName} {card.createdBy.lastName}</span>
                  </div>
                </div>

                <div>
                  <p className="text-gray-600">Stage</p>
                  <p className="font-medium mt-1">{card.stage.name}</p>
                </div>

                {card.assignedTo && (
                  <div>
                    <p className="text-gray-600">Assigned to</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={card.assignedTo.avatar} />
                        <AvatarFallback className="text-xs">
                          {card.assignedTo.firstName[0]}{card.assignedTo.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <span>{card.assignedTo.firstName} {card.assignedTo.lastName}</span>
                    </div>
                  </div>
                )}

                {card.dueDate && (
                  <div>
                    <p className="text-gray-600">Due date</p>
                    <div className="flex items-center gap-1 mt-1">
                      <CalendarIcon className="h-4 w-4" />
                      <span>{format(new Date(card.dueDate), 'MMM d, yyyy')}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Tags */}
              {tags && tags.length > 0 && (
                <div>
                  <p className="text-gray-600 text-sm mb-2">Tags</p>
                  <div className="flex flex-wrap gap-1">
                    {tags.map((tag: string, index: number) => (
                      <Badge key={index} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Edit Form */}
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
            </TabsContent>

            <TabsContent value="content">
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
            </TabsContent>

            <TabsContent value="activity">
              <div className="text-center py-8 text-gray-500">
                <p>Activity tracking coming soon...</p>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}