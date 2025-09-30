'use client'

import { useState } from 'react'
import { Building2, Users, Sparkles, Link as LinkIcon, Target, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'

interface ClientProfile {
  team: {
    id: string
    name: string
    clientCompanyName?: string
    industry?: string
    contactEmail?: string
    description?: string
  }
  profile?: {
    brandBio?: string
    brandVoice?: string
    targetAudience?: string
    contentPillars?: string[]
    styleGuidelines?: {
      colors?: string[]
      fonts?: string[]
      tone?: string
      dosDonts?: { dos: string[]; donts: string[] }
    }
    assetLinks?: {
      dropbox?: string
      googleDrive?: string
      notion?: string
      other?: { name: string; url: string }[]
    }
    competitiveChannels?: {
      platform: string
      channelUrl: string
      notes: string
    }[]
    performanceGoals?: {
      views?: number
      engagement?: number
      followers?: number
      timeframe?: string
    }
  }
}

interface ClientProfileSidebarProps {
  clientProfile: ClientProfile
}

export function ClientProfileSidebar({ clientProfile }: ClientProfileSidebarProps) {
  const [isOpen, setIsOpen] = useState(true)
  const { team, profile } = clientProfile

  return (
    <Card className="w-80 h-fit sticky top-4">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Building2 className="w-4 h-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-sm font-medium">
                {team.clientCompanyName || team.name}
              </CardTitle>
              {team.industry && (
                <p className="text-xs text-muted-foreground mt-0.5">{team.industry}</p>
              )}
            </div>
          </div>
        </div>
      </CardHeader>

      <Separator />

      <CardContent className="pt-4 space-y-3">
        {/* Brand Bio */}
        {profile?.brandBio && (
          <Collapsible defaultOpen>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full justify-between p-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  <span className="text-sm font-medium">Brand Bio</span>
                </div>
                <ChevronDown className="w-4 h-4" />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="px-2 pt-2">
              <p className="text-xs text-muted-foreground">{profile.brandBio}</p>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Brand Voice */}
        {profile?.brandVoice && (
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Brand Voice</span>
            </div>
            <p className="text-xs text-muted-foreground pl-6">{profile.brandVoice}</p>
          </div>
        )}

        {/* Target Audience */}
        {profile?.targetAudience && (
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Target Audience</span>
            </div>
            <p className="text-xs text-muted-foreground pl-6">{profile.targetAudience}</p>
          </div>
        )}

        {/* Content Pillars */}
        {profile?.contentPillars && profile.contentPillars.length > 0 && (
          <div className="space-y-2">
            <span className="text-sm font-medium">Content Pillars</span>
            <div className="flex flex-wrap gap-1.5">
              {profile.contentPillars.map((pillar, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {pillar}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Asset Links */}
        {profile?.assetLinks && Object.keys(profile.assetLinks).length > 0 && (
          <div className="space-y-2 pt-2">
            <Separator />
            <div className="flex items-center gap-2 pt-2">
              <LinkIcon className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Asset Links</span>
            </div>
            <div className="space-y-1.5 pl-6">
              {profile.assetLinks.dropbox && (
                <a
                  href={profile.assetLinks.dropbox}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-primary hover:underline"
                >
                  Dropbox
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
              {profile.assetLinks.googleDrive && (
                <a
                  href={profile.assetLinks.googleDrive}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-primary hover:underline"
                >
                  Google Drive
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
              {profile.assetLinks.notion && (
                <a
                  href={profile.assetLinks.notion}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-primary hover:underline"
                >
                  Notion
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>
        )}

        {/* Performance Goals */}
        {profile?.performanceGoals && Object.keys(profile.performanceGoals).length > 0 && (
          <div className="space-y-2 pt-2">
            <Separator />
            <div className="flex items-center gap-2 pt-2">
              <Target className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Performance Goals</span>
            </div>
            <div className="space-y-1.5 pl-6 text-xs">
              {profile.performanceGoals.views && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Views:</span>
                  <span className="font-medium">{profile.performanceGoals.views.toLocaleString()}</span>
                </div>
              )}
              {profile.performanceGoals.engagement && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Engagement:</span>
                  <span className="font-medium">{profile.performanceGoals.engagement}%</span>
                </div>
              )}
              {profile.performanceGoals.followers && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Followers:</span>
                  <span className="font-medium">{profile.performanceGoals.followers.toLocaleString()}</span>
                </div>
              )}
              {profile.performanceGoals.timeframe && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Timeframe:</span>
                  <span className="font-medium">{profile.performanceGoals.timeframe}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}