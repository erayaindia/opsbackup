import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface KPICardProps {
  title: string;
  value: number | string;
  change?: number;
  changeLabel?: string;
  icon: React.ReactNode;
  loading?: boolean;
  format?: 'number' | 'currency' | 'percentage' | 'time';
  precision?: number;
}

export function KPICard({ 
  title, 
  value, 
  change, 
  changeLabel = "from yesterday", 
  icon, 
  loading = false,
  format = 'number',
  precision = 0
}: KPICardProps) {
  const formatValue = (val: number | string) => {
    if (typeof val === 'string') return val;
    
    switch (format) {
      case 'currency':
        return `₹${val.toLocaleString('en-IN', { maximumFractionDigits: precision })}`;
      case 'percentage':
        return `${val.toFixed(precision)}%`;
      case 'time':
        return `${val.toFixed(precision)}h`;
      default:
        return val.toLocaleString('en-IN', { maximumFractionDigits: precision });
    }
  };

  const getTrendColor = (changeValue?: number) => {
    if (changeValue === undefined) return "text-muted-foreground";
    return changeValue >= 0 ? "text-success" : "text-destructive";
  };

  const getTrendIcon = (changeValue?: number) => {
    if (changeValue === undefined) return null;
    return changeValue >= 0 ? 
      <TrendingUp className="h-3 w-3" /> : 
      <TrendingDown className="h-3 w-3" />;
  };

  if (loading) {
    return (
      <Card className="enhanced-card">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
          <div className="p-2 bg-muted/20 rounded-lg">
            {icon}
          </div>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-20 mb-2" />
          <Skeleton className="h-4 w-24" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="enhanced-card group hover:scale-105 transition-all duration-300">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold font-poppins mb-2">
          {formatValue(value)}
        </div>
        {change !== undefined && (
          <div className="flex items-center gap-2">
            <div className={cn("flex items-center gap-1", getTrendColor(change))}>
              {getTrendIcon(change)}
              <span className="text-sm font-medium">
                {change >= 0 ? '+' : ''}{change.toFixed(1)}%
              </span>
            </div>
            <span className="text-xs text-muted-foreground">{changeLabel}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}