import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  ScrollText, 
  Search, 
  Filter, 
  Download, 
  RefreshCw,
  Clock,
  User,
  AlertTriangle,
  Info,
  CheckCircle,
  XCircle,
  Calendar,
  ChevronDown
} from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

// Mock data for demonstration
const mockLogs = [
  {
    id: 1,
    timestamp: new Date(),
    level: 'INFO',
    action: 'User Login',
    user: 'john.doe@company.com',
    details: 'User successfully logged in from IP 192.168.1.100',
    module: 'Authentication',
  },
  {
    id: 2,
    timestamp: new Date(Date.now() - 300000), // 5 minutes ago
    level: 'WARNING',
    action: 'Failed Login Attempt',
    user: 'jane.smith@company.com',
    details: 'Failed login attempt - incorrect password',
    module: 'Authentication',
  },
  {
    id: 3,
    timestamp: new Date(Date.now() - 600000), // 10 minutes ago
    level: 'ERROR',
    action: 'Database Connection Failed',
    user: 'System',
    details: 'Connection to database server timed out',
    module: 'System',
  },
  {
    id: 4,
    timestamp: new Date(Date.now() - 900000), // 15 minutes ago
    level: 'SUCCESS',
    action: 'Document Upload',
    user: 'mike.johnson@company.com',
    details: 'Successfully uploaded document: employee_contract.pdf',
    module: 'Documents',
  },
  {
    id: 5,
    timestamp: new Date(Date.now() - 1200000), // 20 minutes ago
    level: 'INFO',
    action: 'Password Changed',
    user: 'sarah.wilson@company.com',
    details: 'User changed password successfully',
    module: 'Authentication',
  },
]

export default function Logs() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedLevel, setSelectedLevel] = useState('ALL')
  const [selectedModule, setSelectedModule] = useState('ALL')
  const [logs, setLogs] = useState(mockLogs)

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'ERROR':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'WARNING':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'SUCCESS':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      default:
        return <Info className="h-4 w-4 text-blue-500" />
    }
  }

  const getLevelBadge = (level: string) => {
    const variants = {
      ERROR: 'bg-red-100 text-red-800 border-red-200',
      WARNING: 'bg-yellow-100 text-yellow-800 border-yellow-200', 
      SUCCESS: 'bg-green-100 text-green-800 border-green-200',
      INFO: 'bg-blue-100 text-blue-800 border-blue-200',
    }
    
    return (
      <Badge variant="outline" className={variants[level as keyof typeof variants] || variants.INFO}>
        {level}
      </Badge>
    )
  }

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.details.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesLevel = selectedLevel === 'ALL' || log.level === selectedLevel
    const matchesModule = selectedModule === 'ALL' || log.module === selectedModule
    
    return matchesSearch && matchesLevel && matchesModule
  })

  const handleRefresh = () => {
    // In a real app, this would fetch fresh data from the API
    console.log('Refreshing logs...')
  }

  const handleExport = () => {
    // In a real app, this would export logs to CSV/Excel
    console.log('Exporting logs...')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="w-2 h-8 bg-gradient-to-b from-primary to-primary/60 rounded-full" />
              <h1 className="text-2xl font-bold tracking-tight">System Logs</h1>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleRefresh} className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
              <Button variant="outline" size="sm" onClick={handleExport} className="gap-2">
                <Download className="h-4 w-4" />
                Export
              </Button>
            </div>
          </div>
          <p className="text-muted-foreground ml-6">Monitor system activities and user actions</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Info className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <div className="text-lg font-bold text-blue-600">
                    {logs.filter(log => log.level === 'INFO').length}
                  </div>
                  <div className="text-xs text-muted-foreground">Info</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <div className="text-lg font-bold text-green-600">
                    {logs.filter(log => log.level === 'SUCCESS').length}
                  </div>
                  <div className="text-xs text-muted-foreground">Success</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <div className="text-lg font-bold text-yellow-600">
                    {logs.filter(log => log.level === 'WARNING').length}
                  </div>
                  <div className="text-xs text-muted-foreground">Warnings</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                  <XCircle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <div className="text-lg font-bold text-red-600">
                    {logs.filter(log => log.level === 'ERROR').length}
                  </div>
                  <div className="text-xs text-muted-foreground">Errors</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="border-0 shadow-md mb-6">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-lg">
              <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
                <Filter className="h-4 w-4 text-violet-600" />
              </div>
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="search" className="text-sm font-medium">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Search logs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium">Log Level</Label>
                <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Levels</SelectItem>
                    <SelectItem value="INFO">Info</SelectItem>
                    <SelectItem value="SUCCESS">Success</SelectItem>
                    <SelectItem value="WARNING">Warning</SelectItem>
                    <SelectItem value="ERROR">Error</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Module</Label>
                <Select value={selectedModule} onValueChange={setSelectedModule}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select module" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Modules</SelectItem>
                    <SelectItem value="Authentication">Authentication</SelectItem>
                    <SelectItem value="System">System</SelectItem>
                    <SelectItem value="Documents">Documents</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Logs Table */}
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <ScrollText className="h-4 w-4 text-emerald-600" />
                </div>
                Activity Logs
                <Badge variant="secondary" className="ml-2">
                  {filteredLogs.length} entries
                </Badge>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="font-semibold">Level</TableHead>
                    <TableHead className="font-semibold">Timestamp</TableHead>
                    <TableHead className="font-semibold">Action</TableHead>
                    <TableHead className="font-semibold">User</TableHead>
                    <TableHead className="font-semibold">Module</TableHead>
                    <TableHead className="font-semibold">Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <div className="flex flex-col items-center gap-2">
                          <ScrollText className="h-8 w-8 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">No logs found matching your criteria</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredLogs.map((log) => (
                      <TableRow key={log.id} className="hover:bg-muted/50">
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getLevelIcon(log.level)}
                            {getLevelBadge(log.level)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            {log.timestamp.toLocaleString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-sm">{log.action}</div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-sm">
                            <User className="h-3 w-3 text-muted-foreground" />
                            {log.user}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {log.module}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-muted-foreground max-w-md truncate">
                            {log.details}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}