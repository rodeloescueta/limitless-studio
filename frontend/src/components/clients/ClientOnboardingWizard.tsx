'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'
import { Building2, Sparkles, Link as LinkIcon, Target } from 'lucide-react'

// Form schema
const clientSchema = z.object({
  // Step 1: Company Info
  name: z.string().min(2, 'Team name must be at least 2 characters'),
  clientCompanyName: z.string().min(2, 'Company name is required'),
  industry: z.string().optional(),
  contactEmail: z.string().email('Invalid email address').optional().or(z.literal('')),
  description: z.string().optional(),

  // Step 2: Brand Guidelines
  brandBio: z.string().optional(),
  brandVoice: z.string().optional(),
  targetAudience: z.string().optional(),
  contentPillars: z.string().optional(), // Will be converted to array

  // Step 3: Asset Links
  dropboxLink: z.string().url('Invalid URL').optional().or(z.literal('')),
  googleDriveLink: z.string().url('Invalid URL').optional().or(z.literal('')),
  notionLink: z.string().url('Invalid URL').optional().or(z.literal('')),

  // Step 4: Performance Goals
  viewsGoal: z.string().optional(),
  engagementGoal: z.string().optional(),
  followersGoal: z.string().optional(),
  timeframe: z.string().optional(),
})

type ClientFormData = z.infer<typeof clientSchema>

const steps = [
  {
    title: 'Company Information',
    description: 'Basic client details',
    icon: Building2,
  },
  {
    title: 'Brand Guidelines',
    description: 'Voice, audience, and content pillars',
    icon: Sparkles,
  },
  {
    title: 'Asset Links',
    description: 'Access to client resources',
    icon: LinkIcon,
  },
  {
    title: 'Performance Goals',
    description: 'Success metrics',
    icon: Target,
  },
]

interface ClientOnboardingWizardProps {
  onSuccess?: (clientId: string) => void
  onCancel?: () => void
}

export function ClientOnboardingWizard({ onSuccess, onCancel }: ClientOnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  const form = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: '',
      clientCompanyName: '',
      industry: '',
      contactEmail: '',
      description: '',
      brandBio: '',
      brandVoice: '',
      targetAudience: '',
      contentPillars: '',
      dropboxLink: '',
      googleDriveLink: '',
      notionLink: '',
      viewsGoal: '',
      engagementGoal: '',
      followersGoal: '',
      timeframe: '6 months',
    },
  })

  const progress = ((currentStep + 1) / steps.length) * 100

  const nextStep = async () => {
    // Validate current step fields
    const fieldsToValidate = getStepFields(currentStep)
    const isValid = await form.trigger(fieldsToValidate)

    if (isValid && currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const previousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const getStepFields = (step: number): (keyof ClientFormData)[] => {
    switch (step) {
      case 0:
        return ['name', 'clientCompanyName', 'industry', 'contactEmail', 'description']
      case 1:
        return ['brandBio', 'brandVoice', 'targetAudience', 'contentPillars']
      case 2:
        return ['dropboxLink', 'googleDriveLink', 'notionLink']
      case 3:
        return ['viewsGoal', 'engagementGoal', 'followersGoal', 'timeframe']
      default:
        return []
    }
  }

  const onSubmit = async (data: ClientFormData) => {
    setIsSubmitting(true)

    try {
      // Convert contentPillars string to array
      const contentPillars = data.contentPillars
        ? data.contentPillars.split(',').map(p => p.trim()).filter(Boolean)
        : []

      // Build asset links object
      const assetLinks: any = {}
      if (data.dropboxLink) assetLinks.dropbox = data.dropboxLink
      if (data.googleDriveLink) assetLinks.googleDrive = data.googleDriveLink
      if (data.notionLink) assetLinks.notion = data.notionLink

      // Build performance goals object
      const performanceGoals: any = {}
      if (data.viewsGoal) performanceGoals.views = parseInt(data.viewsGoal)
      if (data.engagementGoal) performanceGoals.engagement = parseFloat(data.engagementGoal)
      if (data.followersGoal) performanceGoals.followers = parseInt(data.followersGoal)
      if (data.timeframe) performanceGoals.timeframe = data.timeframe

      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: data.name,
          clientCompanyName: data.clientCompanyName,
          industry: data.industry,
          contactEmail: data.contactEmail,
          description: data.description,
          brandBio: data.brandBio,
          brandVoice: data.brandVoice,
          targetAudience: data.targetAudience,
          contentPillars,
          assetLinks: Object.keys(assetLinks).length > 0 ? assetLinks : null,
          performanceGoals: Object.keys(performanceGoals).length > 0 ? performanceGoals : null,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create client')
      }

      const result = await response.json()

      toast.success('Client created successfully!')

      if (onSuccess) {
        onSuccess(result.team.id)
      } else {
        router.push(`/dashboard?team=${result.team.id}`)
        router.refresh()
      }

    } catch (error) {
      console.error('Error creating client:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to create client')
    } finally {
      setIsSubmitting(false)
    }
  }

  const StepIcon = steps[currentStep].icon

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      {/* Progress Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <StepIcon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">{steps[currentStep].title}</h2>
              <p className="text-sm text-muted-foreground">{steps[currentStep].description}</p>
            </div>
          </div>
          <span className="text-sm font-medium text-muted-foreground">
            Step {currentStep + 1} of {steps.length}
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Client Onboarding</CardTitle>
          <CardDescription>
            Create a new client profile and configure their brand guidelines
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Step 1: Company Info */}
              {currentStep === 0 && (
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Team Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Acme Corp Team" {...field} />
                        </FormControl>
                        <FormDescription>
                          Internal name for this client team
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="clientCompanyName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Client Company Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Acme Corporation" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="industry"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Industry</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., SaaS, E-commerce, Healthcare" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="contactEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="contact@client.com" {...field} />
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
                            placeholder="Brief description of the client and their business..."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* Step 2: Brand Guidelines */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="brandBio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Brand Bio</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="What is the client's brand story and mission?"
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="brandVoice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Brand Voice</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="e.g., Professional, friendly, authoritative, casual..."
                            rows={2}
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          How should the content sound?
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="targetAudience"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Target Audience</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="e.g., Small business owners, Tech enthusiasts, Healthcare professionals..."
                            rows={2}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="contentPillars"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Content Pillars</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Education, Inspiration, Entertainment (comma-separated)" {...field} />
                        </FormControl>
                        <FormDescription>
                          Main themes for content creation
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* Step 3: Asset Links */}
              {currentStep === 2 && (
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="dropboxLink"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dropbox Link</FormLabel>
                        <FormControl>
                          <Input placeholder="https://dropbox.com/..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="googleDriveLink"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Google Drive Link</FormLabel>
                        <FormControl>
                          <Input placeholder="https://drive.google.com/..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="notionLink"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notion Link</FormLabel>
                        <FormControl>
                          <Input placeholder="https://notion.so/..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <p className="text-sm text-muted-foreground">
                    Provide quick access links to client assets, brand guidelines, and resources.
                  </p>
                </div>
              )}

              {/* Step 4: Performance Goals */}
              {currentStep === 3 && (
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="viewsGoal"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Views Goal</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="e.g., 100000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="engagementGoal"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Engagement Rate Goal (%)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.1" placeholder="e.g., 5.5" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="followersGoal"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Followers Goal</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="e.g., 50000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="timeframe"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Timeframe</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., 6 months, 1 year" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between pt-6">
                <div className="flex gap-2">
                  {currentStep > 0 && (
                    <Button type="button" variant="outline" onClick={previousStep}>
                      Previous
                    </Button>
                  )}
                  {onCancel && currentStep === 0 && (
                    <Button type="button" variant="outline" onClick={onCancel}>
                      Cancel
                    </Button>
                  )}
                </div>

                {currentStep < steps.length - 1 ? (
                  <Button type="button" onClick={nextStep}>
                    Next
                  </Button>
                ) : (
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Creating...' : 'Create Client'}
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}