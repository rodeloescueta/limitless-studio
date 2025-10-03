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
import { useCreateCard } from '@/lib/hooks/useCards'
import { useClients } from '@/lib/hooks/useClients'

const createCardSchema = z.object({
  title: z.string().min(1, 'Title is required').max(300),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  contentFormat: z.enum(['short', 'long']).default('short'),
  status: z.enum(['not_started', 'in_progress', 'blocked', 'ready_for_review', 'completed']).default('not_started'),
  clientId: z.string().optional(),
  dueWindowStart: z.string().optional(),
  dueWindowEnd: z.string().optional(),
})

type CreateCardFormData = z.infer<typeof createCardSchema>

interface CreateCardModalProps {
  stageId: string
  teamId: string
  isOpen: boolean
  onClose: () => void
}

export function CreateCardModal({ stageId, teamId, isOpen, onClose }: CreateCardModalProps) {
  const createCard = useCreateCard()
  const { data: clients = [] } = useClients()

  const form = useForm<CreateCardFormData>({
    resolver: zodResolver(createCardSchema),
    defaultValues: {
      title: '',
      description: '',
      priority: 'medium',
      contentFormat: 'short',
      status: 'not_started',
      clientId: undefined,
      dueWindowStart: '',
      dueWindowEnd: '',
    },
  })

  const onSubmit = async (data: CreateCardFormData) => {
    try {
      // Convert datetime-local format to ISO 8601 and filter out empty values
      const formattedData: any = {
        ...data,
        dueWindowStart: data.dueWindowStart ? new Date(data.dueWindowStart).toISOString() : undefined,
        dueWindowEnd: data.dueWindowEnd ? new Date(data.dueWindowEnd).toISOString() : undefined,
      }

      // Remove empty string values (e.g., clientId when not selected)
      Object.keys(formattedData).forEach(key => {
        if (formattedData[key] === '' || formattedData[key] === 'none') {
          delete formattedData[key]
        }
      })

      await createCard.mutateAsync({
        teamId,
        data: {
          ...formattedData,
          stageId,
          contentType: 'Video',
        },
      })
      form.reset()
      onClose()
    } catch (error) {
      console.error('Failed to create card:', error)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Card</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter card title..."
                      {...field}
                    />
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
                    <Textarea
                      placeholder="Enter card description..."
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
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

              <FormField
                control={form.control}
                name="contentFormat"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Format</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="short">Short</SelectItem>
                          <SelectItem value="long">Long</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="not_started">Not Started</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="blocked">Blocked</SelectItem>
                        <SelectItem value="ready_for_review">Ready for Review</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="clientId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client (Optional)</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select client (optional)..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No client selected</SelectItem>
                        {clients.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.clientCompanyName || client.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="dueWindowStart"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Due Window Start (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        type="datetime-local"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dueWindowEnd"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Due Window End (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        type="datetime-local"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={createCard.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createCard.isPending}
              >
                {createCard.isPending ? 'Creating...' : 'Create Card'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}