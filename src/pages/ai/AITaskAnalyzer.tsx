import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Brain,
  TrendingUp,
  TrendingDown,
  Clock,
  Users,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Target,
  Lightbulb,
  RefreshCw,
  Bot,
  Calendar,
  User,
  ArrowRight,
  Zap,
  PieChart
} from 'lucide-react';
import { useTasks } from '@/hooks/useTasks';
import { useUsers } from '@/hooks/useUsers';
import { useToast } from '@/components/ui/use-toast';

interface TaskAnalytics {
  totalTasks: number;
  pendingTasks: number;
  inProgressTasks: number;
  completedTasks: number;
  overdueTasks: number;
  completionRate: number;
  averageCompletionTime: number;
  tasksByPriority: {
    low: number;
    medium: number;
    high: number;
    urgent: number;
  };
  employeePerformance: Array<{
    userId: string;
    name: string;
    tasksAssigned: number;
    tasksCompleted: number;
    completionRate: number;
    avgCompletionTime: number;
  }>;
}

interface AIInsight {
  type: 'productivity' | 'bottleneck' | 'suggestion' | 'trend' | 'alert';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  actionable: boolean;
  recommendations?: string[];
}

export default function AITaskAnalyzer() {
  const { tasks, loading: tasksLoading, refetch } = useTasks();
  const { users } = useUsers();
  const { toast } = useToast();

  const [analytics, setAnalytics] = useState<TaskAnalytics | null>(null);
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  const [aiResponse, setAiResponse] = useState('');

  // Calculate task analytics
  useEffect(() => {
    if (tasks && users) {
      calculateAnalytics();
    }
  }, [tasks, users]);

  const calculateAnalytics = () => {
    if (!tasks || !users) return;

    const totalTasks = tasks.length;
    const pendingTasks = tasks.filter(t => t.status === 'pending').length;
    const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length;
    const completedTasks = tasks.filter(t => t.status === 'approved' || t.status === 'done_auto_approved').length;
    const overdueTasks = tasks.filter(t => {
      if (!t.due_date) return false;
      return new Date(t.due_date) < new Date() && !['approved', 'done_auto_approved'].includes(t.status);
    }).length;

    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    const tasksByPriority = {
      low: tasks.filter(t => t.priority === 'low').length,
      medium: tasks.filter(t => t.priority === 'medium').length,
      high: tasks.filter(t => t.priority === 'high').length,
      urgent: tasks.filter(t => t.priority === 'urgent').length,
    };

    // Calculate employee performance
    const employeeStats = new Map();

    tasks.forEach(task => {
      if (!task.assigned_to) return;

      const userId = task.assigned_to;
      if (!employeeStats.has(userId)) {
        const user = users.find(u => u.id === userId);
        employeeStats.set(userId, {
          userId,
          name: user?.full_name || 'Unknown User',
          tasksAssigned: 0,
          tasksCompleted: 0,
          completionTimes: []
        });
      }

      const stats = employeeStats.get(userId);
      stats.tasksAssigned++;

      if (['approved', 'done_auto_approved'].includes(task.status)) {
        stats.tasksCompleted++;

        // Calculate completion time if available
        if (task.created_at && task.updated_at) {
          const completionTime = new Date(task.updated_at).getTime() - new Date(task.created_at).getTime();
          stats.completionTimes.push(completionTime / (1000 * 60 * 60 * 24)); // Convert to days
        }
      }
    });

    const employeePerformance = Array.from(employeeStats.values()).map(stats => ({
      ...stats,
      completionRate: stats.tasksAssigned > 0 ? (stats.tasksCompleted / stats.tasksAssigned) * 100 : 0,
      avgCompletionTime: stats.completionTimes.length > 0
        ? stats.completionTimes.reduce((a, b) => a + b, 0) / stats.completionTimes.length
        : 0
    }));

    const avgCompletionTime = employeePerformance.reduce((sum, emp) => sum + emp.avgCompletionTime, 0) / employeePerformance.length || 0;

    setAnalytics({
      totalTasks,
      pendingTasks,
      inProgressTasks,
      completedTasks,
      overdueTasks,
      completionRate,
      averageCompletionTime: avgCompletionTime,
      tasksByPriority,
      employeePerformance: employeePerformance.sort((a, b) => b.completionRate - a.completionRate)
    });

    generateAIInsights({
      totalTasks,
      pendingTasks,
      inProgressTasks,
      completedTasks,
      overdueTasks,
      completionRate,
      averageCompletionTime: avgCompletionTime,
      tasksByPriority,
      employeePerformance
    });
  };

  const generateAIInsights = (data: TaskAnalytics) => {
    const insights: AIInsight[] = [];

    // Productivity insights
    if (data.completionRate < 60) {
      insights.push({
        type: 'productivity',
        title: 'Low Task Completion Rate',
        description: `Current completion rate is ${data.completionRate.toFixed(1)}%, which is below optimal levels.`,
        impact: 'high',
        actionable: true,
        recommendations: [
          'Review task complexity and break down large tasks',
          'Provide additional training or resources',
          'Consider redistributing workload',
          'Implement daily check-ins for pending tasks'
        ]
      });
    }

    // Bottleneck detection
    if (data.overdueTasks > data.totalTasks * 0.2) {
      insights.push({
        type: 'bottleneck',
        title: 'High Number of Overdue Tasks',
        description: `${data.overdueTasks} tasks are overdue, indicating potential bottlenecks in your workflow.`,
        impact: 'high',
        actionable: true,
        recommendations: [
          'Prioritize overdue tasks immediately',
          'Investigate common causes of delays',
          'Adjust deadlines to be more realistic',
          'Implement automated deadline reminders'
        ]
      });
    }

    // Priority distribution analysis
    const urgentRatio = data.tasksByPriority.urgent / data.totalTasks;
    if (urgentRatio > 0.3) {
      insights.push({
        type: 'alert',
        title: 'Too Many Urgent Tasks',
        description: `${(urgentRatio * 100).toFixed(1)}% of tasks are marked as urgent, which may indicate poor planning.`,
        impact: 'medium',
        actionable: true,
        recommendations: [
          'Review task prioritization criteria',
          'Implement better project planning',
          'Address root causes of urgency',
          'Consider priority escalation process'
        ]
      });
    }

    // Employee performance insights
    const lowPerformers = data.employeePerformance.filter(emp => emp.completionRate < 50);
    if (lowPerformers.length > 0) {
      insights.push({
        type: 'suggestion',
        title: 'Employee Performance Opportunities',
        description: `${lowPerformers.length} employees have completion rates below 50%.`,
        impact: 'medium',
        actionable: true,
        recommendations: [
          'Provide one-on-one coaching sessions',
          'Identify skill gaps and training needs',
          'Review task assignments for complexity',
          'Consider mentorship programs'
        ]
      });
    }

    // Positive trends
    if (data.completionRate > 80) {
      insights.push({
        type: 'trend',
        title: 'Excellent Team Performance',
        description: `Your team has achieved a ${data.completionRate.toFixed(1)}% completion rate!`,
        impact: 'high',
        actionable: false,
        recommendations: [
          'Celebrate team success',
          'Document successful practices',
          'Share best practices across teams',
          'Consider taking on additional projects'
        ]
      });
    }

    // Workload distribution
    const taskDistribution = data.employeePerformance.map(emp => emp.tasksAssigned);
    const maxTasks = Math.max(...taskDistribution);
    const minTasks = Math.min(...taskDistribution);

    if (maxTasks > minTasks * 2) {
      insights.push({
        type: 'suggestion',
        title: 'Uneven Workload Distribution',
        description: 'Task distribution across team members is uneven, which could lead to burnout.',
        impact: 'medium',
        actionable: true,
        recommendations: [
          'Redistribute tasks more evenly',
          'Consider individual capacity and skills',
          'Implement workload monitoring',
          'Create task assignment guidelines'
        ]
      });
    }

    setInsights(insights);
  };

  const analyzeWithCustomPrompt = async () => {
    if (!customPrompt.trim() || !analytics) {
      toast({
        title: 'Error',
        description: 'Please enter a prompt for analysis.',
        variant: 'destructive'
      });
      return;
    }

    setAiAnalyzing(true);

    try {
      // Simulate AI analysis - in a real app, this would call an AI service
      await new Promise(resolve => setTimeout(resolve, 2000));

      const analysisContext = `
Based on your task management data:
- Total Tasks: ${analytics.totalTasks}
- Completion Rate: ${analytics.completionRate.toFixed(1)}%
- Overdue Tasks: ${analytics.overdueTasks}
- Team Members: ${analytics.employeePerformance.length}
- Average Completion Time: ${analytics.averageCompletionTime.toFixed(1)} days

User Question: ${customPrompt}
      `;

      // Generate contextual response based on the prompt
      let response = '';
      const prompt = customPrompt.toLowerCase();

      if (prompt.includes('improve') || prompt.includes('optimize')) {
        response = `Based on your current task data, here are my recommendations to improve performance:

1. **Task Prioritization**: With ${analytics.tasksByPriority.urgent} urgent tasks, consider implementing a more structured priority system.

2. **Team Efficiency**: Your completion rate of ${analytics.completionRate.toFixed(1)}% ${analytics.completionRate > 75 ? 'is excellent! Focus on maintaining this momentum.' : 'has room for improvement. Consider daily standups and clearer task definitions.'}

3. **Workload Management**: ${analytics.overdueTasks > 0 ? `Address the ${analytics.overdueTasks} overdue tasks immediately to prevent further delays.` : 'Great job staying on top of deadlines!'}

4. **Resource Allocation**: Consider redistributing tasks among your ${analytics.employeePerformance.length} team members for better balance.`;
      } else if (prompt.includes('bottleneck') || prompt.includes('delay')) {
        response = `I've identified several potential bottlenecks in your workflow:

1. **Overdue Tasks**: ${analytics.overdueTasks} tasks are currently overdue, which suggests capacity or complexity issues.

2. **Task Distribution**: Some team members may be overloaded while others have capacity.

3. **Priority Management**: ${analytics.tasksByPriority.urgent} urgent tasks might be creating pressure and affecting quality.

**Recommendations**:
- Implement daily task reviews
- Break down complex tasks into smaller chunks
- Use time-boxing techniques for better estimation
- Create escalation procedures for blocked tasks`;
      } else if (prompt.includes('team') || prompt.includes('employee')) {
        const topPerformer = analytics.employeePerformance[0];
        response = `Team Performance Analysis:

**Top Performer**: ${topPerformer?.name} with ${topPerformer?.completionRate.toFixed(1)}% completion rate

**Team Overview**:
- ${analytics.employeePerformance.filter(emp => emp.completionRate > 80).length} high performers (>80%)
- ${analytics.employeePerformance.filter(emp => emp.completionRate < 50).length} employees need support (<50%)

**Recommendations**:
- Pair high performers with those needing improvement
- Provide targeted training for skill gaps
- Recognize and reward top performers
- Create knowledge sharing sessions`;
      } else {
        response = `Based on your task management data, here's my analysis:

Your team is managing ${analytics.totalTasks} tasks with a ${analytics.completionRate.toFixed(1)}% completion rate.

**Key Insights**:
- Current workload: ${analytics.pendingTasks} pending, ${analytics.inProgressTasks} in progress
- Time management: Average completion time is ${analytics.averageCompletionTime.toFixed(1)} days
- Priority distribution: ${analytics.tasksByPriority.high + analytics.tasksByPriority.urgent} high/urgent priority tasks

**Next Steps**:
1. Focus on the ${analytics.overdueTasks} overdue tasks first
2. Review task assignments for better distribution
3. Consider implementing automated reminders for due dates
4. Schedule regular team performance reviews`;
      }

      setAiResponse(response);
    } catch (error) {
      toast({
        title: 'Analysis Error',
        description: 'Failed to generate AI analysis. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setAiAnalyzing(false);
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'productivity': return <TrendingUp className="h-5 w-5" />;
      case 'bottleneck': return <AlertTriangle className="h-5 w-5" />;
      case 'suggestion': return <Lightbulb className="h-5 w-5" />;
      case 'trend': return <BarChart3 className="h-5 w-5" />;
      case 'alert': return <AlertTriangle className="h-5 w-5" />;
      default: return <Brain className="h-5 w-5" />;
    }
  };

  if (tasksLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Brain className="h-8 w-8 text-blue-600" />
          <h1 className="text-2xl font-bold">AI Task Analyzer</h1>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4 animate-spin" />
              Loading task data for analysis...
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Brain className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold">AI Task Analyzer</h1>
            <p className="text-gray-600">AI-powered insights and recommendations for your team's task management</p>
          </div>
        </div>
        <Button onClick={refetch} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh Data
        </Button>
      </div>

      {analytics && (
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="insights">AI Insights</TabsTrigger>
            <TabsTrigger value="performance">Team Performance</TabsTrigger>
            <TabsTrigger value="custom">Custom Analysis</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <Target className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Tasks</p>
                      <p className="text-2xl font-bold">{analytics.totalTasks}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-green-50 rounded-lg">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Completion Rate</p>
                      <p className="text-2xl font-bold">{analytics.completionRate.toFixed(1)}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-yellow-50 rounded-lg">
                      <Clock className="h-6 w-6 text-yellow-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Avg. Completion</p>
                      <p className="text-2xl font-bold">{analytics.averageCompletionTime.toFixed(1)}d</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-red-50 rounded-lg">
                      <AlertTriangle className="h-6 w-6 text-red-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Overdue Tasks</p>
                      <p className="text-2xl font-bold">{analytics.overdueTasks}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Task Status Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5" />
                    Task Status Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Pending</span>
                      <Badge variant="secondary">{analytics.pendingTasks}</Badge>
                    </div>
                    <Progress value={(analytics.pendingTasks / analytics.totalTasks) * 100} className="h-2" />

                    <div className="flex items-center justify-between">
                      <span className="text-sm">In Progress</span>
                      <Badge variant="secondary">{analytics.inProgressTasks}</Badge>
                    </div>
                    <Progress value={(analytics.inProgressTasks / analytics.totalTasks) * 100} className="h-2" />

                    <div className="flex items-center justify-between">
                      <span className="text-sm">Completed</span>
                      <Badge variant="secondary">{analytics.completedTasks}</Badge>
                    </div>
                    <Progress value={(analytics.completedTasks / analytics.totalTasks) * 100} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Priority Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Urgent</span>
                      <Badge variant="destructive">{analytics.tasksByPriority.urgent}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">High</span>
                      <Badge variant="secondary">{analytics.tasksByPriority.high}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Medium</span>
                      <Badge variant="outline">{analytics.tasksByPriority.medium}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Low</span>
                      <Badge variant="outline">{analytics.tasksByPriority.low}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* AI Insights Tab */}
          <TabsContent value="insights" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="h-5 w-5" />
                  AI-Generated Insights & Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                {insights.length > 0 ? (
                  <div className="space-y-4">
                    {insights.map((insight, index) => (
                      <Card key={index} className={`border-l-4 ${getImpactColor(insight.impact)}`}>
                        <CardContent className="pt-4">
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0">
                              {getInsightIcon(insight.type)}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-semibold">{insight.title}</h4>
                                <Badge variant={insight.impact === 'high' ? 'destructive' : insight.impact === 'medium' ? 'default' : 'secondary'}>
                                  {insight.impact} impact
                                </Badge>
                              </div>
                              <p className="text-gray-600 mb-3">{insight.description}</p>
                              {insight.recommendations && (
                                <div>
                                  <h5 className="font-medium mb-2">Recommendations:</h5>
                                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                                    {insight.recommendations.map((rec, recIndex) => (
                                      <li key={recIndex}>{rec}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No insights available. Try refreshing the data or check back later.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Team Performance Tab */}
          <TabsContent value="performance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Team Performance Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.employeePerformance.map((employee, index) => (
                    <Card key={employee.userId} className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
                            <User className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <h4 className="font-semibold">{employee.name}</h4>
                            <p className="text-sm text-gray-600">
                              {employee.tasksCompleted}/{employee.tasksAssigned} tasks completed
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold">
                            {employee.completionRate.toFixed(1)}%
                          </div>
                          <div className="text-sm text-gray-600">
                            Avg: {employee.avgCompletionTime.toFixed(1)}d
                          </div>
                        </div>
                      </div>
                      <Progress value={employee.completionRate} className="h-2" />
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Custom Analysis Tab */}
          <TabsContent value="custom" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Custom AI Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Ask AI about your task data:
                  </label>
                  <Textarea
                    placeholder="e.g., How can I improve team productivity? What are the main bottlenecks? Who needs more support?"
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    className="min-h-[80px]"
                  />
                </div>
                <Button
                  onClick={analyzeWithCustomPrompt}
                  disabled={aiAnalyzing || !customPrompt.trim()}
                  className="w-full"
                >
                  {aiAnalyzing ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Brain className="h-4 w-4 mr-2" />
                      Analyze with AI
                    </>
                  )}
                </Button>

                {aiResponse && (
                  <Card className="mt-4">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Bot className="h-5 w-5" />
                        AI Analysis
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-[300px]">
                        <div className="whitespace-pre-wrap text-sm">{aiResponse}</div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}