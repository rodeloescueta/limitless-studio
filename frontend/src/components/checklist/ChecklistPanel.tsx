'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CheckSquare, Square, Plus, Trash2, CheckCircle2, Clock } from 'lucide-react'
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
  FormDescription,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  useCardChecklist,
  useCreateChecklistItem,
  useToggleChecklistItem,
  useDeleteChecklistItem,
} from '@/lib/hooks/useChecklist'
import { formatDistanceToNow } from 'date-fns'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const createChecklistItemSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().optional(),
})

type CreateChecklistItemFormData = z.infer<typeof createChecklistItemSchema>

interface ChecklistPanelProps {
  cardId: string
  readonly?: boolean
}

export function ChecklistPanel({ cardId, readonly = false }: ChecklistPanelProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const { data: checklistItems = [], isLoading } = useCardChecklist(cardId)
  const createItem = useCreateChecklistItem()
  const toggleItem = useToggleChecklistItem()
  const deleteItem = useDeleteChecklistItem()

  const form = useForm<CreateChecklistItemFormData>({
    resolver: zodResolver(createChecklistItemSchema),
    defaultValues: {
      title: '',
      description: '',
    },
  })

  // Calculate progress
  const completedCount = checklistItems.filter(item => item.isCompleted).length
  const totalCount = checklistItems.length
  const progressPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  const onSubmit = async (data: CreateChecklistItemFormData) => {
    try {
      await createItem.mutateAsync({
        cardId,
        data,
      })

      toast.success('Checklist item added')
      form.reset()
      setIsDialogOpen(false)
    } catch (error) {
      toast.error('Failed to add checklist item')
      console.error('Create checklist item error:', error)
    }
  }

  const handleToggle = async (itemId: string, currentStatus: boolean) => {
    try {
      await toggleItem.mutateAsync({
        cardId,
        itemId,
        isCompleted: !currentStatus,
      })
    } catch (error) {
      toast.error('Failed to update checklist item')
      console.error('Toggle checklist item error:', error)
    }
  }

  const handleDelete = async (itemId: string, isCustom: boolean) => {
    if (!isCustom) {
      toast.error('Cannot delete template-based items')
      
return
    }

    try {
      await deleteItem.mutateAsync({ cardId, itemId })
      toast.success('Checklist item deleted')
    } catch (error) {
      toast.error('Failed to delete checklist item')
      console.error('Delete checklist item error:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Progress */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <CheckSquare className="h-5 w-5 text-primary" />
            Deliverables Checklist
          </h3>
          <p className="text-sm text-muted-foreground">
            Track stage-specific deliverables and custom tasks
          </p>
        </div>

        {!readonly && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Add Custom Item
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Custom Checklist Item</DialogTitle>
              </DialogHeader>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title *</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Enter checklist item title..."
                            maxLength={200}
                          />
                        </FormControl>
                        <FormDescription>
                          A clear, concise title for this deliverable
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description (optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Add additional details..."
                            rows={3}
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
                    <Button type="submit" disabled={createItem.isPending}>
                      {createItem.isPending ? 'Adding...' : 'Add Item'}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Progress Bar */}
      {totalCount > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-muted-foreground">Progress</span>
                <span className="font-semibold text-foreground">
                  {completedCount}/{totalCount} completed ({progressPercentage}%)
                </span>
              </div>
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Checklist Items */}
      {totalCount === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <CheckSquare className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <p className="text-sm text-muted-foreground mb-1">No checklist items yet</p>
            <p className="text-xs text-muted-foreground max-w-sm">
              Checklist items will automatically appear when you move this card to different stages
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {checklistItems.map((item) => (
            <Card
              key={item.id}
              className={cn(
                'transition-all duration-200',
                item.isCompleted && 'bg-muted/30'
              )}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  {/* Checkbox */}
                  <Checkbox
                    checked={item.isCompleted}
                    onCheckedChange={() => handleToggle(item.id, item.isCompleted)}
                    disabled={readonly}
                    className="mt-1"
                  />

                  {/* Content */}
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 space-y-1">
                        <h4
                          className={cn(
                            'text-sm font-medium',
                            item.isCompleted && 'line-through text-muted-foreground'
                          )}
                        >
                          {item.title}
                        </h4>
                        {item.description && (
                          <p
                            className={cn(
                              'text-xs text-muted-foreground',
                              item.isCompleted && 'line-through'
                            )}
                          >
                            {item.description}
                          </p>
                        )}
                      </div>

                      {/* Badges and Actions */}
                      <div className="flex items-center gap-2 shrink-0">
                        {item.isCustom && (
                          <Badge variant="outline" className="text-xs">
                            Custom
                          </Badge>
                        )}
                        {!readonly && item.isCustom && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDelete(item.id, item.isCustom)}
                                  disabled={deleteItem.isPending}
                                  className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Delete custom item</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                    </div>

                    {/* Completion Info */}
                    {item.isCompleted && item.completedBy && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                        <span>
                          Completed by{' '}
                          <span className="font-medium">
                            {item.completedBy.firstName} {item.completedBy.lastName}
                          </span>
                        </span>
                        {item.completedAt && (
                          <>
                            <span>•</span>
                            <Clock className="h-3 w-3" />
                            <span>
                              {formatDistanceToNow(new Date(item.completedAt), {
                                addSuffix: true,
                              })}
                            </span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
