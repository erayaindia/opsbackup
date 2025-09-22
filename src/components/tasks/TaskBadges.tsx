import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Clock, AlertCircle, CheckCircle, Flag, Camera, FileText, Link, CheckSquare } from 'lucide-react';
import {
  TaskPriorityValue,
  TaskStatusValue,
  EvidenceTypeValue,
  TaskPriority,
  TaskStatus,
  EvidenceType,
} from '@/types/tasks';

interface StatusBadgeProps {
  status: TaskStatusValue;
  className?: string;
}

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const config = {
    [TaskStatus.PENDING]: {
      variant: 'outline' as const,
      icon: Clock,
      color: 'text-muted-foreground',
      label: 'Pending',
    },
    [TaskStatus.IN_PROGRESS]: {
      variant: 'default' as const,
      icon: AlertCircle,
      color: 'text-blue-600',
      label: 'In Progress',
    },
    [TaskStatus.SUBMITTED_FOR_REVIEW]: {
      variant: 'secondary' as const,
      icon: Clock,
      color: 'text-yellow-600',
      label: 'Submitted',
    },
    [TaskStatus.APPROVED]: {
      variant: 'default' as const,
      icon: CheckCircle,
      color: 'text-green-600',
      label: 'Approved',
    },
    [TaskStatus.REJECTED]: {
      variant: 'destructive' as const,
      icon: AlertCircle,
      color: 'text-red-600',
      label: 'Rejected',
    },
    [TaskStatus.DONE_AUTO_APPROVED]: {
      variant: 'default' as const,
      icon: CheckCircle,
      color: 'text-green-600',
      label: 'Done',
    },
  };

  const { variant, icon: Icon, color, label } = config[status];

  return (
    <Badge variant={variant} className={`flex items-center gap-1 ${className}`}>
      <Icon className={`h-3 w-3 ${color}`} />
      {label}
    </Badge>
  );
}

interface PriorityBadgeProps {
  priority: TaskPriorityValue;
  className?: string;
}

export function PriorityBadge({ priority, className = '' }: PriorityBadgeProps) {
  const config = {
    [TaskPriority.LOW]: {
      variant: 'secondary' as const,
      icon: Flag,
      color: 'text-gray-500',
      label: 'Low',
    },
    [TaskPriority.MEDIUM]: {
      variant: 'default' as const,
      icon: Flag,
      color: 'text-yellow-600',
      label: 'Medium',
    },
    [TaskPriority.HIGH]: {
      variant: 'destructive' as const,
      icon: AlertCircle,
      color: 'text-red-600',
      label: 'High',
    },
  };

  const { variant, icon: Icon, color, label } = config[priority];

  return (
    <Badge variant={variant} className={`flex items-center gap-1 ${className}`}>
      <Icon className={`h-3 w-3 ${color}`} />
      {label}
    </Badge>
  );
}

interface EvidenceBadgeProps {
  evidenceType: EvidenceTypeValue;
  className?: string;
  required?: boolean;
}

export function EvidenceBadge({ evidenceType, className = '', required = false }: EvidenceBadgeProps) {
  if (evidenceType === EvidenceType.NONE) {
    return null;
  }

  const config = {
    [EvidenceType.PHOTO]: {
      icon: Camera,
      label: 'Photo',
      color: 'text-purple-600',
    },
    [EvidenceType.FILE]: {
      icon: FileText,
      label: 'File',
      color: 'text-blue-600',
    },
    [EvidenceType.LINK]: {
      icon: Link,
      label: 'Link',
      color: 'text-green-600',
    },
    [EvidenceType.CHECKLIST]: {
      icon: CheckSquare,
      label: 'Checklist',
      color: 'text-orange-600',
    },
  };

  const { icon: Icon, label, color } = config[evidenceType];

  return (
    <Badge
      variant={required ? 'destructive' : 'outline'}
      className={`flex items-center gap-1 ${className}`}
    >
      <Icon className={`h-3 w-3 ${color}`} />
      {label}
      {required && ' Required'}
    </Badge>
  );
}

interface DueBadgeProps {
  dueDate: string;
  dueTime?: string | null;
  dueDateTime?: string | null;
  isLate?: boolean;
  className?: string;
}

export function DueBadge({ dueDate, dueTime, dueDateTime, isLate, className = '' }: DueBadgeProps) {
  const now = new Date();
  let targetDate: Date;
  let timeLeft: string;
  let variant: 'default' | 'secondary' | 'destructive' | 'outline' = 'outline';

  if (dueDateTime) {
    targetDate = new Date(dueDateTime);
  } else if (dueTime) {
    targetDate = new Date(`${dueDate}T${dueTime}`);
  } else {
    targetDate = new Date(dueDate);
    targetDate.setHours(23, 59, 59); // End of day
  }

  const diffMs = targetDate.getTime() - now.getTime();
  const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (isLate || diffMs < 0) {
    const overdueDays = Math.abs(diffDays);
    timeLeft = overdueDays === 0 ? 'Overdue' : `${overdueDays}d overdue`;
    variant = 'destructive';
  } else if (diffHours <= 2) {
    timeLeft = `${diffHours}h left`;
    variant = 'destructive';
  } else if (diffHours <= 24) {
    timeLeft = `${diffHours}h left`;
    variant = 'default';
  } else if (diffDays <= 3) {
    timeLeft = `${diffDays}d left`;
    variant = 'secondary';
  } else {
    timeLeft = `${diffDays}d left`;
    variant = 'outline';
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const displayTime = dueTime || dueDateTime ? formatTime(targetDate) : '';

  return (
    <Badge variant={variant} className={`flex items-center gap-1 ${className}`}>
      <Clock className="h-3 w-3" />
      {displayTime && <span className="font-mono text-xs">{displayTime}</span>}
      <span>{timeLeft}</span>
    </Badge>
  );
}

interface TypeBadgeProps {
  type: 'daily' | 'one-off';
  className?: string;
}

export function TypeBadge({ type, className = '' }: TypeBadgeProps) {
  const config = {
    daily: {
      variant: 'secondary' as const,
      label: 'Daily',
      color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    },
    'one-off': {
      variant: 'outline' as const,
      label: 'One-off',
      color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
    },
  };

  const { variant, label, color } = config[type];

  return (
    <Badge variant={variant} className={`${color} ${className}`}>
      {label}
    </Badge>
  );
}

interface LateBadgeProps {
  isLate: boolean;
  className?: string;
}

export function LateBadge({ isLate, className = '' }: LateBadgeProps) {
  if (!isLate) return null;

  return (
    <Badge variant="destructive" className={`flex items-center gap-1 ${className}`}>
      <AlertCircle className="h-3 w-3" />
      Late
    </Badge>
  );
}