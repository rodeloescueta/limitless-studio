'use client'

import { useState, useEffect } from 'react'
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
  FormDescription,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { useCardDetails, useUpdateCard, useDeleteCard } from '@/lib/hooks/useCards'
import { useCardComments } from '@/lib/hooks/useComments'
import { useCardAttachments } from '@/lib/hooks/useAttachments'
import { useCardAssignments } from '@/lib/hooks/useAssignments'
import { useCardChecklist } from '@/lib/hooks/useChecklist'
import { CommentsPanel } from '@/components/comments/CommentsPanel'
import { AttachmentsPanel } from '@/components/attachments/AttachmentsPanel'
import { AssignmentPanel } from '@/components/assignments/AssignmentPanel'
import { CardHistoryPanel } from '@/components/audit/CardHistoryPanel'
import { ChecklistPanel } from '@/components/checklist/ChecklistPanel'
import { RoleGate, EditAccess, usePermissions } from '@/components/auth/RoleGate'
import { format, formatDistanceToNow } from 'date-fns'
import {
  CalendarIcon,
  TrashIcon,
  FileText,
  Edit3,
  Users,
  MessageSquare,
  Paperclip,
  Clock,
  Flame,
  Zap,
  ArrowRight,
  ArrowDown,
  X,
  AlertCircle,
  CheckSquare,
} from 'lucide-react'

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
  const [showDeleteAlert, setShowDeleteAlert] = useState(false)
  const [showUnsavedAlert, setShowUnsavedAlert] = useState(false)
  const [pendingClose, setPendingClose] = useState(false)

  const { data: card, isLoading } = useCardDetails(cardId || '')
  const { data: comments = [] } = useCardComments(cardId || '')
  const { data: attachments = [] } = useCardAttachments(cardId || '')
  const { data: assignments = [] } = useCardAssignments(cardId || '')
  const { data: checklistItems = [] } = useCardChecklist(cardId || '')
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

  const isDirty = form.formState.isDirty
  const titleLength = form.watch('title')?.length || 0

  // Priority configuration with icons
  const priorityConfig = {
    low: {
      color: 'bg-green-100 text-green-800 border-green-200',
      icon: ArrowDown,
      label: 'Low',
    },
    medium: {
      color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      icon: ArrowRight,
      label: 'Medium',
    },
    high: {
      color: 'bg-orange-100 text-orange-800 border-orange-200',
      icon: Zap,
      label: 'High',
    },
    urgent: {
      color: 'bg-red-100 text-red-800 border-red-200',
      icon: Flame,
      label: 'Urgent',
    },
  }

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + S to save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        if (isDirty) {
          form.handleSubmit(onSubmit)()
        }
      }
      // Escape to close
      if (e.key === 'Escape' && !showDeleteAlert && !showUnsavedAlert) {
        handleCloseAttempt()
      }
    }

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown)
    }

    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, isDirty, showDeleteAlert, showUnsavedAlert])

  const onSubmit = async (data: UpdateCardFormData) => {
    if (!cardId) return

    try {
      await updateCard.mutateAsync({
        cardId,
        data,
      })
      form.reset(data) // Reset form state to mark as not dirty
    } catch (error) {
      console.error('Failed to update card:', error)
    }
  }

  const handleCloseAttempt = () => {
    if (isDirty) {
      setPendingClose(true)
      setShowUnsavedAlert(true)
    } else {
      onClose()
    }
  }

  const handleConfirmClose = () => {
    setShowUnsavedAlert(false)
    setPendingClose(false)
    form.reset()
    onClose()
  }

  const handleCancelClose = () => {
    setShowUnsavedAlert(false)
    setPendingClose(false)
  }

  const handleDelete = async () => {
    if (!cardId) return

    try {
      await deleteCard.mutateAsync(cardId)
      setShowDeleteAlert(false)
      onClose()
    } catch (error) {
      console.error('Failed to delete card:', error)
    }
  }

  const handleDiscardChanges = () => {
    form.reset()
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
  const PriorityIcon = priorityConfig[card.priority].icon

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleCloseAttempt}>
        <DialogContent
          className="w-full h-full sm:h-[90vh] sm:max-w-3xl lg:max-w-5xl xl:max-w-6xl overflow-hidden p-0 sm:p-6 gap-0"
          aria-describedby="card-description"
          onPointerDownOutside={(e) => {
            if (isDirty) {
              e.preventDefault()
              handleCloseAttempt()
            }
          }}
        >
          {/* Enhanced Header */}
          <DialogHeader className="space-y-3 sm:space-y-4 pb-3 sm:pb-4 border-b px-4 pt-4 sm:px-0 sm:pt-0">
            <div className="flex items-start justify-between gap-2 sm:gap-4">
              <div className="flex-1 space-y-2 sm:space-y-3 min-w-0">
                {/* Badges Row */}
                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                  <Badge variant="outline" className="text-[10px] sm:text-xs font-medium px-1.5 sm:px-2.5 py-0.5 sm:py-1">
                    {card.contentType || 'Blog'}
                  </Badge>
                  <Badge
                    className="text-[10px] sm:text-xs font-medium px-1.5 sm:px-2.5 py-0.5 sm:py-1"
                    style={{
                      backgroundColor: card.stage?.color || '#6b7280',
                      color: 'white'
                    }}
                  >
                    {card.stage?.name || 'Unknown'}
                  </Badge>
                  <Badge className={`text-[10px] sm:text-xs font-medium px-1.5 sm:px-2.5 py-0.5 sm:py-1 border ${priorityConfig[card.priority].color}`}>
                    <PriorityIcon className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
                    <span className="hidden xs:inline">{priorityConfig[card.priority].label}</span>
                  </Badge>
                </div>

                {/* Title */}
                <DialogTitle className="text-lg sm:text-xl lg:text-2xl font-bold leading-tight pr-2 sm:pr-8 line-clamp-2">
                  {card.title}
                </DialogTitle>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1 sm:gap-2 pt-1 shrink-0">
                <RoleGate stage={card.stage?.name || ''} action="delete">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDeleteAlert(true)}
                    disabled={deleteCard.isPending}
                    className="text-destructive hover:bg-destructive/10 h-8 w-8 sm:h-9 sm:w-9 p-0"
                    aria-label="Delete card"
                  >
                    <TrashIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </Button>
                </RoleGate>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCloseAttempt}
                  aria-label="Close modal"
                  className="h-8 w-8 sm:h-9 sm:w-9 p-0"
                >
                  <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </Button>
              </div>
            </div>

            {/* Unsaved changes indicator */}
            {isDirty && (
              <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-md border border-amber-200">
                <AlertCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" />
                <span className="text-[11px] sm:text-xs">You have unsaved changes</span>
              </div>
            )}
          </DialogHeader>

          {/* Enhanced Tabs with Icons and Badges */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col px-4 sm:px-0">
            <TabsList className="grid w-full grid-cols-7 h-auto p-0.5 sm:p-1 gap-0.5 sm:gap-1">
              <TabsTrigger value="overview" className="flex items-center justify-center gap-1 sm:gap-2 py-2 sm:py-2.5 px-1 sm:px-3" aria-label="Overview tab">
                <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                <span className="hidden md:inline text-xs sm:text-sm">Overview</span>
              </TabsTrigger>
              <TabsTrigger value="content" className="flex items-center justify-center gap-1 sm:gap-2 py-2 sm:py-2.5 px-1 sm:px-3" aria-label="Content tab">
                <Edit3 className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                <span className="hidden md:inline text-xs sm:text-sm">Content</span>
              </TabsTrigger>
              <TabsTrigger value="checklist" className="flex items-center justify-center gap-1 sm:gap-2 py-2 sm:py-2.5 px-1 sm:px-3 relative" aria-label="Checklist tab">
                <CheckSquare className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                <span className="hidden md:inline text-xs sm:text-sm">Checklist</span>
                {checklistItems.length > 0 && (
                  <Badge variant="secondary" className="hidden sm:flex ml-0.5 h-4 sm:h-5 min-w-4 sm:min-w-5 px-1 sm:px-1.5 text-[10px] sm:text-xs">
                    {checklistItems.filter(item => item.isCompleted).length}/{checklistItems.length}
                  </Badge>
                )}
                {checklistItems.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 sm:hidden flex h-2 w-2 rounded-full bg-primary" />
                )}
              </TabsTrigger>
              <TabsTrigger value="assignments" className="flex items-center justify-center gap-1 sm:gap-2 py-2 sm:py-2.5 px-1 sm:px-3 relative" aria-label="Assignments tab">
                <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                <span className="hidden md:inline text-xs sm:text-sm">Assign</span>
                {assignments.length > 0 && (
                  <Badge variant="secondary" className="hidden sm:flex ml-0.5 h-4 sm:h-5 min-w-4 sm:min-w-5 px-1 sm:px-1.5 text-[10px] sm:text-xs">
                    {assignments.length}
                  </Badge>
                )}
                {assignments.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 sm:hidden flex h-2 w-2 rounded-full bg-primary" />
                )}
              </TabsTrigger>
              <TabsTrigger value="comments" className="flex items-center justify-center gap-1 sm:gap-2 py-2 sm:py-2.5 px-1 sm:px-3 relative" aria-label="Comments tab">
                <MessageSquare className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                <span className="hidden md:inline text-xs sm:text-sm">Comments</span>
                {comments.length > 0 && (
                  <Badge variant="secondary" className="hidden sm:flex ml-0.5 h-4 sm:h-5 min-w-4 sm:min-w-5 px-1 sm:px-1.5 text-[10px] sm:text-xs">
                    {comments.length}
                  </Badge>
                )}
                {comments.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 sm:hidden flex h-2 w-2 rounded-full bg-primary" />
                )}
              </TabsTrigger>
              <TabsTrigger value="attachments" className="flex items-center justify-center gap-1 sm:gap-2 py-2 sm:py-2.5 px-1 sm:px-3 relative" aria-label="Attachments tab">
                <Paperclip className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                <span className="hidden md:inline text-xs sm:text-sm">Files</span>
                {attachments.length > 0 && (
                  <Badge variant="secondary" className="hidden sm:flex ml-0.5 h-4 sm:h-5 min-w-4 sm:min-w-5 px-1 sm:px-1.5 text-[10px] sm:text-xs">
                    {attachments.length}
                  </Badge>
                )}
                {attachments.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 sm:hidden flex h-2 w-2 rounded-full bg-primary" />
                )}
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center justify-center gap-1 sm:gap-2 py-2 sm:py-2.5 px-1 sm:px-3" aria-label="History tab">
                <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                <span className="hidden md:inline text-xs sm:text-sm">History</span>
              </TabsTrigger>
            </TabsList>

          <div className="mt-4 sm:mt-6 overflow-y-auto flex-1 px-0 sm:px-1">
            <TabsContent value="overview" className="m-0 p-0" id="card-description">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
                {/* Main Content Area - 2 columns on desktop, full width on mobile */}
                <div className="lg:col-span-2 space-y-4 sm:space-y-6 lg:space-y-8 order-2 lg:order-1">
                  {/* Description Section */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      Description
                    </h3>
                    {card.description ? (
                      <p className="text-sm text-muted-foreground leading-relaxed pl-6">{card.description}</p>
                    ) : (
                      <p className="text-sm text-muted-foreground italic pl-6">No description provided</p>
                    )}
                  </div>

                  {/* Divider */}
                  <div className="border-t" />

                  {/* Notes Section */}
                  {card.content && (
                    <>
                      <div className="bg-accent/30 rounded-lg p-5 border space-y-3">
                        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                          <Edit3 className="h-4 w-4 text-muted-foreground" />
                          Notes
                        </h3>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{card.content}</p>
                      </div>
                      <div className="border-t" />
                    </>
                  )}

                  {/* Edit Form - Only visible with edit access */}
                  <EditAccess stage={card.stage?.name || ''} fallback={null}>
                    <div className="space-y-6">
                      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <Edit3 className="h-4 w-4 text-muted-foreground" />
                        Edit Card Details
                      </h3>

                      <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
                          <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-sm font-medium">Title *</FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    placeholder="Enter card title..."
                                    className="h-10 sm:h-11 w-full"
                                    maxLength={300}
                                  />
                                </FormControl>
                                <FormDescription className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2 text-xs">
                                  <span className="text-[11px] sm:text-xs">A clear, concise title for this content card</span>
                                  <span className={`text-[11px] sm:text-xs ${titleLength > 280 ? 'text-amber-600 font-medium' : 'text-muted-foreground'}`}>
                                    {titleLength}/300
                                  </span>
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
                                <FormLabel className="text-sm font-medium">Description</FormLabel>
                                <FormControl>
                                  <Textarea
                                    rows={3}
                                    {...field}
                                    placeholder="Provide a brief description of this content..."
                                    className="resize-y min-h-[80px] sm:min-h-[100px] w-full"
                                  />
                                </FormControl>
                                <FormDescription className="text-[11px] sm:text-xs">
                                  Add context and details about this content piece
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="priority"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-sm font-medium">Priority Level</FormLabel>
                                <FormControl>
                                  <Select value={field.value} onValueChange={field.onChange}>
                                    <SelectTrigger className="w-full sm:w-48 h-10 sm:h-11">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {Object.entries(priorityConfig).map(([value, config]) => {
                                        const Icon = config.icon
                                        return (
                                          <SelectItem key={value} value={value}>
                                            <div className="flex items-center gap-2">
                                              <Icon className="h-4 w-4" />
                                              {config.label}
                                            </div>
                                          </SelectItem>
                                        )
                                      })}
                                    </SelectContent>
                                  </Select>
                                </FormControl>
                                <FormDescription className="text-[11px] sm:text-xs">
                                  Set the urgency level for this task
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 border-t">
                            <div className="flex items-center gap-2 order-2 sm:order-1">
                              {isDirty && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={handleDiscardChanges}
                                  className="text-muted-foreground text-xs sm:text-sm"
                                >
                                  Discard Changes
                                </Button>
                              )}
                            </div>
                            <div className="flex items-center gap-2 sm:gap-3 order-1 sm:order-2">
                              <Button
                                type="button"
                                variant="outline"
                                onClick={handleCloseAttempt}
                                className="flex-1 sm:flex-initial text-sm"
                              >
                                Close
                              </Button>
                              <Button
                                type="submit"
                                disabled={updateCard.isPending || !isDirty}
                                className="flex-1 sm:flex-initial sm:min-w-32 text-sm"
                              >
                                {updateCard.isPending ? 'Saving...' : 'Save Changes'}
                                {!updateCard.isPending && <kbd className="ml-2 pointer-events-none hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">⌘S</kbd>}
                              </Button>
                            </div>
                          </div>
                        </form>
                      </Form>
                    </div>
                  </EditAccess>
                </div>

                {/* Enhanced Sidebar - 1 column with sticky positioning on desktop, regular on mobile */}
                <div className="space-y-3 sm:space-y-4 lg:space-y-5 order-1 lg:order-2 lg:self-start lg:sticky lg:top-0">
                  {/* Metadata Card */}
                  <div className="bg-gradient-to-br from-muted/50 to-muted/30 rounded-xl p-5 space-y-4 border shadow-sm">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Details</h3>

                    <div className="space-y-4">
                      <div>
                        <p className="text-muted-foreground text-xs font-medium mb-2">Created by</p>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9 border-2 border-background shadow-sm">
                            <AvatarImage src={card.createdBy.avatar} />
                            <AvatarFallback className="text-xs font-semibold">
                              {card.createdBy.firstName?.[0] || ''}{card.createdBy.lastName?.[0] || ''}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {card.createdBy.firstName} {card.createdBy.lastName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(card.createdAt), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                      </div>

                      {card.assignedTo && (
                        <>
                          <div className="border-t pt-4">
                            <p className="text-muted-foreground text-xs font-medium mb-2">Assigned to</p>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-9 w-9 border-2 border-background shadow-sm">
                                <AvatarImage src={card.assignedTo.avatar} />
                                <AvatarFallback className="text-xs font-semibold">
                                  {card.assignedTo.firstName[0]}{card.assignedTo.lastName[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-foreground truncate">
                                  {card.assignedTo.firstName} {card.assignedTo.lastName}
                                </p>
                                <p className="text-xs text-muted-foreground">Primary assignee</p>
                              </div>
                            </div>
                          </div>
                        </>
                      )}

                      {card.dueDate && (
                        <div className="border-t pt-4">
                          <p className="text-muted-foreground text-xs font-medium mb-2">Due date</p>
                          <div className="flex items-center gap-3 p-2.5 bg-background rounded-lg border">
                            <CalendarIcon className="h-5 w-5 text-primary" />
                            <div>
                              <p className="text-sm font-medium text-foreground">
                                {format(new Date(card.dueDate), 'MMM d, yyyy')}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(card.dueDate), { addSuffix: true })}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {card.updatedAt && (
                        <div className="border-t pt-4">
                          <p className="text-muted-foreground text-xs font-medium mb-1">Last updated</p>
                          <p className="text-xs text-foreground">
                            {formatDistanceToNow(new Date(card.updatedAt), { addSuffix: true })}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Tags */}
                  {tags && tags.length > 0 && (
                    <div className="bg-background rounded-xl p-5 border shadow-sm space-y-3">
                      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Tags</h3>
                      <div className="flex flex-wrap gap-2">
                        {tags.map((tag: string, index: number) => (
                          <Badge key={index} variant="outline" className="text-xs px-2.5 py-1 font-medium">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Activity Summary */}
                  <div className="bg-background rounded-xl p-5 border shadow-sm space-y-3">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Activity</h3>
                    <div className="space-y-2.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Checklist</span>
                        <Badge variant="secondary" className="h-6 min-w-6 px-2">
                          {checklistItems.filter(item => item.isCompleted).length}/{checklistItems.length}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Comments</span>
                        <Badge variant="secondary" className="h-6 min-w-6 px-2">
                          {comments.length}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Attachments</span>
                        <Badge variant="secondary" className="h-6 min-w-6 px-2">
                          {attachments.length}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Assignments</span>
                        <Badge variant="secondary" className="h-6 min-w-6 px-2">
                          {assignments.length}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="content" className="space-y-4">
              <EditAccess stage={card.stage?.name || ''} fallback={
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Edit3 className="h-5 w-5 text-muted-foreground" />
                    <label className="text-base font-semibold">Content</label>
                  </div>
                  <div className="p-6 bg-muted/30 rounded-lg border min-h-[400px] whitespace-pre-wrap text-sm leading-relaxed">
                    {card.content || 'No content added yet'}
                  </div>
                </div>
              }>
                <div className="flex items-center gap-2 mb-4">
                  <Edit3 className="h-5 w-5 text-muted-foreground" />
                  <label className="text-base font-semibold">Content Editor</label>
                </div>

                <Form {...form}>
                  <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">Full Content</FormLabel>
                        <FormControl>
                          <Textarea
                            rows={18}
                            placeholder="Add detailed content, scripts, outlines, notes..."
                            className="resize-y min-h-[400px] font-mono text-sm"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription className="text-xs">
                          Add comprehensive content details, scripts, or production notes
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-between items-center gap-2 mt-6 pt-4 border-t">
                    {isDirty && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleDiscardChanges}
                        className="text-muted-foreground"
                      >
                        Discard Changes
                      </Button>
                    )}
                    <div className="flex-1" />
                    <Button
                      type="button"
                      onClick={form.handleSubmit(onSubmit)}
                      disabled={updateCard.isPending || !isDirty}
                      className="min-w-32"
                    >
                      {updateCard.isPending ? 'Saving...' : 'Save Content'}
                      {!updateCard.isPending && <kbd className="ml-2 pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">⌘S</kbd>}
                    </Button>
                  </div>
                </Form>
              </EditAccess>
            </TabsContent>

            <TabsContent value="checklist" className="h-full">
              <ChecklistPanel
                cardId={cardId}
                readonly={!permissions.canEdit(card.stage?.name || '')}
              />
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

    {/* Delete Confirmation Dialog */}
    <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            Delete Card?
          </AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete &quot;{card.title}&quot;? This action cannot be undone.
            All associated comments, attachments, and history will be permanently removed.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteCard.isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleteCard.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleteCard.isPending ? 'Deleting...' : 'Delete Card'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    {/* Unsaved Changes Dialog */}
    <AlertDialog open={showUnsavedAlert} onOpenChange={setShowUnsavedAlert}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-600" />
            Unsaved Changes
          </AlertDialogTitle>
          <AlertDialogDescription>
            You have unsaved changes. Are you sure you want to close this dialog?
            Your changes will be lost.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancelClose}>Continue Editing</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirmClose}
            className="bg-amber-600 text-white hover:bg-amber-700"
          >
            Discard Changes
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </>
  )
}