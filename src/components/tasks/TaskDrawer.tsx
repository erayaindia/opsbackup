import React, { useState } from 'react';
import { renderDescription } from '@/lib/textUtils';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Clock,
  User,
  Calendar,
  FileText,
  MessageSquare,
  History,
  Play,
  Check,
  Send,
  Edit,
  X,
} from 'lucide-react';
import {
  StatusBadge,
  PriorityBadge,
  EvidenceBadge,
  DueBadge,
  TypeBadge,
  LateBadge,
} from './TaskBadges';
import { EvidenceUploader } from './EvidenceUploader';
import { TaskWithDetails, TaskStatus, EvidenceUpload } from '@/types/tasks';
import { formatFileSize, getFileIcon } from '@/lib/taskFileUpload';

interface TaskDrawerProps {
  task: TaskWithDetails | null;
  open: boolean;
  onClose: () => void;
  onStart?: (task: TaskWithDetails) => void;
  onMarkDone?: (task: TaskWithDetails) => void;
  onSubmitForReview?: (task: TaskWithDetails) => void;
  onEdit?: (task: TaskWithDetails) => void;
  canEdit?: boolean;
}

export function TaskDrawer({
  task,
  open,
  onClose,
  onStart,
  onMarkDone,
  onSubmitForReview,
  onEdit,
  canEdit = false,
}: TaskDrawerProps) {
  const [evidenceUpload, setEvidenceUpload] = useState<EvidenceUpload | null>(null);

  if (!task) return null;

  const canStart = task.status === TaskStatus.PENDING;
  const canMarkDone = task.status === TaskStatus.IN_PROGRESS && task.task_type === 'daily';
  const canSubmitForReview = task.status === TaskStatus.IN_PROGRESS && task.task_type === 'one-off';

  const getInitials = (name: string | null) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  const formatDateTime = (dateStr: string, timeStr?: string | null) => {
    const date = new Date(dateStr);
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };

    let result = date.toLocaleDateString('en-US', options);

    if (timeStr) {
      const time = new Date(`${dateStr}T${timeStr}`).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
      result += ` at ${time}`;
    }

    return result;
  };

  const renderTaskDetails = () => (
    <div className="space-y-6">
      {/* Header with badges */}
      <div className="space-y-3">
        <h2 className="text-xl font-semibold">{task.title}</h2>
        <div className="flex flex-wrap gap-2">
          <TypeBadge type={task.task_type} />
          <PriorityBadge priority={task.priority} />
          <StatusBadge status={task.status} />
          {task.is_late && <LateBadge isLate={task.is_late} />}
          {task.evidence_required !== 'none' && (
            <EvidenceBadge evidenceType={task.evidence_required} required />
          )}
        </div>
      </div>

      {/* Description */}
      {task.description && (
        <div>
          <h3 className="text-sm font-medium mb-2">Description</h3>
          <div className="text-sm text-muted-foreground whitespace-pre-wrap">
            {renderDescription(task.description)}
          </div>
        </div>
      )}

      {/* Due date and time */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Due Date
          </h3>
          <p className="text-sm">
            {formatDateTime(task.due_date, task.due_time)}
          </p>
          <DueBadge
            dueDate={task.due_date}
            dueTime={task.due_time}
            dueDateTime={task.due_datetime}
            isLate={task.is_late}
            className="mt-1"
          />
        </div>

        <div>
          <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
            <User className="h-4 w-4" />
            Assigned To
          </h3>
          {task.assigned_user && (
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarFallback className="text-xs">
                  {getInitials(task.assigned_user.full_name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">{task.assigned_user.full_name}</p>
                <p className="text-xs text-muted-foreground">
                  {task.assigned_user.role} • {task.assigned_user.department}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Reviewer */}
      {task.reviewer && (
        <div>
          <h3 className="text-sm font-medium mb-2">Reviewer</h3>
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="text-xs">
                {getInitials(task.reviewer.full_name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">{task.reviewer.full_name}</p>
              <p className="text-xs text-muted-foreground">{task.reviewer.role}</p>
            </div>
          </div>
        </div>
      )}

      {/* Tags */}
      {task.tags && task.tags.length > 0 && (
        <div>
          <h3 className="text-sm font-medium mb-2">Tags</h3>
          <div className="flex flex-wrap gap-1">
            {task.tags.map((tag, index) => (
              <Badge key={index} variant="outline">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Checklist items */}
      {task.checklist_items && Array.isArray(task.checklist_items) && task.checklist_items.length > 0 && (
        <div>
          <h3 className="text-sm font-medium mb-2">Checklist</h3>
          <div className="space-y-2">
            {task.checklist_items.map((item: any, index: number) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={item.completed || false}
                  readOnly
                  className=""
                />
                <span className={`text-sm ${item.completed ? 'line-through text-muted-foreground' : ''}`}>
                  {item.text}
                </span>
                {item.required && (
                  <Badge variant="outline" className="text-xs">
                    Required
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderEvidence = () => {
    const hasSubmissions = task.submissions && task.submissions.length > 0;

    return (
      <div className="space-y-6">
        {/* Evidence uploader for in-progress tasks */}
        {task.status === TaskStatus.IN_PROGRESS && task.evidence_required !== 'none' && (
          <EvidenceUploader
            evidenceType={task.evidence_required}
            taskId={task.id}
            required={true}
            onUpload={setEvidenceUpload}
            existingEvidence={evidenceUpload}
          />
        )}

        {/* Existing submissions */}
        {hasSubmissions && (
          <div>
            <h3 className="text-sm font-medium mb-3">Submitted Evidence</h3>
            <div className="space-y-3">
              {task.submissions?.map((submission) => (
                <div key={submission.id} className="p-3 border">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline">{submission.submission_type}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(submission.submitted_at).toLocaleDateString()}
                    </span>
                  </div>

                  {submission.file_name && (
                    <div className="flex items-center gap-2 text-sm">
                      <span>{getFileIcon(submission.file_name)}</span>
                      <span>{submission.file_name}</span>
                      {submission.file_size && (
                        <span className="text-muted-foreground">
                          ({formatFileSize(submission.file_size)})
                        </span>
                      )}
                    </div>
                  )}

                  {submission.link_url && (
                    <a
                      href={submission.link_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline"
                    >
                      {submission.link_url}
                    </a>
                  )}

                  {submission.notes && (
                    <p className="text-sm text-muted-foreground mt-2">
                      {submission.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {!hasSubmissions && task.status !== TaskStatus.IN_PROGRESS && (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No evidence submitted</p>
          </div>
        )}
      </div>
    );
  };

  const renderActivity = () => {
    const activities = [];

    // Add task creation
    activities.push({
      type: 'created',
      timestamp: task.created_at,
      user: task.assigned_by_user?.full_name || 'System',
      description: 'Task created',
    });

    // Add status changes based on timestamps
    if (task.started_at) {
      activities.push({
        type: 'started',
        timestamp: task.started_at,
        user: task.assigned_user?.full_name || 'Unknown',
        description: 'Task started',
      });
    }

    if (task.submitted_at) {
      activities.push({
        type: 'submitted',
        timestamp: task.submitted_at,
        user: task.assigned_user?.full_name || 'Unknown',
        description: 'Submitted for review',
      });
    }

    if (task.completed_at) {
      activities.push({
        type: 'completed',
        timestamp: task.completed_at,
        user: task.auto_approved ? 'System' : task.reviewer?.full_name || 'Unknown',
        description: task.auto_approved ? 'Auto-approved' : 'Approved by reviewer',
      });
    }

    // Add reviews
    task.reviews?.forEach((review) => {
      activities.push({
        type: review.status,
        timestamp: review.reviewed_at,
        user: task.reviewer?.full_name || 'Unknown',
        description: `Task ${review.status}`,
        notes: review.review_notes,
      });
    });

    // Sort by timestamp
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return (
      <div className="space-y-4">
        {activities.map((activity, index) => (
          <div key={index} className="flex gap-3">
            <div className="flex-shrink-0 w-2 h-2 bg-primary mt-2" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{activity.description}</span>
                <span className="text-xs text-muted-foreground">
                  by {activity.user}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {new Date(activity.timestamp).toLocaleString()}
              </p>
              {activity.notes && (
                <p className="text-sm text-muted-foreground mt-1">
                  {activity.notes}
                </p>
              )}
            </div>
          </div>
        ))}

        {activities.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No activity yet</p>
          </div>
        )}
      </div>
    );
  };

  const renderActions = () => {
    const actions = [];

    if (canStart) {
      actions.push(
        <Button key="start" onClick={() => onStart?.(task)} className="flex-1">
          <Play className="h-4 w-4 mr-2" />
          Start Task
        </Button>
      );
    }

    if (canMarkDone) {
      actions.push(
        <Button key="done" onClick={() => onMarkDone?.(task)} className="flex-1">
          <Check className="h-4 w-4 mr-2" />
          Mark Done
        </Button>
      );
    }

    if (canSubmitForReview) {
      actions.push(
        <Button key="submit" onClick={() => onSubmitForReview?.(task)} className="flex-1">
          <Send className="h-4 w-4 mr-2" />
          Submit for Review
        </Button>
      );
    }

    if (canEdit) {
      actions.push(
        <Button
          key="edit"
          variant="outline"
          onClick={() => onEdit?.(task)}
          className="flex-1"
        >
          <Edit className="h-4 w-4 mr-2" />
          Edit
        </Button>
      );
    }

    return actions.length > 0 ? (
      <div className="flex gap-2 pt-4 border-t">
        {actions}
      </div>
    ) : null;
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-2xl">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <SheetTitle>Task Details</SheetTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </SheetHeader>

        <div className="mt-6 h-[calc(100vh-120px)]">
          <Tabs defaultValue="details" className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="evidence">Evidence</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-hidden">
              <TabsContent value="details" className="h-full">
                <ScrollArea className="h-full pr-4">
                  {renderTaskDetails()}
                </ScrollArea>
              </TabsContent>

              <TabsContent value="evidence" className="h-full">
                <ScrollArea className="h-full pr-4">
                  {renderEvidence()}
                </ScrollArea>
              </TabsContent>

              <TabsContent value="activity" className="h-full">
                <ScrollArea className="h-full pr-4">
                  {renderActivity()}
                </ScrollArea>
              </TabsContent>
            </div>

            {renderActions()}
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
}