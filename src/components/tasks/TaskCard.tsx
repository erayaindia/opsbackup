import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  MoreHorizontal,
  Clock,
  User,
  MessageSquare,
  Play,
  Check,
  Send,
  Eye,
} from 'lucide-react';
import {
  StatusBadge,
  PriorityBadge,
  EvidenceBadge,
  DueBadge,
  TypeBadge,
  LateBadge,
} from './TaskBadges';
import { TaskWithDetails, TaskStatus } from '@/types/tasks';

interface TaskCardProps {
  task: TaskWithDetails;
  onStart?: (task: TaskWithDetails) => void;
  onMarkDone?: (task: TaskWithDetails) => void;
  onSubmitForReview?: (task: TaskWithDetails) => void;
  onView?: (task: TaskWithDetails) => void;
  onEdit?: (task: TaskWithDetails) => void;
  onDelete?: (task: TaskWithDetails) => void;
  showActions?: boolean;
  compact?: boolean;
  selectable?: boolean;
  selected?: boolean;
  onSelect?: (task: TaskWithDetails, selected: boolean) => void;
  className?: string;
}

export function TaskCard({
  task,
  onStart,
  onMarkDone,
  onSubmitForReview,
  onView,
  onEdit,
  onDelete,
  showActions = true,
  compact = false,
  selectable = false,
  selected = false,
  onSelect,
  className = '',
}: TaskCardProps) {
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

  const formatDateTime = (date: string, time?: string | null) => {
    const d = new Date(date);
    const dateStr = d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });

    if (time) {
      const timeStr = new Date(`${date}T${time}`).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
      return `${dateStr} at ${timeStr}`;
    }

    return dateStr;
  };

  const renderPrimaryAction = () => {
    if (canStart) {
      return (
        <Button
          size="sm"
          onClick={() => onStart?.(task)}
          className="flex-1"
        >
          <Play className="h-4 w-4 mr-1" />
          Start
        </Button>
      );
    }

    if (canMarkDone) {
      return (
        <Button
          size="sm"
          onClick={() => onMarkDone?.(task)}
          className="flex-1"
        >
          <Check className="h-4 w-4 mr-1" />
          Mark Done
        </Button>
      );
    }

    if (canSubmitForReview) {
      return (
        <Button
          size="sm"
          onClick={() => onSubmitForReview?.(task)}
          className="flex-1"
        >
          <Send className="h-4 w-4 mr-1" />
          Submit
        </Button>
      );
    }

    return (
      <Button
        size="sm"
        variant="outline"
        onClick={() => onView?.(task)}
        className="flex-1"
      >
        <Eye className="h-4 w-4 mr-1" />
        View
      </Button>
    );
  };

  return (
    <Card
      className={`
        transition-all duration-200 hover:shadow-md
        ${selected ? 'ring-2 ring-primary ring-offset-2' : ''}
        ${compact ? 'p-2' : ''}
        ${className}
      `}
    >
      {selectable && (
        <div className="absolute top-2 left-2">
          <input
            type="checkbox"
            checked={selected}
            onChange={(e) => onSelect?.(task, e.target.checked)}
            className=""
          />
        </div>
      )}

      <CardHeader className={compact ? 'p-3 pb-2' : 'p-4 pb-3'}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm truncate mb-1">{task.title}</h3>
            <div className="flex flex-wrap gap-1 mb-2">
              <TypeBadge type={task.task_type} />
              <PriorityBadge priority={task.priority} />
              <StatusBadge status={task.status} />
              {task.is_late && <LateBadge isLate={task.is_late} />}
            </div>
          </div>

          {showActions && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onView?.(task)}>
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit?.(task)}>
                  Edit Task
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onDelete?.(task)}
                  className="text-destructive"
                >
                  Delete Task
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {!compact && task.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
            {task.description}
          </p>
        )}

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>
                {formatDateTime(task.due_date, task.due_time)}
              </span>
            </div>

            {task.assigned_user && (
              <div className="flex items-center gap-1">
                <User className="h-3 w-3" />
                <span className="truncate max-w-20">
                  {task.assigned_user.full_name || 'Unknown'}
                </span>
              </div>
            )}

            {task.submissions && task.submissions.length > 0 && (
              <div className="flex items-center gap-1">
                <MessageSquare className="h-3 w-3" />
                <span>{task.submissions.length}</span>
              </div>
            )}
          </div>

          <DueBadge
            dueDate={task.due_date}
            dueTime={task.due_time}
            dueDateTime={task.due_datetime}
            isLate={task.is_late}
          />
        </div>
      </CardHeader>

      {!compact && (
        <CardContent className="pt-0 pb-4 px-4">
          <div className="space-y-2">
            {task.evidence_required !== 'none' && (
              <EvidenceBadge
                evidenceType={task.evidence_required}
                required={true}
              />
            )}

            {task.tags && task.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {task.tags.slice(0, 3).map((tag, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
                {task.tags.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{task.tags.length - 3}
                  </Badge>
                )}
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2">
                {task.assigned_user && (
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-xs">
                        {getInitials(task.assigned_user.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs text-muted-foreground">
                      {task.assigned_user.full_name}
                    </span>
                  </div>
                )}
              </div>

              {showActions && (
                <div className="flex gap-2">
                  {renderPrimaryAction()}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}