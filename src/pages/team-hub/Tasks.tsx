import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  ChevronDown,
  ChevronRight
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
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

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

  const toggleRowExpansion = (taskId: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Tasks Management</h1>
        <div className="flex items-center gap-2">
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

      {/* Tasks Content */}
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
                {filteredTasks.length > 0 ? (
                  <div className="border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-8 border-r border-border/50"></TableHead>
                          <TableHead className="border-r border-border/50 whitespace-nowrap">Task</TableHead>
                          <TableHead className="w-48 border-r border-border/50 whitespace-nowrap">Assignee</TableHead>
                          <TableHead className="w-32 border-r border-border/50 whitespace-nowrap">Priority</TableHead>
                          <TableHead className="w-32 border-r border-border/50 whitespace-nowrap">Status</TableHead>
                          <TableHead className="w-32 border-r border-border/50 whitespace-nowrap">Due Date</TableHead>
                          <TableHead className="w-20 border-r border-border/50 whitespace-nowrap">Comments</TableHead>
                          <TableHead className="w-24 whitespace-nowrap">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredTasks.map((task) => {
                          const isExpanded = expandedRows.has(task.id);

                          return (
                            <React.Fragment key={task.id}>
                              <TableRow
                                className="cursor-pointer hover:bg-muted/50 transition-colors h-12"
                                onClick={() => toggleRowExpansion(task.id)}
                              >
                                <TableCell className="border-r border-border/50 py-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-5 w-5 p-0"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleRowExpansion(task.id);
                                    }}
                                  >
                                    {isExpanded ? (
                                      <ChevronDown className="h-3 w-3 transition-transform duration-200" />
                                    ) : (
                                      <ChevronRight className="h-3 w-3 transition-transform duration-200" />
                                    )}
                                  </Button>
                                </TableCell>

                                <TableCell className="border-r border-border/50 py-2" onClick={(e) => e.stopPropagation()}>
                                  <div className="space-y-1">
                                    <div className="font-medium text-sm">{task.title}</div>
                                    <div className="text-xs text-muted-foreground">
                                      ID: {task.id}
                                    </div>
                                  </div>
                                </TableCell>

                                <TableCell className="border-r border-border/50 py-2">
                                  <div className="flex items-center gap-2">
                                    <Avatar className="h-6 w-6">
                                      <AvatarFallback className="text-xs">
                                        {task.assignee.split(' ').map(n => n[0]).join('')}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span className="text-sm">{task.assignee}</span>
                                  </div>
                                </TableCell>

                                <TableCell className="border-r border-border/50 py-2">
                                  {getPriorityBadge(task.priority)}
                                </TableCell>

                                <TableCell className="border-r border-border/50 py-2">
                                  {getStatusBadge(task.status)}
                                </TableCell>

                                <TableCell className="border-r border-border/50 py-2">
                                  <div className="flex items-center gap-1 text-sm">
                                    <Calendar className="h-3 w-3" />
                                    <span>{task.dueDate}</span>
                                  </div>
                                </TableCell>

                                <TableCell className="border-r border-border/50 py-2">
                                  {task.comments > 0 && (
                                    <div className="flex items-center gap-1 text-sm">
                                      <MessageSquare className="h-3 w-3" />
                                      <span>{task.comments}</span>
                                    </div>
                                  )}
                                </TableCell>

                                <TableCell className="py-2" onClick={(e) => e.stopPropagation()}>
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
                                </TableCell>
                              </TableRow>

                              {/* Expanded Row Content */}
                              {isExpanded && (
                                <TableRow>
                                  <TableCell colSpan={8} className="p-0">
                                    <div className="bg-muted/30 p-6 border-t animate-in slide-in-from-top-2 duration-200">
                                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                                        {/* Task Details */}
                                        <div className="space-y-4">
                                          <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                                            Task Details
                                          </h4>

                                          <div className="space-y-3">
                                            <div>
                                              <div className="text-sm font-medium">Description</div>
                                              <div className="text-xs text-muted-foreground mt-1">
                                                {task.description}
                                              </div>
                                            </div>

                                            <div>
                                              <div className="text-sm font-medium">Task ID</div>
                                              <div className="text-xs text-muted-foreground font-mono">{task.id}</div>
                                            </div>

                                            <div>
                                              <div className="text-sm font-medium">Created</div>
                                              <div className="text-xs text-muted-foreground">{task.createdAt}</div>
                                            </div>
                                          </div>
                                        </div>

                                        {/* Assignment Information */}
                                        <div className="space-y-4">
                                          <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                                            Assignment Information
                                          </h4>

                                          <div className="space-y-3">
                                            <div className="flex items-center space-x-3">
                                              <User className="w-4 h-4 text-muted-foreground" />
                                              <div>
                                                <div className="text-sm font-medium">Assignee</div>
                                                <div className="text-xs text-muted-foreground">{task.assignee}</div>
                                              </div>
                                            </div>

                                            <div className="flex items-center space-x-3">
                                              <Calendar className="w-4 h-4 text-muted-foreground" />
                                              <div>
                                                <div className="text-sm font-medium">Due Date</div>
                                                <div className="text-xs text-muted-foreground">{task.dueDate}</div>
                                              </div>
                                            </div>

                                            <div className="flex items-center space-x-3">
                                              <MessageSquare className="w-4 h-4 text-muted-foreground" />
                                              <div>
                                                <div className="text-sm font-medium">Comments</div>
                                                <div className="text-xs text-muted-foreground">{task.comments} comments</div>
                                              </div>
                                            </div>
                                          </div>
                                        </div>

                                        {/* Status Information */}
                                        <div className="space-y-4">
                                          <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                                            Status Information
                                          </h4>

                                          <div className="space-y-3">
                                            <div className="flex justify-between items-center">
                                              <span className="text-sm">Priority</span>
                                              {getPriorityBadge(task.priority)}
                                            </div>

                                            <div className="flex justify-between items-center">
                                              <span className="text-sm">Status</span>
                                              {getStatusBadge(task.status)}
                                            </div>

                                            <div className="flex justify-between items-center">
                                              <span className="text-sm">Progress</span>
                                              <span className="text-xs px-2 py-1 bg-muted text-muted-foreground">
                                                {task.status === 'done' ? '100%' : task.status === 'in-progress' ? '50%' : '0%'}
                                              </span>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              )}
                            </React.Fragment>
                          );
                        })}
                      </TableBody>
                    </Table>

                    {filteredTasks.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        No tasks found matching your criteria.
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    No tasks found matching your criteria.
                  </div>
                )}
              </TabsContent>
            </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}