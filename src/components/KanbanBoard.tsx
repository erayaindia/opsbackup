import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { 
  Calendar, 
  MessageSquare, 
  MoreHorizontal, 
  Plus,
  AlertCircle,
  Clock,
  Flag,
  User
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Task {
  id: string;
  title: string;
  description: string;
  assignee: string;
  priority: "high" | "medium" | "low";
  status: "to-do" | "in-progress" | "done";
  dueDate: string;
  comments: number;
}

const tasks: Task[] = [
  {
    id: "TASK-001",
    title: "Process pending orders from yesterday",
    description: "Review and process all orders that came in after 5 PM yesterday",
    assignee: "Sarah Johnson",
    priority: "high",
    status: "to-do",
    dueDate: "2024-01-16",
    comments: 3,
  },
  {
    id: "TASK-002",
    title: "Update inventory counts for electronics",
    description: "Perform physical count and update system inventory",
    assignee: "Mike Chen",
    priority: "medium",
    status: "in-progress",
    dueDate: "2024-01-18",
    comments: 1,
  },
  {
    id: "TASK-003",
    title: "Setup new packing station",
    description: "Install and configure new packing station equipment",
    assignee: "Emma Wilson",
    priority: "medium",
    status: "done",
    dueDate: "2024-01-15",
    comments: 5,
  },
  {
    id: "TASK-004",
    title: "Train new support agent",
    description: "Onboard new team member with support procedures",
    assignee: "David Smith",
    priority: "low",
    status: "to-do",
    dueDate: "2024-01-20",
    comments: 0,
  }
];

const columns = [
  { id: "to-do", title: "To Do", color: "border-l-gray-400" },
  { id: "in-progress", title: "In Progress", color: "border-l-blue-500" },
  { id: "done", title: "Done", color: "border-l-green-500" },
];

export function KanbanBoard() {
  const [draggedTask, setDraggedTask] = useState<string | null>(null);

  const getPriorityBadge = (priority: string) => {
    const config = {
      high: { variant: "destructive" as const, icon: AlertCircle },
      medium: { variant: "default" as const, icon: Flag },
      low: { variant: "secondary" as const, icon: Clock }
    };
    
    const { variant, icon: Icon } = config[priority as keyof typeof config];
    
    return (
      <Badge variant={variant} className="flex items-center gap-1 text-xs">
        <Icon className="h-3 w-3" />
        {priority}
      </Badge>
    );
  };

  const getTasksForColumn = (columnId: string) => {
    return tasks.filter(task => task.status === columnId);
  };

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTask(taskId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    console.log(`Dropped task ${draggedTask} in column ${columnId}`);
    setDraggedTask(null);
  };

  return (
    <div className="h-full">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
        {columns.map((column) => (
          <div
            key={column.id}
            className="flex flex-col h-full"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, column.id)}
          >
            <div className={`flex items-center justify-between p-4 border-l-4 ${column.color} bg-muted/30`}>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm">{column.title}</h3>
                <Badge variant="secondary" className="text-xs">
                  {getTasksForColumn(column.id).length}
                </Badge>
              </div>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex-1 p-2 bg-muted/10 space-y-3 overflow-y-auto">
              {getTasksForColumn(column.id).map((task) => (
                <Card
                  key={task.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, task.id)}
                  className="cursor-move hover:shadow-md transition-all duration-200 bg-card border-0 shadow-sm"
                >
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-medium text-sm leading-5 line-clamp-2">
                        {task.title}
                      </h4>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreHorizontal className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-32">
                          <DropdownMenuItem className="text-xs">Edit</DropdownMenuItem>
                          <DropdownMenuItem className="text-xs">Assign</DropdownMenuItem>
                          <DropdownMenuItem className="text-xs text-destructive">Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {task.description}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      {getPriorityBadge(task.priority)}
                    </div>
                    
                    <div className="flex items-center justify-between pt-2 border-t border-border/40">
                      <div className="flex items-center gap-1">
                        <Avatar className="h-5 w-5">
                          <AvatarFallback className="text-[10px] bg-muted">
                            {task.assignee.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs text-muted-foreground hidden sm:block">
                          {task.assignee.split(' ')[0]}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span className="hidden sm:block">{task.dueDate}</span>
                        </div>
                        {task.comments > 0 && (
                          <div className="flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" />
                            <span>{task.comments}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {getTasksForColumn(column.id).length === 0 && (
                <div className="text-center text-muted-foreground text-xs py-8">
                  No tasks in {column.title.toLowerCase()}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}