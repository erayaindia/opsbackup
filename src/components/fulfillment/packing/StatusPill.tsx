import { PackingOrder } from "@/lib/fulfillment/packingManager";
import { CheckCircle2, Clock, AlertTriangle, XCircle, Camera } from "lucide-react";

interface StatusPillProps {
  status: PackingOrder['status'];
  isLoading?: boolean;
}

const statusConfig = {
  pending: {
    bg: 'var(--badge-pending)',
    color: 'var(--badge-pending-ink)',
    icon: Clock,
    label: 'Pending'
  },
  packed: {
    bg: 'var(--badge-packed)',
    color: 'var(--badge-packed-ink)',
    icon: CheckCircle2,
    label: 'Packed'
  },
  dispute: {
    bg: 'var(--badge-dispute)',
    color: 'var(--badge-dispute-ink)',
    icon: AlertTriangle,
    label: 'Dispute'
  },
  invalid: {
    bg: 'var(--badge-invalid)',
    color: 'var(--badge-invalid-ink)',
    icon: XCircle,
    label: 'Invalid'
  },
  'missing-photo': {
    bg: 'var(--badge-invalid)',
    color: 'var(--badge-invalid-ink)',
    icon: Camera,
    label: 'Missing Photo'
  }
};

export function StatusPill({ status, isLoading }: StatusPillProps) {
  const config = statusConfig[status] || statusConfig.pending; // Fallback to pending if status not found
  const Icon = config.icon;
  
  return (
    <div 
      className="inline-flex items-center gap-1 h-5 px-2 text-[11px] font-semibold rounded-full"
      style={{ 
        backgroundColor: config.bg, 
        color: config.color 
      }}
    >
      {isLoading ? (
        <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        <Icon className="w-3 h-3" />
      )}
      {config.label}
    </div>
  );
}