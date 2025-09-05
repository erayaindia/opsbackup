import { Package, Clock, AlertTriangle, CheckCircle, XCircle, Camera } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface PackingStatsProps {
  stats: {
    total: number;
    pending: number;
    packed: number;
    disputes: number;
    invalid: number;
    missingPhoto: number;
    packedPercentage: number;
  };
}

export function PackingStats({ stats }: PackingStatsProps) {
  const statCards = [
    {
      title: "Total Orders",
      value: stats.total,
      icon: Package,
      color: "text-primary"
    },
    {
      title: "Pending",
      value: stats.pending,
      icon: Clock,
      color: "text-warning"
    },
    {
      title: "Packed",
      value: stats.packed,
      icon: CheckCircle,
      color: "text-success"
    },
    {
      title: "Disputes",
      value: stats.disputes,
      icon: AlertTriangle,
      color: "text-destructive"
    },
    {
      title: "Invalid",
      value: stats.invalid,
      icon: XCircle,
      color: "text-muted-foreground"
    },
    {
      title: "Missing Photo",
      value: stats.missingPhoto,
      icon: Camera,
      color: "text-warning"
    }
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="enhanced-card">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                  </div>
                  <Icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {stats.total > 0 && (
        <Card className="enhanced-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Packing Progress</span>
              <span className="text-sm text-muted-foreground">
                {stats.packed} of {stats.total} orders packed ({stats.packedPercentage}%)
              </span>
            </div>
            <Progress value={stats.packedPercentage} className="h-2" />
          </CardContent>
        </Card>
      )}
    </div>
  );
}