import React, { useState, useRef, useCallback } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
// import { Calendar } from '@/components/ui/calendar'
// import { format } from 'date-fns'
import {
  ChevronRight,
  Clock,
  User,
  Target,
  Edit3,
  Plus,
  Filter,
  X,
  Calendar as CalendarIcon,
  ExternalLink,
  MessageSquare,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Building,
  Handshake,
  AlertCircle,
  Bot,
  MoreHorizontal,
  Search,
  Zap,
  FileText,
  Link,
  Upload
} from 'lucide-react'

// Types
export type StageKey = 'idea' | 'research' | 'sourcing' | 'samples' | 'negotiation' | 'finalize' | 'content' | 'listing' | 'qa' | 'softlaunch' | 'scale'

export type TimelineEntryType = 'milestone' | 'wip' | 'supplier' | 'negotiation' | 'decision' | 'blocker' | 'auto' | 'comment'

export interface TimelineEntry {
  id: string
  type: TimelineEntryType
  title: string
  body?: string
  author: string
  timestamp: Date
  stage?: StageKey
  assignee?: string
  dueDate?: Date
  tags?: string[]
  attachments?: Array<{ name: string; url: string; type: string }>
  metadata?: any
}

export interface NowNextBlocked {
  now?: string
  next?: string
  blocked?: string
}

export interface ActivityPanelProps {
  currentStage: StageKey
  entries: TimelineEntry[]
  nowNextBlocked: NowNextBlocked
  onStageChange: (stage: StageKey) => Promise<void>
  onAddEntry: (entry: Omit<TimelineEntry, 'id' | 'timestamp'>) => Promise<void>
  onUpdateNowNextBlocked: (values: NowNextBlocked) => Promise<void>
  isVisible: boolean
  onToggleVisibility: () => void
  className?: string
}

// Stages configuration
const STAGES: Array<{ key: StageKey; label: string; color: string }> = [
  { key: 'idea', label: 'Idea', color: 'bg-purple-100 text-purple-800' },
  { key: 'research', label: 'Research', color: 'bg-blue-100 text-blue-800' },
  { key: 'sourcing', label: 'Sourcing', color: 'bg-amber-100 text-amber-800' },
  { key: 'samples', label: 'Samples', color: 'bg-orange-100 text-orange-800' },
  { key: 'negotiation', label: 'Negotiation', color: 'bg-red-100 text-red-800' },
  { key: 'finalize', label: 'Finalize Supplier', color: 'bg-emerald-100 text-emerald-800' },
  { key: 'content', label: 'Content', color: 'bg-cyan-100 text-cyan-800' },
  { key: 'listing', label: 'Listing', color: 'bg-indigo-100 text-indigo-800' },
  { key: 'qa', label: 'QA', color: 'bg-pink-100 text-pink-800' },
  { key: 'softlaunch', label: 'Soft Launch', color: 'bg-green-100 text-green-800' },
  { key: 'scale', label: 'Scale/Kill', color: 'bg-slate-100 text-slate-800' }
]

// Entry type icons
const ENTRY_ICONS = {
  milestone: CheckCircle,
  wip: Clock,
  supplier: Building,
  negotiation: Handshake,
  decision: Target,
  blocker: AlertTriangle,
  auto: Bot,
  comment: MessageSquare
}

// Templates for quick composer
const TEMPLATES = [
  { label: 'Supplier found', text: 'Found potential supplier: ' },
  { label: 'Negotiation started', text: 'Started price negotiation with ' },
  { label: 'Backup sourcing', text: 'Exploring backup sourcing options for ' },
  { label: 'Sample status', text: 'Sample update: ' }
]

// In-memory store (replace with real backend later)
let timelineStore: TimelineEntry[] = []
let stageStore: StageKey = 'idea'
let nowNextBlockedStore: NowNextBlocked = {}

export const saveTimelineEntry = async (entry: Omit<TimelineEntry, 'id' | 'timestamp'>): Promise<void> => {
  const newEntry: TimelineEntry = {
    ...entry,
    id: Math.random().toString(36).substr(2, 9),
    timestamp: new Date()
  }
  timelineStore.push(newEntry)
  await new Promise(resolve => setTimeout(resolve, 100)) // Simulate API call
}

export const updateStage = async (stage: StageKey): Promise<void> => {
  stageStore = stage
  await saveTimelineEntry({
    type: 'milestone',
    title: `Moved to ${STAGES.find(s => s.key === stage)?.label}`,
    author: 'You',
    stage
  })
}

export const setNowNextBlocked = async (values: NowNextBlocked): Promise<void> => {
  nowNextBlockedStore = { ...nowNextBlockedStore, ...values }
  await new Promise(resolve => setTimeout(resolve, 50))
}

// Editable chip component
const EditableChip: React.FC<{
  label: string
  value?: string
  placeholder: string
  onSave: (value: string) => void
  variant?: 'default' | 'secondary' | 'destructive'
}> = ({ label, value, placeholder, onSave, variant = 'secondary' }) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(value || '')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSave = useCallback(() => {
    onSave(editValue)
    setIsEditing(false)
  }, [editValue, onSave])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave()
    } else if (e.key === 'Escape') {
      setEditValue(value || '')
      setIsEditing(false)
    }
  }, [handleSave, value])

  if (isEditing) {
    return (
      <div className="flex items-center gap-1">
        <span className="text-xs text-muted-foreground">{label}:</span>
        <Input
          ref={inputRef}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="h-6 text-xs px-2 w-24"
          autoFocus
        />
      </div>
    )
  }

  return (
    <Badge
      variant={variant}
      className="text-xs cursor-pointer hover:bg-opacity-80"
      onClick={() => setIsEditing(true)}
    >
      {label}: {value || 'Add...'}
    </Badge>
  )
}

// Stage stepper component
const StageStepper: React.FC<{
  currentStage: StageKey
  onStageChange: (stage: StageKey) => void
}> = ({ currentStage, onStageChange }) => {
  const currentIndex = STAGES.findIndex(s => s.key === currentStage)

  const handleStageClick = (stage: StageKey, index: number) => {
    if (index < currentIndex) {
      // Backward jump - show confirmation
      if (confirm(`Move back to ${STAGES[index].label}? This will create a milestone entry.`)) {
        onStageChange(stage)
      }
    } else {
      onStageChange(stage)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <h3 className="font-semibold text-sm">Stage Progress</h3>
        <Badge variant="outline" className="text-xs">
          {currentIndex + 1}/{STAGES.length}
        </Badge>
      </div>
      
      <div className="grid grid-cols-2 gap-1">
        {STAGES.map((stage, index) => {
          const isActive = index === currentIndex
          const isCompleted = index < currentIndex
          const isDisabled = index > currentIndex + 1
          
          return (
            <button
              key={stage.key}
              onClick={() => !isDisabled && handleStageClick(stage.key, index)}
              disabled={isDisabled}
              className={`
                p-2 rounded text-xs font-medium transition-colors text-left
                ${isActive ? 'bg-primary text-primary-foreground' : ''}
                ${isCompleted ? 'bg-green-100 text-green-800' : ''}
                ${!isActive && !isCompleted && !isDisabled ? 'bg-muted hover:bg-muted/80' : ''}
                ${isDisabled ? 'bg-muted/50 text-muted-foreground cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              <div className="flex items-center gap-1">
                {isCompleted && <CheckCircle className="h-3 w-3" />}
                {isActive && <Clock className="h-3 w-3" />}
                <span className="truncate">{stage.label}</span>
              </div>
            </button>
          )
        })}
      </div>
      
      {/* KPI chips */}
      <div className="flex flex-wrap gap-1">
        <Badge variant="outline" className="text-xs">
          <Clock className="h-3 w-3 mr-1" />
          5 days in stage
        </Badge>
        <Badge variant="outline" className="text-xs">
          <User className="h-3 w-3 mr-1" />
          You
        </Badge>
        <Badge variant="outline" className="text-xs">
          <Target className="h-3 w-3 mr-1" />
          Due in 2 days
        </Badge>
      </div>
    </div>
  )
}

// Quick composer component
const QuickComposer: React.FC<{
  onSubmit: (entry: Omit<TimelineEntry, 'id' | 'timestamp'>) => void
}> = ({ onSubmit }) => {
  const [type, setType] = useState<TimelineEntryType>('comment')
  const [text, setText] = useState('')
  const [assignee, setAssignee] = useState('')
  const [dueDate, setDueDate] = useState<Date>()
  const [showExtras, setShowExtras] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSubmit = useCallback(() => {
    if (!text.trim()) return

    onSubmit({
      type,
      title: text,
      author: 'You',
      assignee: assignee || undefined,
      dueDate
    })

    setText('')
    setAssignee('')
    setDueDate(undefined)
    setShowExtras(false)
    textareaRef.current?.focus()
  }, [type, text, assignee, dueDate, onSubmit])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault()
      handleSubmit()
    }
  }, [handleSubmit])

  const insertTemplate = useCallback((template: string) => {
    setText(template)
    textareaRef.current?.focus()
  }, [])

  return (
    <div className="space-y-3 border rounded-lg p-3 bg-muted/30">
      <div className="flex items-center gap-2">
        <Select value={type} onValueChange={(v) => setType(v as TimelineEntryType)}>
          <SelectTrigger className="w-24 h-7 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="comment">Comment</SelectItem>
            <SelectItem value="wip">WIP</SelectItem>
            <SelectItem value="supplier">Supplier</SelectItem>
            <SelectItem value="negotiation">Negotiation</SelectItem>
            <SelectItem value="decision">Decision</SelectItem>
            <SelectItem value="blocker">Blocker</SelectItem>
          </SelectContent>
        </Select>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 px-2">
              <FileText className="h-3 w-3" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-48" align="start">
            <div className="space-y-1">
              <p className="text-xs font-medium">Templates</p>
              {TEMPLATES.map((template) => (
                <button
                  key={template.label}
                  onClick={() => insertTemplate(template.text)}
                  className="w-full text-left px-2 py-1 text-xs hover:bg-muted rounded"
                >
                  {template.label}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2"
          onClick={() => setShowExtras(!showExtras)}
        >
          <Plus className="h-3 w-3" />
        </Button>
      </div>

      <Textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Add update... (Ctrl+Enter to post)"
        className="min-h-[60px] text-sm resize-none"
      />

      {showExtras && (
        <div className="flex items-center gap-2">
          <Input
            placeholder="@assignee"
            value={assignee}
            onChange={(e) => setAssignee(e.target.value)}
            className="h-7 text-xs flex-1"
          />
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-7 px-2">
                <CalendarIcon className="h-3 w-3" />
                {dueDate && dueDate.toLocaleDateString('en-US', { month: 'short', day: '2-digit' })}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-2" align="start">
              <Input
                type="date"
                value={dueDate ? dueDate.toISOString().split('T')[0] : ''}
                onChange={(e) => setDueDate(e.target.value ? new Date(e.target.value) : undefined)}
                className="w-full"
              />
            </PopoverContent>
          </Popover>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground">
          Ctrl+Enter to post
        </div>
        <Button size="sm" onClick={handleSubmit} disabled={!text.trim()}>
          Post
        </Button>
      </div>
    </div>
  )
}

// Timeline entry component
const TimelineEntryComponent: React.FC<{
  entry: TimelineEntry
  isRecent: boolean
}> = ({ entry, isRecent }) => {
  const Icon = ENTRY_ICONS[entry.type]
  const [showMenu, setShowMenu] = useState(false)

  return (
    <div className="flex gap-3 group">
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
        entry.type === 'milestone' ? 'bg-green-100' :
        entry.type === 'blocker' ? 'bg-red-100' :
        'bg-muted'
      }`}>
        <Icon className="h-4 w-4" />
      </div>
      
      <div className="flex-1 space-y-1">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium">{entry.title}</p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{entry.author}</span>
              <span>·</span>
              <span>{entry.timestamp.toLocaleDateString('en-US', { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
              {entry.stage && (
                <>
                  <span>·</span>
                  <Badge variant="outline" className="text-xs">
                    {STAGES.find(s => s.key === entry.stage)?.label}
                  </Badge>
                </>
              )}
            </div>
          </div>
          
          {isRecent && (
            <Popover open={showMenu} onOpenChange={setShowMenu}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                >
                  <MoreHorizontal className="h-3 w-3" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-32" align="end">
                <div className="space-y-1">
                  <button className="w-full text-left px-2 py-1 text-xs hover:bg-muted rounded">
                    Edit
                  </button>
                  <button className="w-full text-left px-2 py-1 text-xs hover:bg-muted rounded text-red-600">
                    Delete
                  </button>
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>
        
        {entry.body && (
          <p className="text-sm text-muted-foreground">{entry.body}</p>
        )}
        
        {entry.tags && entry.tags.length > 0 && (
          <div className="flex gap-1">
            {entry.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
        
        {entry.assignee && (
          <div className="flex items-center gap-1">
            <User className="h-3 w-3" />
            <span className="text-xs">{entry.assignee}</span>
          </div>
        )}
        
        {entry.dueDate && (
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span className="text-xs">Due {entry.dueDate.toLocaleDateString('en-US', { month: 'short', day: '2-digit' })}</span>
          </div>
        )}
      </div>
    </div>
  )
}

// Main activity panel component
export const ActivityPanel: React.FC<ActivityPanelProps> = ({
  currentStage,
  entries,
  nowNextBlocked,
  onStageChange,
  onAddEntry,
  onUpdateNowNextBlocked,
  isVisible,
  onToggleVisibility,
  className = ''
}) => {
  const [filters, setFilters] = useState<{
    types: TimelineEntryType[]
    search: string
    person: string
    dateRange: string
  }>({
    types: [],
    search: '',
    person: '',
    dateRange: ''
  })

  const filteredEntries = entries.filter(entry => {
    if (filters.types.length > 0 && !filters.types.includes(entry.type)) return false
    if (filters.search && !entry.title.toLowerCase().includes(filters.search.toLowerCase())) return false
    if (filters.person && entry.author !== filters.person) return false
    return true
  })

  // Group entries by date
  const groupedEntries = filteredEntries.reduce((groups, entry) => {
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const weekAgo = new Date(today)
    weekAgo.setDate(weekAgo.getDate() - 7)

    let group = 'Older'
    if (entry.timestamp.toDateString() === today.toDateString()) {
      group = 'Today'
    } else if (entry.timestamp.toDateString() === yesterday.toDateString()) {
      group = 'Yesterday'
    } else if (entry.timestamp > weekAgo) {
      group = 'Last 7 days'
    }

    if (!groups[group]) groups[group] = []
    groups[group].push(entry)
    return groups
  }, {} as Record<string, TimelineEntry[]>)

  if (!isVisible) return null

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Activity</h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleVisibility}
          className="lg:hidden"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Stage stepper - sticky */}
      <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b pb-4 -mx-4 px-4">
        <StageStepper
          currentStage={currentStage}
          onStageChange={onStageChange}
        />
      </div>

      {/* Now/Next/Blocked chips */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium">Status</h4>
        <div className="flex flex-wrap gap-2">
          <EditableChip
            label="Now"
            value={nowNextBlocked.now}
            placeholder="What are you working on?"
            onSave={(value) => onUpdateNowNextBlocked({ now: value })}
            variant="default"
          />
          <EditableChip
            label="Next"
            value={nowNextBlocked.next}
            placeholder="What's coming up?"
            onSave={(value) => onUpdateNowNextBlocked({ next: value })}
            variant="secondary"
          />
          <EditableChip
            label="Blocked"
            value={nowNextBlocked.blocked}
            placeholder="Any blockers?"
            onSave={(value) => onUpdateNowNextBlocked({ blocked: value })}
            variant="destructive"
          />
        </div>
      </div>

      {/* Quick composer */}
      <QuickComposer onSubmit={onAddEntry} />

      {/* Filters */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium">Timeline ({filteredEntries.length})</h4>
          {(filters.types.length > 0 || filters.search || filters.person) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFilters({ types: [], search: '', person: '', dateRange: '' })}
              className="text-xs"
            >
              Clear all
            </Button>
          )}
        </div>
        
        <div className="relative">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
          <Input
            placeholder="Search timeline..."
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            className="pl-7 h-8 text-xs"
          />
        </div>
      </div>

      {/* Timeline */}
      <div className="space-y-6">
        {Object.entries(groupedEntries).map(([group, groupEntries]) => (
          <div key={group} className="space-y-3">
            <h5 className="text-xs font-medium text-muted-foreground sticky top-16 bg-background py-1">
              {group}
            </h5>
            <div className="space-y-4">
              {groupEntries.map((entry) => (
                <TimelineEntryComponent
                  key={entry.id}
                  entry={entry}
                  isRecent={Date.now() - entry.timestamp.getTime() < 5 * 60 * 1000}
                />
              ))}
            </div>
          </div>
        ))}
        
        {filteredEntries.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No activity yet</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default ActivityPanel