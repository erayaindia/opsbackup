import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Wrench,
  Database,
  RefreshCw,
  Settings,
  Tool,
  Cog,
  Box,
  FileJson,
  Terminal,
  Code
} from 'lucide-react'

const toolCategories = [
  {
    title: 'Database Tools',
    icon: Database,
    color: 'emerald',
    tools: [
      {
        name: 'Database Backup',
        description: 'Create and restore database backups',
        icon: Database,
      },
      {
        name: 'Schema Migration',
        description: 'Manage database schema changes',
        icon: RefreshCw,
      },
    ]
  },
  {
    title: 'Development Tools',
    icon: Code,
    color: 'violet',
    tools: [
      {
        name: 'API Tester',
        description: 'Test and debug API endpoints',
        icon: Terminal,
      },
      {
        name: 'JSON Formatter',
        description: 'Format and validate JSON data',
        icon: FileJson,
      },
    ]
  },
  {
    title: 'System Tools',
    icon: Cog,
    color: 'blue',
    tools: [
      {
        name: 'Cache Manager',
        description: 'Clear and manage system cache',
        icon: Box,
      },
      {
        name: 'System Settings',
        description: 'Configure system parameters',
        icon: Settings,
      },
    ]
  },
]

export default function Tools() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="w-2 h-8 bg-gradient-to-b from-primary to-primary/60 rounded-full" />
              <h1 className="text-2xl font-bold tracking-tight">Tools</h1>
            </div>
          </div>
          <p className="text-muted-foreground ml-6">Utility tools and system management</p>
        </div>

        {/* Tool Categories */}
        <div className="space-y-6">
          {toolCategories.map((category, categoryIndex) => (
            <Card key={categoryIndex} className="border-0 shadow-md">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-lg">
                  <div className={`w-8 h-8 rounded-lg bg-${category.color}-500/10 flex items-center justify-center`}>
                    <category.icon className={`h-4 w-4 text-${category.color}-600`} />
                  </div>
                  {category.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {category.tools.map((tool, toolIndex) => (
                    <Card key={toolIndex} className="hover:shadow-lg transition-shadow cursor-pointer border">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className={`w-10 h-10 rounded-lg bg-${category.color}-500/10 flex items-center justify-center flex-shrink-0`}>
                            <tool.icon className={`h-5 w-5 text-${category.color}-600`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-sm mb-1">{tool.name}</h3>
                            <p className="text-xs text-muted-foreground">{tool.description}</p>
                            <Button
                              size="sm"
                              variant="outline"
                              className="mt-3 w-full"
                            >
                              Open Tool
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Coming Soon Section */}
        <Card className="border-0 shadow-md mt-6">
          <CardContent className="p-8">
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="w-12 h-12 rounded-lg bg-orange-500/10 flex items-center justify-center">
                <Wrench className="h-6 w-6 text-orange-600" />
              </div>
              <h3 className="font-semibold text-lg">More Tools Coming Soon</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                We're constantly adding new tools to help you manage your operations more efficiently.
                Check back regularly for updates.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
