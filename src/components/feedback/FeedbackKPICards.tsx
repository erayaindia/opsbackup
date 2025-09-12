import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  MessageSquare, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Star, 
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react'
import type { FeedbackKPIs } from '@/types/feedback.types'
import { cn } from '@/lib/utils'

interface FeedbackKPICardsProps {
  kpis: FeedbackKPIs
  loading?: boolean
}

interface KPICardProps {
  title: string
  value: string | number
  change?: number
  icon: React.ComponentType<{ className?: string }>
  description: string
  variant?: 'default' | 'success' | 'warning' | 'destructive'
}

function KPICard({ title, value, change, icon: Icon, description, variant = 'default' }: KPICardProps) {
  const getTrendIcon = () => {
    if (change === undefined || change === 0) return <Minus className="h-3 w-3" />
    return change > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />
  }

  const getTrendColor = () => {
    if (change === undefined || change === 0) return 'text-gray-500'
    return change > 0 ? 'text-green-600' : 'text-red-600'
  }

  const getVariantStyles = () => {
    switch (variant) {
      case 'success':
        return 'border-green-200 bg-green-50'
      case 'warning':
        return 'border-yellow-200 bg-yellow-50'
      case 'destructive':
        return 'border-red-200 bg-red-50'
      default:
        return ''
    }
  }

  return (
    <Card className={cn('transition-all duration-200 hover:shadow-md', getVariantStyles())}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-2xl font-bold">{value}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {description}
            </p>
          </div>
          {change !== undefined && (
            <Badge 
              variant="secondary" 
              className={cn("flex items-center gap-1", getTrendColor())}
            >
              {getTrendIcon()}
              <span className="text-xs">
                {Math.abs(change).toFixed(1)}%
              </span>
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export function FeedbackKPICards({ kpis, loading }: FeedbackKPICardsProps) {
  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 7 }).map((_, index) => (
          <Card key={index} className="animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-24 bg-gray-200 rounded"></div>
              <div className="h-4 w-4 bg-gray-200 rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 w-32 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <KPICard
        title="Total Feedback"
        value={kpis.total_feedback + kpis.total_complaints}
        change={kpis.trends.feedback_trend}
        icon={MessageSquare}
        description={`${kpis.total_feedback} feedback, ${kpis.total_complaints} complaints`}
        variant="default"
      />

      <KPICard
        title="Resolution Rate"
        value={`${kpis.resolution_rate}%`}
        change={kpis.trends.resolution_trend}
        icon={CheckCircle}
        description="Successfully resolved issues"
        variant={kpis.resolution_rate >= 90 ? 'success' : kpis.resolution_rate >= 70 ? 'warning' : 'destructive'}
      />

      <KPICard
        title="Avg Resolution Time"
        value={`${kpis.average_resolution_time}h`}
        icon={Clock}
        description="Hours to resolve issues"
        variant={kpis.average_resolution_time <= 24 ? 'success' : kpis.average_resolution_time <= 48 ? 'warning' : 'destructive'}
      />

      <KPICard
        title="Customer Satisfaction"
        value={kpis.customer_satisfaction > 0 ? kpis.customer_satisfaction.toFixed(1) : 'N/A'}
        change={kpis.trends.satisfaction_trend}
        icon={Star}
        description="Average satisfaction score"
        variant={kpis.customer_satisfaction >= 8 ? 'success' : kpis.customer_satisfaction >= 6 ? 'warning' : 'destructive'}
      />

      <div className="md:col-span-2 lg:col-span-1">
        <KPICard
          title="Pending Items"
          value={kpis.pending_count}
          icon={Clock}
          description="Awaiting response or action"
          variant={kpis.pending_count <= 5 ? 'success' : kpis.pending_count <= 15 ? 'warning' : 'destructive'}
        />
      </div>

      <div className="md:col-span-2 lg:col-span-1">
        <KPICard
          title="Escalated Issues"
          value={kpis.escalated_count}
          icon={AlertTriangle}
          description="Requires immediate attention"
          variant={kpis.escalated_count === 0 ? 'success' : kpis.escalated_count <= 2 ? 'warning' : 'destructive'}
        />
      </div>

      <div className="md:col-span-2 lg:col-span-2">
        <Card className="transition-all duration-200 hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Quick Stats Overview
            </CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-lg font-semibold text-green-600">
                  {kpis.total_feedback}
                </div>
                <div className="text-xs text-muted-foreground">Positive</div>
              </div>
              <div>
                <div className="text-lg font-semibold text-red-600">
                  {kpis.total_complaints}
                </div>
                <div className="text-xs text-muted-foreground">Complaints</div>
              </div>
              <div>
                <div className="text-lg font-semibold text-yellow-600">
                  {kpis.escalated_count}
                </div>
                <div className="text-xs text-muted-foreground">Urgent</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}