import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { KanbanBoard } from "@/components/KanbanBoard";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Calendar,
  User,
  AlertCircle,
  CheckCircle,
  Clock,
  Flag,
  MessageSquare,
  LayoutGrid,
  List
} from "lucide-react";

const tasks = [
  {
    id: "TASK-001",
    title: "Process pending orders from yesterday",
    description: "Review and process all orders that came in after 5 PM yesterday",
    assignee: "Sarah Johnson",
    priority: "high",
    status: "to-do",
    dueDate: "2024-01-16",
    comments: 3,
    createdAt: "2024-01-15"
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
    createdAt: "2024-01-14"
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
    createdAt: "2024-01-12"
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
    createdAt: "2024-01-15"
  }
];

export default function Tasks() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTab, setSelectedTab] = useState("all");
  const [viewMode, setViewMode] = useState<"list" | "kanban">("kanban");

  const getPriorityBadge = (priority: string) => {
    const config = {
      high: { variant: "destructive" as const, icon: AlertCircle },
      medium: { variant: "default" as const, icon: Flag },
      low: { variant: "secondary" as const, icon: Clock }
    };
    
    const { variant, icon: Icon } = config[priority as keyof typeof config];
    
    return (
      <Badge variant={variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {priority}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const config = {
      "to-do": { variant: "outline" as const, icon: Clock, color: "text-muted-foreground" },
      "in-progress": { variant: "default" as const, icon: AlertCircle, color: "text-primary" },
      "done": { variant: "secondary" as const, icon: CheckCircle, color: "text-success" }
    };
    
    const { variant, icon: Icon, color } = config[status as keyof typeof config];
    
    return (
      <Badge variant={variant} className="flex items-center gap-1">
        <Icon className={`h-3 w-3 ${color}`} />
        {status.replace("-", " ")}
      </Badge>
    );
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.assignee.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTab = selectedTab === "all" || task.status === selectedTab;
    
    return matchesSearch && matchesTab;
  });

  const taskCounts = {
    all: tasks.length,
    "to-do": tasks.filter(t => t.status === "to-do").length,
    "in-progress": tasks.filter(t => t.status === "in-progress").length,
    done: tasks.filter(t => t.status === "done").length
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Tasks Management</h1>
        <div className="flex items-center gap-2">
          <div className="flex items-center border rounded-lg p-1 bg-muted/50">
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="h-7 px-2"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "kanban" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("kanban")}
              className="h-7 px-2"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Task
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Task</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input id="title" placeholder="Task title..." />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" placeholder="Task description..." />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Priority</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Assignee</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Assign to..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sarah">Sarah Johnson</SelectItem>
                        <SelectItem value="mike">Mike Chen</SelectItem>
                        <SelectItem value="emma">Emma Wilson</SelectItem>
                        <SelectItem value="david">David Smith</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Input id="dueDate" type="date" />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline">Cancel</Button>
                  <Button>Create Task</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
        </div>
      </div>

      {/* Search and Stats */}
      {viewMode === "list" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2 border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tasks by title, description, or assignee..."
                  className="pl-10 border-0 bg-muted/50"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{taskCounts["to-do"]}</div>
              <div className="text-sm text-muted-foreground">Tasks To Do</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tasks Content */}
      {viewMode === "kanban" ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <KanbanBoard />
          </CardContent>
        </Card>
      ) : (
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Task List</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
              <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:grid-cols-4">
                <TabsTrigger value="all" className="text-sm">All ({taskCounts.all})</TabsTrigger>
                <TabsTrigger value="to-do" className="text-sm">To Do ({taskCounts["to-do"]})</TabsTrigger>
                <TabsTrigger value="in-progress" className="text-sm">In Progress ({taskCounts["in-progress"]})</TabsTrigger>
                <TabsTrigger value="done" className="text-sm">Done ({taskCounts.done})</TabsTrigger>
              </TabsList>

              <TabsContent value={selectedTab}>
                <div className="space-y-3">
                  {filteredTasks.map((task) => (
                    <Card key={task.id} className="border-0 shadow-sm hover:shadow-md transition-all duration-200">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 space-y-3">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-semibold text-sm">{task.title}</h3>
                              {getPriorityBadge(task.priority)}
                              {getStatusBadge(task.status)}
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {task.description}
                            </p>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                              <div className="flex items-center gap-2">
                                <Avatar className="h-5 w-5">
                                  <AvatarFallback className="text-xs">
                                    {task.assignee.split(' ').map(n => n[0]).join('')}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="hidden sm:block">{task.assignee}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                <span>Due: {task.dueDate}</span>
                              </div>
                              {task.comments > 0 && (
                                <div className="flex items-center gap-1">
                                  <MessageSquare className="h-3 w-3" />
                                  <span>{task.comments} comments</span>
                                </div>
                              )}
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>View Details</DropdownMenuItem>
                              <DropdownMenuItem>Edit Task</DropdownMenuItem>
                              <DropdownMenuItem>Change Status</DropdownMenuItem>
                              <DropdownMenuItem>Reassign</DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive">
                                Delete Task
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  
                  {filteredTasks.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                      No tasks found matching your criteria.
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}