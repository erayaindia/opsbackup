import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Users, AlertTriangle, CheckCircle, Clock, Ticket } from "lucide-react";

interface SupportKPICardsProps {
  kpis: {
    total: number;
    new: number;
    open: number;
    waiting: number;
    solved: number;
    highPriority: number;
  };
}

export function SupportKPICards({ kpis }: SupportKPICardsProps) {
  const cards = [
    {
      title: "Total Tickets",
      value: kpis.total,
      icon: Ticket,
      description: "All support tickets",
      color: "bg-primary/10 text-primary",
    },
    {
      title: "New Tickets", 
      value: kpis.new,
      icon: AlertTriangle,
      description: "Require attention",
      color: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
    },
    {
      title: "Open Tickets",
      value: kpis.open,
      icon: Users,
      description: "Being worked on",
      color: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
    },
    {
      title: "Waiting", 
      value: kpis.waiting,
      icon: Clock,
      description: "Awaiting response",
      color: "bg-orange-500/10 text-orange-700 dark:text-orange-400",
    },
    {
      title: "Solved",
      value: kpis.solved,
      icon: CheckCircle,
      description: "Completed tickets",
      color: "bg-green-500/10 text-green-700 dark:text-green-400",
    },
    {
      title: "High Priority",
      value: kpis.highPriority,
      icon: BarChart3,
      description: "High/urgent priority",
      color: "bg-red-500/10 text-red-700 dark:text-red-400",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.title} className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <div className={`rounded-full p-2 ${card.color}`}>
                <Icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {card.description}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}